require("dotenv").config();
const puppeteer = require("puppeteer");
const { GoogleAuth } = require("google-auth-library");
const { getSheetData, updateSheetData } = require("./google");
const fs = require('fs');

if (process.env.GOOGLE_SERVICE_JSON) {
  fs.writeFileSync('service-account.json', process.env.GOOGLE_SERVICE_JSON);
}

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

(async () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.SHEET_NAME;
  const urls = await getSheetData(sheetId, sheetName, authClient);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const results = [];

  for (const url of urls) {
    try {
      await page.goto(url, { timeout: 60000, waitUntil: "domcontentloaded" });

      const status = await page.evaluate(() => {
        const qtyText = Array.from(document.querySelectorAll("div"))
          .find(div => div.textContent && div.textContent.includes("pieces available"));
        if (!qtyText) return "Deleted";
        const match = qtyText.textContent.match(/(\d+)\s+pieces available/i);
        if (!match || parseInt(match[1]) === 0) return "Out of Stock";
        return "In Stock";
      });

      results.push(status);
    } catch (err) {
      results.push("Error");
    }
  }

  await updateSheetData(sheetId, sheetName, results, authClient);
  await browser.close();
})();
