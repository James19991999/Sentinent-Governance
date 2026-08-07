import type { FairnessReport, FairnessResult, PredictionRecord } from "@/lib/types";

/**
 * Real fairness-metrics engine.
 *
 * This is intentionally NOT a call to a third-party "bias detection API" —
 * no such generic hosted classifier exists. Instead it implements the
 * standard statistical fairness formulas used by production responsible-AI
 * tooling (comparable to what Fairlearn / AIF360 compute):
 *
 *   - Selection rate per group:            P(ŷ = 1 | group)
 *   - Disparate impact ratio:              selectionRate(group) / selectionRate(reference)
 *   - Statistical parity difference:       selectionRate(group) - selectionRate(reference)
 *   - True/false positive rate per group   (only when ground-truth labels are supplied)
 *   - Equal opportunity difference:        TPR(group) - TPR(reference)
 *
 * All numbers below are computed from whatever PredictionRecord[] is passed
 * in — a customer-uploaded CSV of real model predictions plus a protected
 * attribute column. Nothing here is hardcoded or randomly generated.
 *
 * The legal/regulatory "four-fifths rule" (EEOC) flags a group as having a
 * disparate-impact concern when its selection-rate ratio to the reference
 * group's falls below 0.8 (or, symmetrically, exceeds 1.25).
 */

const FOUR_FIFTHS_LOWER = 0.8;
const FOUR_FIFTHS_UPPER = 1.25;

export class InsufficientDataError extends Error {}

function selectionRate(rows: PredictionRecord[]): number {
  if (rows.length === 0) return 0;
  return rows.filter((r) => r.predictedPositive).length / rows.length;
}

function truePositiveRate(rows: PredictionRecord[]): number | undefined {
  const withLabels = rows.filter((r) => r.actualPositive !== undefined);
  if (withLabels.length === 0) return undefined;
  const positives = withLabels.filter((r) => r.actualPositive === true);
  if (positives.length === 0) return undefined;
  const truePositives = positives.filter((r) => r.predictedPositive).length;
  return truePositives / positives.length;
}

function falsePositiveRate(rows: PredictionRecord[]): number | undefined {
  const withLabels = rows.filter((r) => r.actualPositive !== undefined);
  if (withLabels.length === 0) return undefined;
  const negatives = withLabels.filter((r) => r.actualPositive === false);
  if (negatives.length === 0) return undefined;
  const falsePositives = negatives.filter((r) => r.predictedPositive).length;
  return falsePositives / negatives.length;
}

