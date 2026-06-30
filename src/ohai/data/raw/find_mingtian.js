const ExcelJS = require('exceljs');

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('七日世界.xlsx');

  // Search for 明日之後聯動 in all sheets (robust)
  console.log('=== Searching for 明日之後 ===');
  for (const ws of wb.worksheets) {
    for (let r = 1; r <= ws.actualRowCount; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= 20; c++) {
        const cell = row.getCell(c);
        let text;
        try {
          const v = cell.value;
          if (!v) continue;
          if (typeof v === 'string') text = v;
          else if (v.richText) text = v.richText.map(x => x.text).join('');
          else if (v.text) text = v.text;
          else if (v.result) text = v.result;
          else text = String(v);
        } catch(e) {
          continue;
        }
        if (typeof text === 'string' && text.includes('明日之後')) {
          console.log(`Sheet: [${ws.name}], Row ${r}, Col ${c}: ${text.substring(0, 120)}`);
        }
      }
    }
  }

  // Also check the first unnamed sheet briefly
  const first = wb.getWorksheet(1);
  console.log(`\n=== First sheet (name: "${first.name}") first 10 rows ===`);
  for (let r = 1; r <= Math.min(15, first.actualRowCount); r++) {
    const row = first.getRow(r);
    const c1 = row.getCell(1).value;
    const c2 = row.getCell(2).value;
    let t1, t2;
    try { t1 = typeof c1 === 'string' ? c1 : c1?.text || c1?.result || String(c1 || ''); } catch(e) { t1 = '?'; }
    try { t2 = typeof c2 === 'string' ? c2 : c2?.text || c2?.result || String(c2 || ''); } catch(e) { t2 = '?'; }
    console.log(`Row ${r}: [${t1}] | [${t2}]`);
  }
}

main().catch(console.error);
