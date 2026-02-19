const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const BASE = "https://theiiienrique.github.io";

// Pages to capture.
// Tip: set waitFor to a stable piece of text or a stable CSS selector on that page.
const PAGES = [
  { name: "home", url: `${BASE}/`, waitFor: "css=main" },
  { name: "about", url: `${BASE}/about`, waitFor: "css=main" },
  { name: "contact", url: `${BASE}/contact`, waitFor: "css=main" },
  { name: "docs", url: `${BASE}/docs`, waitFor: "css=main" },
];

// Build output filepath safely
function outPath(outDir, name) {
  const safe = name.toLowerCase().replace(/[^a-z0-9-_]+/g, "-");
  return path.join(outDir, `${safe}.png`);
}

(async () => {
  const outDir = path.join(__dirname, "..", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // These reduce visual variability (nice for docs screenshots)
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });

  const page = await context.newPage();

  const results = [];

  for (const item of PAGES) {
    const file = outPath(outDir, item.name);

    try {
      await page.goto(item.url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });

      // If you specify a waitFor cue, we wait for it before taking the screenshot.
      if (item.waitFor) {
        // Works with Playwright selector engines like:
        // "text=..." or "css=..." or "role=..." etc.
        await page.waitForSelector(item.waitFor, { timeout: 20_000 });
      }

      // Give layout/fonts a beat to settle (small but helpful)
      await page.waitForTimeout(250);

      await page.screenshot({ path: file, fullPage: true });

      console.log(`✅ ${item.name} -> ${path.relative(process.cwd(), file)}`);
      results.push({ name: item.name, ok: true, file });
    } catch (err) {
      console.error(`❌ Failed: ${item.name} (${item.url})`);
      console.error(`   ${err?.message || err}`);
      results.push({
        name: item.name,
        ok: false,
        file,
        error: err?.message || String(err),
      });
    }
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nRun summary: ${results.length - failed.length}/${results.length} succeeded.`,
  );
  if (failed.length) process.exitCode = 1;
})();
