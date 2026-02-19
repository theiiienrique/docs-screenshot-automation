const { chromium } = require("@playwright/test");

const BASE = "https://theiiienrique.github.io";
const START = `${BASE}/docs`;
const MAX_PAGES = 30; // keep it small to start

function isInternal(url) {
  return url.startsWith(BASE);
}

function normalize(url) {
  // Remove URL fragments; keep query if you ever need it (usually not)
  const u = new URL(url);
  u.hash = "";
  return u.toString();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const seen = new Set();
  const queue = [START];

  while (queue.length && seen.size < MAX_PAGES) {
    const current = queue.shift();
    const currentNorm = normalize(current);
    if (seen.has(currentNorm)) continue;

    try {
      await page.goto(currentNorm, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      seen.add(currentNorm);

      const hrefs = await page.$$eval("a[href]", (as) =>
        as.map((a) => a.href).filter(Boolean),
      );

      for (const href of hrefs) {
        try {
          const abs = normalize(new URL(href, BASE).toString());
          if (!isInternal(abs)) continue;
          if (abs.includes("/404")) continue;
          if (!seen.has(abs)) queue.push(abs);
        } catch {}
      }

      console.log(`✅ crawled: ${currentNorm}`);
    } catch (e) {
      console.log(`❌ failed: ${currentNorm}`);
    }
  }

  console.log("\n--- Internal links found ---\n");
  Array.from(seen)
    .sort()
    .forEach((u) => console.log(u));

  await browser.close();
})();
