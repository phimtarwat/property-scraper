import chromium from "playwright-aws-lambda";

export default async function handler(req, res) {
  const {
    source = "ddproperty",
    location = "อโศก",
    bedrooms = 2,
    budget_max = 6000000
  } = req.query;

  let browser;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    let url = "";
    let listings = [];

    // -------------------------------
    // Source: DDproperty
    // -------------------------------
    if (source === "ddproperty") {
      url = `https://www.ddproperty.com/th/for-sale/condo?bedrooms=${bedrooms}&maxprice=${budget_max}&keyword=${encodeURIComponent(location)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      try {
        listings = await page.$$eval('a[data-testid="listing-card-link"]', (nodes) =>
          nodes.slice(0, 5).map((node) => {
            const title = node.innerText?.trim() || "No title";
            const link = node.href || "";
            const card = node.closest('[data-testid="listing-card"]');
            const price =
              card?.querySelector('span[data-testid="listing-price"]')?.innerText?.trim() || "N/A";
            const loc =
              card?.querySelector('span[data-testid="listing-location"]')?.innerText?.trim() || "N/A";
            return { title, price, location: loc, link };
          })
        );
      } catch {
        listings = [];
      }
    }

    // -------------------------------
    // Source: FazWaz
    // -------------------------------
    if (source === "fazwaz") {
      url = `https://www.fazwaz.com/condo-for-sale/thailand?bedrooms=${bedrooms}&max_price=${budget_max}&q=${encodeURIComponent(location)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      try {
        listings = await page.$$eval(".property-card", (nodes) =>
          nodes.slice(0, 5).map((node) => {
            const title =
              node.querySelector(".property-card__title")?.innerText?.trim() || "No title";
            const price =
              node.querySelector(".property-card__price")?.innerText?.trim() || "N/A";
            const loc =
              node.querySelector(".property-card__location")?.innerText?.trim() || "N/A";
            const link = node.querySelector("a")?.href || "";
            return { title, price, location: loc, link };
          })
        );
      } catch {
        listings = [];
      }
    }

    // -------------------------------
    // Source: Hipflat (เพิ่มเป็นตัวอย่าง)
    // -------------------------------
    if (source === "hipflat") {
      url = `https://www.hipflat.co.th/th/search?type=sale&property_type=condo&bedrooms=${bedrooms}&max_price=${budget_max}&q=${encodeURIComponent(location)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      try {
        listings = await page.$$eval(".listing-item", (nodes) =>
          nodes.slice(0, 5).map((node) => {
            const title =
              node.querySelector(".listing-title")?.innerText?.trim() || "No title";
            const price =
              node.querySelector(".listing-price")?.innerText?.trim() || "N/A";
            const loc =
              node.querySelector(".listing-location")?.innerText?.trim() || "N/A";
            const link = node.querySelector("a")?.href || "";
            return { title, price, location: loc, link };
          })
        );
      } catch {
        listings = [];
      }
    }

    await browser.close();
    return res.status(200).json({ source, listings });
  } catch (err) {
    if (browser) await browser.close();
    console.error("Scraper error:", err);
    return res.status(500).json({
      error: "Scraper failed",
      details: err.message || "Unknown error",
    });
  }
}
