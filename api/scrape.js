import { chromium } from "playwright";

export default async function handler(req, res) {
  const { source = "ddproperty", location = "อโศก", bedrooms = 2, budget_max = 6000000 } = req.query;

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true
  });
  const page = await browser.newPage();

  let url = "";

  if (source === "ddproperty") {
    url = `https://www.ddproperty.com/th/for-sale/condo?bedrooms=${bedrooms}&maxprice=${budget_max}&keyword=${encodeURIComponent(location)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // ดึง 5 รายการแรก
    const listings = await page.$$eval('a[data-testid="listing-card-link"]', nodes =>
      nodes.slice(0, 5).map(node => {
        const title = node.innerText.trim();
        const link = node.href;
        const card = node.closest('[data-testid="listing-card"]');
        const price = card?.querySelector('span[data-testid="listing-price"]')?.innerText.trim() || "";
        const loc = card?.querySelector('span[data-testid="listing-location"]')?.innerText.trim() || "";
        return { title, price, location: loc, link };
      })
    );

    await browser.close();
    return res.status(200).json({ source: "ddproperty", listings });
  }

  if (source === "fazwaz") {
    url = `https://www.fazwaz.com/condo-for-sale/thailand?bedrooms=${bedrooms}&max_price=${budget_max}&q=${encodeURIComponent(location)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const listings = await page.$$eval('.property-card', nodes =>
      nodes.slice(0, 5).map(node => {
        const title = node.querySelector('.property-card__title')?.innerText.trim() || "";
        const price = node.querySelector('.property-card__price')?.innerText.trim() || "";
        const loc = node.querySelector('.property-card__location')?.innerText.trim() || "";
        const link = node.querySelector('a')?.href || "";
        return { title, price, location: loc, link };
      })
    );

    await browser.close();
    return res.status(200).json({ source: "fazwaz", listings });
  }

  await browser.close();
  return res.status(400).json({ error: "Invalid source" });
}
