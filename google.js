const { google } = require('googleapis');

// Parse JSON credentials from environment variable
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_JSON);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheetData(sheetId, range) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  return res.data.values;
}

async function updateSheetData(sheetId, range, values) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: range,
    valueInputOption: 'RAW',
    requestBody: {
      values: values,
    },
  });
}

module.exports = {
  getSheetData,
  updateSheetData,
};
