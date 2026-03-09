import { getSheetsClient } from './client';
import type { SheetData, LeadRow } from '@leadcrm/types';

// CRM columns the system expects to exist in every connected sheet.
// They are created automatically if missing (appended as new header columns).
const CRM_REQUIRED_COLUMNS = ['lead_id', 'status', 'assigned_to', 'notes', 'updated_at'];

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all rows from a sheet.
 * Row 1 = headers, rows 2+ = leads.
 * Returns headers array and array of { header: value } maps.
 */
export async function getSheetData(
  spreadsheetId: string,
  sheetName: string
): Promise<SheetData> {
  const sheets = getSheetsClient();
  const range = `${sheetName}`;

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = res.data.values ?? [];

  if (values.length === 0) return { headers: [], rows: [] };

  const headers = (values[0] as string[]).map((h) => h.trim());
  const rows: LeadRow[] = values.slice(1).map((row) => {
    const lead: LeadRow = {};
    headers.forEach((header, i) => {
      lead[header] = (row[i] as string | undefined) ?? '';
    });
    return lead;
  });

  return { headers, rows };
}

/**
 * Fetch only the first row (headers). Cheap call for schema detection.
 */
export async function getHeaders(
  spreadsheetId: string,
  sheetName: string
): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });
  const row = res.data.values?.[0] ?? [];
  return (row as string[]).map((h) => h.trim());
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Update a specific row in the sheet.
 * rowIndex is the actual sheet row number (1-based; row 1 = headers, row 2 = first lead).
 * values is an ordered array matching the sheet's column order.
 */
export async function updateRow(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  values: string[]
): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${rowIndex}:${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

/**
 * Update specific columns of a row by header name.
 * Fetches headers first, then writes only changed columns.
 */
export async function updateRowFields(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  fields: Partial<LeadRow>
): Promise<void> {
  const headers = await getHeaders(spreadsheetId, sheetName);
  const sheets = getSheetsClient();

  // Build individual cell updates to avoid overwriting untouched columns
  const data = Object.entries(fields)
    .map(([key, value]) => {
      const colIdx = headers.indexOf(key);
      if (colIdx === -1) return null;
      const colLetter = columnToLetter(colIdx + 1);
      return {
        range: `${sheetName}!${colLetter}${rowIndex}`,
        values: [[value]],
      };
    })
    .filter(Boolean) as { range: string; values: string[][] }[];

  if (data.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });
}

/**
 * Append a new lead row at the end of the sheet.
 * values is an ordered array matching the sheet's column order.
 */
export async function appendRow(
  spreadsheetId: string,
  sheetName: string,
  fields: LeadRow,
  headers: string[]
): Promise<void> {
  const sheets = getSheetsClient();
  const row = headers.map((h) => fields[h] ?? '');

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

// ─── CRM column bootstrap ─────────────────────────────────────────────────────

/**
 * Checks for required CRM columns; appends any that are missing to the header row.
 * Returns the final complete headers array.
 */
export async function ensureCrmColumns(
  spreadsheetId: string,
  sheetName: string
): Promise<string[]> {
  const headers = await getHeaders(spreadsheetId, sheetName);
  const missing = CRM_REQUIRED_COLUMNS.filter((col) => !headers.includes(col));

  if (missing.length === 0) return headers;

  const sheets = getSheetsClient();
  const startCol = columnToLetter(headers.length + 1);
  const endCol = columnToLetter(headers.length + missing.length);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${startCol}1:${endCol}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [missing] },
  });

  return [...headers, ...missing];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert 1-based column index to letter(s): 1→A, 27→AA */
function columnToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
