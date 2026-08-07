import { computeFairnessReport, parsePredictionsCsv, InsufficientDataError } from "@/lib/fairness/engine";
import type { PredictionRecord } from "@/lib/types";

describe("computeFairnessReport", () => {
  it("throws when fewer than 10 records are supplied", () => {
    const rows: PredictionRecord[] = Array.from({ length: 5 }, () => ({
      predictedPositive: true,
      group: "A",
    }));
    expect(() =>
      computeFairnessReport({ orgId: "org1", modelName: "m", createdBy: "u1", rows })
    ).toThrow(InsufficientDataError);
  });

  it("throws when only one group is present", () => {
    const rows: PredictionRecord[] = Array.from({ length: 20 }, () => ({
      predictedPositive: true,
      group: "A",
    }));
    expect(() =>
      computeFairnessReport({ orgId: "org1", modelName: "m", createdBy: "u1", rows })
    ).toThrow(InsufficientDataError);
  });

  it("computes selection rate and disparate impact ratio correctly against hand-computed values", () => {
    // Reference group A: 10 rows, 8 predicted positive -> selection rate 0.8
    // Group B: 10 rows, 4 predicted positive -> selection rate 0.4
    // Expected DI ratio for B vs A = 0.4 / 0.8 = 0.5 -> violates four-fifths rule
    const rows: PredictionRecord[] = [
      ...Array.from({ length: 8 }, () => ({ predictedPositive: true, group: "A" })),
      ...Array.from({ length: 2 }, () => ({ predictedPositive: false, group: "A" })),
      ...Array.from({ length: 4 }, () => ({ predictedPositive: true, group: "B" })),
      ...Array.from({ length: 6 }, () => ({ predictedPositive: false, group: "B" })),
    ];

    const report = computeFairnessReport({
      orgId: "org1",
      modelName: "test-model",
      createdBy: "u1",
      rows,
      referenceGroup: "A",
    });

    expect(report.referenceGroup).toBe("A");
    expect(report.results.find((r) => r.group === "A")?.selectionRate).toBeCloseTo(0.8);
    expect(report.results.find((r) => r.group === "B")?.selectionRate).toBeCloseTo(0.4);
    expect(report.disparateImpactRatio.B).toBeCloseTo(0.5);
    expect(report.statisticalParityDifference.B).toBeCloseTo(-0.4);
    expect(report.fourFifthsViolations).toContain("B");
    expect(report.complianceRisk).toBe("Medium");
  });

  it("reports Low compliance risk and no violations when selection rates are equal", () => {
    const rows: PredictionRecord[] = [
      ...Array.from({ length: 5 }, () => ({ predictedPositive: true, group: "A" })),
      ...Array.from({ length: 5 }, () => ({ predictedPositive: false, group: "A" })),
      ...Array.from({ length: 5 }, () => ({ predictedPositive: true, group: "B" })),
      ...Array.from({ length: 5 }, () => ({ predictedPositive: false, group: "B" })),
    ];

    const report = computeFairnessReport({
      orgId: "org1",
      modelName: "test-model",
      createdBy: "u1",
      rows,
      referenceGroup: "A",
    });

    expect(report.disparateImpactRatio.B).toBeCloseTo(1);
    expect(report.fourFifthsViolations).toHaveLength(0);
    expect(report.complianceRisk).toBe("Low");
    expect(report.fairnessIndex).toBe(100);
  });

  it("computes equal opportunity difference only when ground-truth labels exist for all groups", () => {
    const rowsWithLabels: PredictionRecord[] = [
      ...Array.from({ length: 10 }, (_, i) => ({
        predictedPositive: i < 8,
        actualPositive: true,
        group: "A",
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        predictedPositive: i < 5,
        actualPositive: true,
        group: "B",
      })),
    ];

    const report = computeFairnessReport({
      orgId: "org1",
      modelName: "test-model",
      createdBy: "u1",
      rows: rowsWithLabels,
      referenceGroup: "A",
    });

    expect(report.equalOpportunityDifference).not.toBeNull();
    expect(report.equalOpportunityDifference?.B).toBeCloseTo(0.5 - 0.8);

    const rowsNoLabels: PredictionRecord[] = rowsWithLabels.map(({ predictedPositive, group }) => ({
      predictedPositive,
      group,
    }));
    const report2 = computeFairnessReport({
      orgId: "org1",
      modelName: "test-model",
      createdBy: "u1",
      rows: rowsNoLabels,
      referenceGroup: "A",
    });
    expect(report2.equalOpportunityDifference).toBeNull();
  });

  it("defaults the reference group to the largest group when none is specified", () => {
    const rows: PredictionRecord[] = [
      ...Array.from({ length: 15 }, () => ({ predictedPositive: true, group: "Large" })),
      ...Array.from({ length: 3 }, () => ({ predictedPositive: true, group: "Small" })),
    ];
    const report = computeFairnessReport({ orgId: "org1", modelName: "m", createdBy: "u1", rows });
    expect(report.referenceGroup).toBe("Large");
  });
});

describe("parsePredictionsCsv", () => {
  it("parses a well-formed CSV with predicted, actual, and group columns", () => {
    const csv = "predicted,actual,group\n1,1,A\n0,1,A\n1,0,B\n";
    const rows = parsePredictionsCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ predictedPositive: true, actualPositive: true, group: "A" });
    expect(rows[2]).toEqual({ predictedPositive: true, actualPositive: false, group: "B" });
  });

  it("parses without an actual column", () => {
    const csv = "predicted,group\ntrue,A\nfalse,B\n";
    const rows = parsePredictionsCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].actualPositive).toBeUndefined();
  });

  it("throws on missing required columns", () => {
    const csv = "foo,bar\n1,2\n";
    expect(() => parsePredictionsCsv(csv)).toThrow(InsufficientDataError);
  });

  it("throws on a header-only CSV", () => {
    const csv = "predicted,group\n";
    expect(() => parsePredictionsCsv(csv)).toThrow(InsufficientDataError);
  });
});
