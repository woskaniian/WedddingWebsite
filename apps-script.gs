/**
 * RSVP receiver for Vanush & Armine wedding site.
 * Each form POST becomes a new row in the active Google Sheet.
 *
 * Setup:
 * 1. Open a fresh Google Sheet (or use an existing one).
 * 2. Extensions → Apps Script. Replace everything in Code.gs with this file.
 * 3. Save, then Deploy → New deployment.
 *      Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy, authorize, then copy the Web app URL.
 * 4. Paste that URL into index.html where it says
 *    PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE.
 */

const SHEET_NAME = 'RSVPs';
const HEADERS = ['Timestamp', 'Name', 'Guests', 'Attending', 'Events'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.guests || '',
      data.attending || '',
      data.events || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('RSVP endpoint is alive.')
    .setMimeType(ContentService.MimeType.TEXT);
}
