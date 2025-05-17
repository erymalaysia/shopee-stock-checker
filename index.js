require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { getSheetData, updateSheetData } = require('./google');

const SHEET_ID = '1OyO21oZYswLa2tiuI4EfbYCAVxcOzr17RgQeQZkglzQ'; // Replace with your actual Google Sheet ID
const RANGE = 'Sheet1!A2:A'; // Adjust if you're using a different sheet or layout

// Check stock status by parsing quantity section
async function checkShopeeStock(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Find section containing "pieces available"
    const text = $('section:contains("Quantity")').text();

    if (text.includes('0 pieces available')) {
      return 'Out of Stock';
    } else if (/(\d+)\s+pieces available/.test(text)) {
      return 'In Stock';
    } else {
      return 'Unavailable';
    }
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
    return 'Error';
  }
}

async function run() {
  console.log('Fetching data from Google Sheet...');
  const rows = await getSheetData(SHEET_ID, RANGE);

  if (!rows || rows.length === 0) {
    console.log('No links found in the sheet.');
    return;
  }

  const results = [];

  for (let i = 0; i < rows.length; i++) {
    const link = rows[i][0];

    if (!link) {
      results.push(['No Link']);
      continue;
    }

    console.log(`Checking: ${link}`);
    const status = await checkShopeeStock(link);
    results.push([status]);
  }

  console.log('Updating sheet...');
  await updateSheetData(SHEET_ID, 'Sheet1!B2:B', results);
  console.log('Done!');
}

run();
