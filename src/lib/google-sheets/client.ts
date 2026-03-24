import { google, sheets_v4 } from 'googleapis'

function getAuthClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = getAuthClient()
  return google.sheets({ version: 'v4', auth })
}

export async function getSpreadsheetHeaders(
  spreadsheetId: string,
  sheetName: string = 'Sheet1'
): Promise<string[]> {
  const sheets = await getSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  })
  return (response.data.values?.[0] ?? []) as string[]
}

export async function getSpreadsheetData(
  spreadsheetId: string,
  sheetName: string = 'Sheet1',
  startRow: number = 2
): Promise<string[][]> {
  const sheets = await getSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A${startRow}:ZZ`,
  })
  return (response.data.values ?? []) as string[][]
}

export async function appendRow(
  spreadsheetId: string,
  sheetName: string,
  values: string[]
): Promise<number> {
  const sheets = await getSheetsClient()
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
  // Extract the updated row number
  const updatedRange = response.data.updates?.updatedRange ?? ''
  const match = updatedRange.match(/(\d+)$/)
  return match ? parseInt(match[1]) : 0
}

export async function updateRow(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  values: Record<number, string>
): Promise<void> {
  const sheets = await getSheetsClient()
  const requests = Object.entries(values).map(([colIndex, value]) => ({
    range: `${sheetName}!${columnIndexToLetter(parseInt(colIndex))}${rowNumber}`,
    values: [[value]],
  }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: requests,
    },
  })
}

export async function updateCell(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  columnLetter: string,
  value: string
): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${columnLetter}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  })
}

export async function getSpreadsheetInfo(spreadsheetId: string) {
  const sheets = await getSheetsClient()
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'spreadsheetId,properties.title,sheets.properties',
  })
  return response.data
}

function columnIndexToLetter(index: number): string {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter
    i = Math.floor(i / 26) - 1
  }
  return letter
}
