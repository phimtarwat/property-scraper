import chromium from "playwright-aws-lambda";

export default async function handler(req, res) {
  const {
    source = "ddproperty",
    location = "อโศก",
    bedrooms = 2,
    budget_max = 6000000,
    limit = 20,
  } = req.query;

  let browser;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    let listings = [];

    // -------------------------------
    // Source: DDproperty
    // -------------------------------
    if (source === "ddproperty") {
      let url = `https://www.ddproperty.com/รวมประกาศขาย?bedrooms=${bedrooms}&maxprice=${budget_max}&keyword=${encodeURIComponent(
        location
      )}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      while (listings.length < limit) {
        await page.waitForSelector('[data-testid="listing-card"]', { timeout: 10000 }).catch(() => null);

        const pageListings = await page.$$eval('[data-testid="listing-card"]', (cards) =>
          cards.map((card) => {
            const title =
              card.querySelector('a[data-testid="listing-card-link"]')?.innerText?.trim() || "No title";
            const link = card.querySelector('a[data-testid="listing-card-link"]')?.href || "";
            const price =
              card.querySelector('span[data-testid="listing-price"]')?.innerText?.trim() || "N/A";
            const loc =
              card.querySelector('span[data-testid="listing-location"]')?.innerText?.trim() || "N/A";
            return { title, price, location: loc, link };
          })
        );

        listings.push(...pageListings);

        if (listings.length >= limit) {
          listings = listings.slice(0, limit);
          break;
        }

        const nextButton = await page.$('a[aria-label="หน้าถัดไป"]');
        if (nextButton) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            nextButton.click(),
          ]);
        } else {
          break;
        }
      }
    }

    // -------------------------------
    // Source: FazWaz
    // -------------------------------
    if (source === "fazwaz") {
      let url = `https://www.fazwaz.com/condo-for-sale/thailand?bedrooms=${bedrooms}&max_price=${budget_max}&q=${encodeURIComponent(
        location
      )}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      while (listings.length < limit) {
        await page.waitForSelector(".property-card", { timeout: 10000 }).catch(() => null);

        const pageListings = await page.$$eval(".property-card", (nodes) =>
          nodes.map((node) => {
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

        listings.push(...pageListings);

        if (listings.length >= limit) {
          listings = listings.slice(0, limit);
          break;
        }

        const nextButton = await page.$('a[rel="next"]');
        if (nextButton) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            nextButton.click(),
          ]);
        } else {
          break;
        }
      }
    }

    // -------------------------------
    // Source: Hipflat
    // -------------------------------
    if (source === "hipflat") {
      let url = `https://www.hipflat.co.th/th/search?type=sale&property_type=condo&bedrooms=${bedrooms}&max_price=${budget_max}&q=${encodeURIComponent(
        location
      )}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      while (listings.length < limit) {
        await page.waitForSelector(".listing-item", { timeout: 10000 }).catch(() => null);

        const pageListings = await page.$$eval(".listing-item", (nodes) =>
          nodes.map((node) => {
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

        listings.push(...pageListings);

        if (listings.length >= limit) {
          listings = listings.slice(0, limit);
          break;
        }

        const nextButton = await page.$('a[rel="next"]');
        if (nextButton) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            nextButton.click(),
          ]);
        } else {
          break;
        }
      }
    }

    await browser.close();
    return res.status(200).json({
      source,
      total: listings.length,
      listings,
    });
  } catch (err) {
    if (browser) await browser.close();
    console.error("Scraper error:", err);
    return res.status(500).json({
      error: "Scraper failed",
      details: err.message || "Unknown error",
    });
  }
}
