import chromium from "playwright-aws-lambda";

export default async function handler(req, res) {
  const { location = "อโศก", bedrooms = 2, budget_max = 6000000 } = req.query;

  let browser;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true
    });

    const page = await browser.newPage();
    const url = `https://www.ddproperty.com/th/for-sale/condo?bedrooms=${bedrooms}&maxprice=${budget_max}&keyword=${encodeURIComponent(
      location
    )}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // ดึง 5 รายการแรก
    const listings = await page.$$eval('a[data-testid="listing-card-link"]', (nodes) =>
      nodes.slice(0, 5).map((node) => {
        const title = node.innerText?.trim() || "No title";
        const link = node.href || "";
        const card = node.closest('[data-testid="listing-card"]');
        const price = card?.querySelector('span[data-testid="listing-price"]')?.innerText?.trim() || "N/A";
        const loc = card?.querySelector('span[data-testid="listing-location"]')?.innerText?.trim() || "N/A";
        return { title, price, location: loc, link };
      })
    );

    await browser.close();
    return res.status(200).json({ source: "ddproperty", listings });
  } catch (err) {
    if (browser) await browser.close();
    console.error("Scraper error:", err);
    return res.status(500).json({
      error: "Scraper failed",
      details: err.message || "Unknown error"
    });
  }
}
