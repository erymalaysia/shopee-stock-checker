require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = process.env.GOOGLE_SERVICE_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

async function testConnection() {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: SERVICE_EMAIL,
      private_key: PRIVATE_KEY,
    });

    await doc.loadInfo(); // loads document properties and worksheets
    console.log(`✅ Connected to sheet: ${doc.title}`);
  } catch (error) {
    console.error("❌ Failed to connect to Google Sheets:");
    console.error(error.message);
  }
}

testConnection();