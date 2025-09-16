import { chromium } from "playwright";

export default async function handler(req, res) {
  const { location = "อโศก", bedrooms = 2, budget_max = 6000000 } = req.query;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const url = `https://www.ddproperty.com/th/for-sale/condo?bedrooms=${bedrooms}&maxprice=${budget_max}&keyword=${encodeURIComponent(location)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // ดึง listings จากหน้าแรก
  const listings = await page.$$eval(".listing-card", cards =>
    cards.slice(0, 5).map(card => {
      const title = card.querySelector(".title")?.innerText || "";
      const price = card.querySelector(".price")?.innerText || "";
      const link = card.querySelector("a")?.href || "";
      return { title, price, link };
    })
  );

  await browser.close();

  res.status(200).json({ listings });
}

