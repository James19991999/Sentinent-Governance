#!/usr/bin/env node
/**
 * Real-browser accessibility check: launches Chromium, runs axe-core
 * against every static/public page in both light and dark theme, and
 * fails (exit 1) if any violation is found.
 *
 * Why this exists as a separate script instead of a Jest test: the
 * jest-axe tests in __tests__/a11y/ run in jsdom, which does not compute
 * real layout/paint — it can catch missing ARIA labels and structural
 * issues, but it CANNOT reliably catch color-contrast violations (jsdom
 * has no real rendering engine). This script is what actually caught a
 * real WCAG AA contrast failure in the secondary teal color that every
 * jsdom-based test passed cleanly. Run this before shipping any design
 * token change.
 *
 * Requires a Chromium binary. In CI: `npx playwright install chromium`
 * first. Locally, if you already have Playwright's browsers installed
 * for another project, this will find them automatically.
 *
 * Usage:
 *   npm run build && npm run start &
 *   npm run test:contrast
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const axeSource = readFileSync(join(__dirname, "..", "node_modules", "axe-core", "axe.min.js"), "utf-8");

const BASE_URL = process.env.CONTRAST_CHECK_BASE_URL ?? "http://localhost:3000";
const PAGES = ["/", "/sign-in", "/contact", "/legal/terms", "/legal/privacy", "/help-center", "/sign-in/forgot-password"];

async function main() {
  const launchOptions = {};
  if (process.env.CONTRAST_CHECK_CHROMIUM_PATH) {
    launchOptions.executablePath = process.env.CONTRAST_CHECK_CHROMIUM_PATH;
  }
  const browser = await chromium.launch(launchOptions);
  let totalViolations = 0;

  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    if (theme === "dark") {
      await context.addInitScript(() => window.localStorage.setItem("sg-theme", "dark"));
    }
    for (const path of PAGES) {
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
      await page.addScriptTag({ content: axeSource });
      const results = await page.evaluate(() => window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] }));
      const violations = results.violations ?? [];
      totalViolations += violations.length;
      if (violations.length > 0) {
        console.error(`[${theme}] ${path}: ${violations.length} violation(s)`);
        for (const v of violations) {
          for (const node of v.nodes) {
            console.error(`   ${v.id} (${v.impact}): ${node.target} — ${node.failureSummary}`);
          }
        }
      } else {
        console.log(`[${theme}] ${path}: OK`);
      }
      await page.close();
    }
    await context.close();
  }

  await browser.close();

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} total violation(s) found.`);
    process.exit(1);
  }
  console.log("\nAll pages pass WCAG 2 A/AA in both themes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