export function computeFairnessReport(params: {
  orgId: string;
  modelName: string;
  createdBy: string;
  rows: PredictionRecord[];
  /** Group to compare all others against. Defaults to the largest group. */
  referenceGroup?: string;
}): Omit<FairnessReport, "id" | "createdAt"> {
  const { orgId, modelName, createdBy, rows } = params;

  if (rows.length < 10) {
    throw new InsufficientDataError(
      "At least 10 prediction records are required to compute a statistically meaningful fairness report."
    );
  }

  const groups = Array.from(new Set(rows.map((r) => r.group))).sort();
  if (groups.length < 2) {
    throw new InsufficientDataError(
      "At least two distinct groups (a protected-attribute column) are required to compute disparate-impact metrics."
    );
  }

  const byGroup = new Map<string, PredictionRecord[]>();
  for (const g of groups) byGroup.set(g, rows.filter((r) => r.group === g));

  const referenceGroup =
    params.referenceGroup && groups.includes(params.referenceGroup)
      ? params.referenceGroup
      : groups.reduce((a, b) => ((byGroup.get(a)?.length ?? 0) >= (byGroup.get(b)?.length ?? 0) ? a : b));

  const results: FairnessResult[] = groups.map((g) => {
    const groupRows = byGroup.get(g)!;
    return {
      group: g,
      n: groupRows.length,
      selectionRate: round(selectionRate(groupRows)),
      truePositiveRate: roundOrUndefined(truePositiveRate(groupRows)),
      falsePositiveRate: roundOrUndefined(falsePositiveRate(groupRows)),
    };
  });

  const refSelectionRate = selectionRate(byGroup.get(referenceGroup)!);
  const refTPR = truePositiveRate(byGroup.get(referenceGroup)!);

  const disparateImpactRatio: Record<string, number> = {};
  const statisticalParityDifference: Record<string, number> = {};
  const equalOpportunityDifference: Record<string, number> = {};
  const fourFifthsViolations: string[] = [];
  let hasTprForAllGroups = refTPR !== undefined;

  for (const g of groups) {
    if (g === referenceGroup) continue;
    const groupRows = byGroup.get(g)!;
    const gRate = selectionRate(groupRows);
    const ratio = refSelectionRate === 0 ? (gRate === 0 ? 1 : Infinity) : gRate / refSelectionRate;
    disparateImpactRatio[g] = round(ratio);
    statisticalParityDifference[g] = round(gRate - refSelectionRate);

    if (ratio < FOUR_FIFTHS_LOWER || ratio > FOUR_FIFTHS_UPPER) {
      fourFifthsViolations.push(g);
    }

    const gTPR = truePositiveRate(groupRows);
    if (gTPR !== undefined && refTPR !== undefined) {
      equalOpportunityDifference[g] = round(gTPR - refTPR);
    } else {
      hasTprForAllGroups = false;
    }
  }

  // Composite fairness index: 100 minus a penalty proportional to how far
  // each non-reference group's DI ratio sits outside the [0.8, 1.25] band,
  // capped at 100 penalty points. This is a deterministic function of the
  // computed ratios above, not an independent guess.
  const ratios = Object.values(disparateImpactRatio).filter((r) => Number.isFinite(r));
  const penalty =
    ratios.length === 0
      ? 0
      : ratios.reduce((sum, ratio) => {
          const distance =
            ratio < FOUR_FIFTHS_LOWER
              ? FOUR_FIFTHS_LOWER - ratio
              : ratio > FOUR_FIFTHS_UPPER
              ? ratio - FOUR_FIFTHS_UPPER
              : 0;
          return sum + Math.min(distance * 100, 40);
        }, 0) / ratios.length;
  const fairnessIndex = Math.max(0, Math.round(100 - penalty));

  const complianceRisk: FairnessReport["complianceRisk"] =
    fourFifthsViolations.length === 0 ? "Low" : fourFifthsViolations.length === 1 ? "Medium" : "High";

  return {
    orgId,
    modelName,
    createdBy,
    rowCount: rows.length,
    referenceGroup,
    results,
    disparateImpactRatio,
    statisticalParityDifference,
    equalOpportunityDifference: hasTprForAllGroups ? equalOpportunityDifference : null,
    fourFifthsViolations,
    fairnessIndex,
    complianceRisk,
  };
}

/** Parses a CSV string into PredictionRecord[]. Expects headers: predicted,actual(optional),group */
export function parsePredictionsCsv(csv: string): PredictionRecord[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new InsufficientDataError("CSV must include a header row and at least one data row.");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const predictedIdx = header.indexOf("predicted");
  const actualIdx = header.indexOf("actual");
  const groupIdx = header.indexOf("group");

  if (predictedIdx === -1 || groupIdx === -1) {
    throw new InsufficientDataError('CSV header must include at least "predicted" and "group" columns.');
  }

  const toBool = (v: string) => ["1", "true", "yes", "positive"].includes(v.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const record: PredictionRecord = {
      predictedPositive: toBool(cols[predictedIdx] ?? ""),
      group: (cols[groupIdx] ?? "unknown").trim(),
    };
    if (actualIdx !== -1 && cols[actualIdx] !== undefined && cols[actualIdx].trim() !== "") {
      record.actualPositive = toBool(cols[actualIdx]);
    }
    return record;
  });
}

function round(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Math.round(n * 1000) / 1000;
}

function roundOrUndefined(n: number | undefined): number | undefined {
  return n === undefined ? undefined : round(n);
}
