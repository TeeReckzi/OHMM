const ExcelJS = require('exceljs');

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\tyr3x\\OnceHumanMasterCalc\\data\\raw\\七日世界.xlsx');
  const ws = wb.getWorksheet('食材');

  console.log('=== SHEET NAME:', ws.name, '=== ROWS:', ws.rowCount, '=== COLUMNS:', ws.columnCount, '===\n');

  // Print headers (rows 1-10) as a table
  console.log('--- HEADER ROWS (1-10) ---');
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const vals = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      vals.push(row.getCell(c).value ?? '');
    }
    console.log(`Row ${String(r).padStart(3)}: ` + vals.join(' | '));
  }
  console.log('');

  // Print data rows 4 to 350
  console.log('--- DATA ROWS (4-350): ROW|A|B|C|D|E(name)|F(effect)|G(effect_sub)|H(notes)|I(effect_power) ---');
  const endRow = Math.min(350, ws.rowCount);
  for (let r = 4; r <= endRow; r++) {
    const row = ws.getRow(r);
    const a = row.getCell(1).value ?? '';
    const b = row.getCell(2).value ?? '';
    const c = row.getCell(3).value ?? '';
    const d = row.getCell(4).value ?? '';
    const e = row.getCell(5).value ?? '';
    const f = row.getCell(6).value ?? '';
    const g = row.getCell(7).value ?? '';
    const h = row.getCell(8).value ?? '';
    const i = row.getCell(9).value ?? '';
    console.log(`${r}|${a}|${b}|${c}|${d}|${e}|${f}|${g}|${h}|${i}`);
  }
  console.log('--- END ---');
}

main().catch(err => { console.error(err); process.exit(1); });
