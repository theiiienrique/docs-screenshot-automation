const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

(async () => {
  // Ensure output folder exists
  const outDir = path.join(__dirname, "..", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch(); // change to launch({ headless: false }) if you want to watch it
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  // Example target (swap this to whatever you want to document)
  await page.goto("https://playwright.dev/", { waitUntil: "networkidle" });

  // Full page screenshot
  await page.screenshot({
    path: path.join(outDir, "playwright-home.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("✅ Screenshot saved to screenshots/playwright-home.png");
})();
