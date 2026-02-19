const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://theiiienrique.github.io/", {
    waitUntil: "domcontentloaded",
  });

  // Grab all internal links on the page
  const links = await page.$$eval("a[href]", (as) =>
    as
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
      .filter(
        (href) =>
          href.startsWith("/") || href.includes("theiiienrique.github.io"),
      ),
  );

  // Normalize and dedupe
  const normalized = Array.from(
    new Set(
      links
        .map((href) => {
          try {
            return new URL(href, "https://theiiienrique.github.io").toString();
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    ),
  );

  console.log("Found internal links:\n");
  normalized.sort().forEach((u) => console.log(u));

  await browser.close();
})();
