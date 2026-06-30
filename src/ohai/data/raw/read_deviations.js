const ExcelJS = require('exceljs');

function getCellText(cell) {
  if (!cell) return '';
  const v = cell.value;
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (v.richText) return v.richText.map(r => r.text).join('');
  if (v.text) return v.text;
  if (v.result) return v.result;
  return String(v);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('七日世界.xlsx');
  const ws = wb.getWorksheet('異常物');

  // Show full detail for rows 82-85
  for (let r = 82; r <= Math.min(90, ws.actualRowCount); r++) {
    const row = ws.getRow(r);
    console.log(`=== Row ${r} full content ===`);
    for (let c = 1; c <= 8; c++) {
      const val = row.getCell(c).value;
      const text = getCellText(row.getCell(c));
      console.log(`  Col ${c} (${typeof val}): ${text || '(empty)'}`);
    }
    console.log('');
  }
}

main().catch(console.error);
