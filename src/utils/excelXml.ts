export type ExcelCell = string | number | boolean | null | undefined;

/** Excel 2003 Spreadsheet XML: opens directly in Excel without third-party packages. */
export function createExcelXmlWorkbook(sheetName: string, headers: string[], rows: ExcelCell[][]): string {
  const xml = (value: unknown) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const safeSheetName = sheetName.replace(/[\\/:*?\[\]]/g, ' ').trim().slice(0, 31) || 'Summary';
  const cell = (value: ExcelCell, header = false) => {
    const isNumber = typeof value === 'number' && Number.isFinite(value);
    const type = isNumber ? 'Number' : 'String';
    const style = header ? ' ss:StyleID=\"Header\"' : '';
    return '<Cell' + style + '><Data ss:Type=\"' + type + '\">' + xml(value) + '</Data></Cell>';
  };
  const headerRow = '<Row ss:Height=\"30\">' + headers.map((value) => cell(value, true)).join('') + '</Row>';
  const dataRows = rows.map((row) => '<Row>' + headers.map((_, index) => cell(row[index])).join('') + '</Row>').join('');
  return '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
    '<?mso-application progid=\"Excel.Sheet\"?>\n' +
    '<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:html=\"http://www.w3.org/TR/REC-html40\">' +
    '<Styles><Style ss:ID=\"Default\" ss:Name=\"Normal\"><Alignment ss:Vertical=\"Bottom\"/><Font ss:FontName=\"Calibri\" ss:Size=\"11\"/><Interior/></Style>' +
    '<Style ss:ID=\"Header\"><Alignment ss:Vertical=\"Center\" ss:WrapText=\"1\"/><Font ss:FontName=\"Calibri\" ss:Size=\"11\" ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/><Interior ss:Color=\"#0B4D3B\" ss:Pattern=\"Solid\"/></Style></Styles>' +
    '<Worksheet ss:Name=\"' + xml(safeSheetName) + '\"><Table>' + headerRow + dataRows + '</Table>' +
    '<WorksheetOptions xmlns=\"urn:schemas-microsoft-com:office:excel\"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet></Workbook>';
}