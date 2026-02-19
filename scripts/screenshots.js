const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

// 1) Define what to capture (name -> filename, url -> target)
const PAGES = [
  { name: "playwright-home", url: "https://playwright.dev/" },
  { name: "playwright-docs-intro", url: "https://playwright.dev/docs/intro" },
  {
    name: "playwright-docs-screenshots",
    url: "https://playwright.dev/docs/screenshots",
  },
];

// 2) Small helper: build output filepath
function outPath(outDir, name) {
  // Ensure predictable filenames
  const safe = name.toLowerCase().replace(/[^a-z0-9-_]+/g, "-");
  return path.join(outDir, `${safe}.png`);
}

(async () => {
  const outDir = path.join(__dirname, "..", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    // Set to false if you want to watch it run
    headless: true,
  });

  // One context + page = consistent settings across screenshots
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // If you ever need consistent appearance:
    // colorScheme: "light",
    // reducedMotion: "reduce",
  });

  const page = await context.newPage();

  const results = [];

  for (const item of PAGES) {
    const file = outPath(outDir, item.name);

    try {
      // Navigate + wait for page to settle
      await page.goto(item.url, { waitUntil: "networkidle", timeout: 45_000 });

      // Optional: a tiny pause can help with late-loading fonts/animations
      // await page.waitForTimeout(250);

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
      // Keep going even if one page fails
    }
  }

  await browser.close();

  // Summary (helpful for CI later)
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nRun summary: ${results.length - failed.length}/${results.length} succeeded.`,
  );
  if (failed.length) process.exitCode = 1;
})();
