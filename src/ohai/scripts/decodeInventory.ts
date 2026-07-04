import * as fs from 'fs/promises';
import * as path from 'path';
import { createPipelineConfig } from '../src/pipeline/config';
import { buildInventory } from '../src/pipeline/inventoryScanner';
import { safeWrite } from '../src/pipeline/safeWriter';

async function main(): Promise<void> {
  const config = createPipelineConfig();
  const scanPath = process.argv[2] || config.defaultSourceScanPath;

  console.log(`[decode:inventory] Reading: ${scanPath}`);
  const raw = await fs.readFile(scanPath, 'utf-8');
  const scanData = JSON.parse(raw);

  console.log(`[decode:inventory] Parsing scan data...`);
  const manifest = await buildInventory(scanData, config, raw);

  const output = JSON.stringify(manifest, null, 2);
  await safeWrite('table-inventory.json', output, config);

  console.log(`[decode:inventory] Done. ${manifest.tableCount} tables written to table-inventory.json`);
  console.log(`[decode:inventory] Total records across all tables: ${manifest._meta.recordCount}`);
  console.log(`[decode:inventory] Output: ${path.resolve(config.decodedOutputDir, 'table-inventory.json')}`);
}

main().catch((err) => {
  console.error('[decode:inventory] FATAL:', err.message);
  process.exit(1);
});
