const { google } = require("googleapis");

async function getSheetData(sheetId, sheetName, auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A2:A`
  });
  return res.data.values.flat();
}

async function updateSheetData(sheetId, sheetName, values, auth) {
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!B2:B`,
    valueInputOption: "RAW",
    requestBody: { values: values.map(v => [v]) }
  });
}

module.exports = { getSheetData, updateSheetData };