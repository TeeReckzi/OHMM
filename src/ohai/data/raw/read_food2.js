const ExcelJS = require('exceljs');
const fs = require('fs');

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\tyr3x\\OnceHumanMasterCalc\\data\\raw\\七日世界.xlsx');
  const ws = wb.getWorksheet('食材');

  const lines = [];

  lines.push(`SHEET: ${ws.name} | ROWS: ${ws.rowCount} | COLS: ${ws.columnCount}\n`);

  // Headers rows 1-10
  lines.push('--- HEADER ROWS (1-10) ---');
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const vals = [];
    for (let c = 1; c <= 30; c++) {
      const v = row.getCell(c).value;
      vals.push(v != null ? String(v) : '');
    }
    lines.push(`Row ${String(r).padStart(3)}: ` + vals.join(' | '));
  }
  lines.push('');

  // Data rows 4-350
  lines.push('--- DATA ROWS (4-350): ROW|A(cat)|B(subcat)|C(type)|D(subtype)|E(name)|F(effect)|G(effect_sub)|H(notes)|I(effect_power) ---');
  const endRow = Math.min(350, ws.rowCount);
  for (let r = 4; r <= endRow; r++) {
    const row = ws.getRow(r);
    const parts = [String(r)];
    for (let c = 1; c <= 9; c++) {
      const v = row.getCell(c).value;
      parts.push(v != null ? String(v) : '');
    }
    lines.push(parts.join('|'));
  }
  lines.push('--- END ---');

  const outPath = 'C:\\Users\\tyr3x\\OnceHumanMasterCalc\\data\\raw\\food_extracted.txt';
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Written to', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
