require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const puppeteer = require("puppeteer");

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = process.env.GOOGLE_SERVICE_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

async function checkStockStatus(url) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Auto-select language if popup appears
    try {
      await page.waitForSelector('[class*="language-selection-popup"]', { timeout: 5000 });
      await page.evaluate(() => {
        const englishBtn = Array.from(document.querySelectorAll("button")).find(btn => btn.innerText.includes("English"));
        if (englishBtn) englishBtn.click();
      });
    } catch (e) {}

    // Wait for stock section
    await page.waitForSelector("section.flex.items-center.OaFP0p", { timeout: 15000 });

    // Extract stock info
    const stockText = await page.evaluate(() => {
      const section = document.querySelector('section.flex.items-center.OaFP0p');
      const stockDiv = section?.querySelector("div > div:last-child");
      return stockDiv?.innerText || null;
    });

    if (!stockText) return "Unknown";
    if (stockText.includes("0 pieces")) return "Out of Stock";
    if (stockText.match(/\d+ pieces/)) return "In Stock";

    return "Unknown";
  } catch (err) {
    console.error("Error checking stock for", url, err.message);
    return "Unknown";
  } finally {
    if (browser) await browser.close();
  }
}

async function updateSheet() {
  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useServiceAccountAuth({
    client_email: SERVICE_EMAIL,
    private_key: PRIVATE_KEY,
  });

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  for (const row of rows) {
    const url = row.URL;
    if (!url) continue;

    console.log(`Checking: ${url}`);
    const result = await checkStockStatus(url);
    row.Status = result;
    await row.save();
    console.log(`Status: ${result}`);
  }

  console.log("All links checked and sheet updated.");
}

updateSheet();
