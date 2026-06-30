const ExcelJS = require('exceljs');
const fs = require('fs');

function cv(v) {
  if (v == null) return '';
  const s = String(v);
  return s.replace(/\r?\n/g, ' | ').replace(/\s+/g, ' ').trim();
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\tyr3x\\OnceHumanMasterCalc\\data\\raw\\七日世界.xlsx');
  const ws = wb.getWorksheet('食材');

  const lines = [];
  lines.push(`SHEET: ${ws.name} | ROWS: ${ws.rowCount} | COLS: ${ws.columnCount}\n`);

  // Data rows 4-350: ROW|A|B|C|D|E(name)|F(effect)|G(effect_sub)|H(notes)|I(effect_power)
  lines.push('ROW|A|B|C|D|E(name)|F(effect)|G(effect_sub)|H(notes)|I(effect_power)');
  const endRow = Math.min(350, ws.rowCount);
  for (let r = 4; r <= endRow; r++) {
    const row = ws.getRow(r);
    const parts = [String(r)];
    for (let c = 1; c <= 9; c++) {
      parts.push(cv(row.getCell(c).value));
    }
    lines.push(parts.join('|'));
  }

  const outPath = 'C:\\Users\\tyr3x\\OnceHumanMasterCalc\\data\\raw\\food_extracted.txt';
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Written to', outPath);
  console.log('Total data rows:', endRow - 3);
}

main().catch(err => { console.error(err); process.exit(1); });
