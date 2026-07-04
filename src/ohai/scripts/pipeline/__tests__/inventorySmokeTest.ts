import { buildInventory, scanTable } from '../../../src/pipeline/inventoryScanner';
import { createPipelineConfig } from '../../../src/pipeline/config';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

async function run(): Promise<void> {
  console.log('inventoryScanner smoke test\n');

  const config = createPipelineConfig();

  // Fixture: 3 fake file entries
  const fixture = {
    files: [
      // Entry 1: Normal table (array of records with integer IDs)
      {
        path: '02548_58575b3c.pyc',
        output: 'script_extract_full/02548_58575b3c.pyc',
        parsed: [
          { id: 1001, name: 'Weapon A', damage: 50, fireRate: 1.2 },
          { id: 1002, name: 'Weapon B', damage: 75, fireRate: 0.8 },
          { id: 1003, name: 'Weapon C', damage: 120, fireRate: 0.5 },
          { id: 1004, name: 'Weapon D', damage: 30, fireRate: 2.0 },
        ],
      },
      // Entry 2: Dict-keyed table
      {
        path: '03495_7798b54f.pyc',
        output: 'script_extract_full/03495_7798b54f.pyc',
        parsed: {
          buff_001: { buffId: 100, effectType: 'atk_up', value: 10 },
          buff_002: { buffId: 200, effectType: 'def_up', value: 15 },
        },
      },
      // Entry 3: Broken/unparseable parsed field (null treated as non-truthy, so use a weird type)
      {
        path: '99999_broken.pyc',
        output: 'script_extract_full/99999_broken.pyc',
        parsed: 'this is a string, not records',
      },
    ],
  };

  const manifest = await buildInventory(fixture, config, JSON.stringify(fixture));

  // Test manifest structure
  assert(manifest.tableCount === 3, `tableCount is 3 (got ${manifest.tableCount})`);
  assert(manifest.tables.length === 3, `tables array has 3 entries`);

  // Test entry 1: Normal array table
  const t1 = manifest.tables[0];
  assert(t1.recordCount === 4, `entry 1 recordCount is 4 (got ${t1.recordCount})`);
  assert(
    t1.fieldNames.includes('id') && t1.fieldNames.includes('name') &&
    t1.fieldNames.includes('damage') && t1.fieldNames.includes('fireRate'),
    `entry 1 fieldNames extraction is complete`
  );
  assert(t1.sampleRecords.length <= 3, `entry 1 sampleRecords <= 3 (got ${t1.sampleRecords.length})`);
  assert(t1.likelyPrimaryKey === 'id', `entry 1 likelyPrimaryKey is 'id' (got ${t1.likelyPrimaryKey})`);
  assert(t1.confidence === 'decoded', `entry 1 confidence is 'decoded'`);

  // Test entry 2: Dict-keyed table
  const t2 = manifest.tables[1];
  assert(t2.recordCount === 2, `entry 2 recordCount is 2 (got ${t2.recordCount})`);
  assert(
    t2.fieldNames.includes('buffId') && t2.fieldNames.includes('effectType') &&
    t2.fieldNames.includes('value'),
    `entry 2 fieldNames extraction is complete`
  );
  assert(t2.likelyPrimaryKey === 'buffId', `entry 2 likelyPrimaryKey is 'buffId' (got ${t2.likelyPrimaryKey})`);

  // Test entry 3: Broken entry
  const t3 = manifest.tables[2];
  assert(t3.recordCount === 0, `entry 3 recordCount is 0 (got ${t3.recordCount})`);
  assert(t3.parseWarnings.length > 0, `entry 3 has parseWarnings (got ${t3.parseWarnings.length})`);
  assert(t3.confidence === 'inferred', `entry 3 confidence is 'inferred'`);

  // Test meta block
  assert(manifest._meta.pipelineVersion === '0.1.0', `_meta.pipelineVersion is 0.1.0`);
  assert(manifest._meta.sourceHash.length === 64, `_meta.sourceHash is 64-char hex`);
  assert(manifest._meta.extractionMethod === 'bindict', `_meta.extractionMethod is bindict`);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('UNEXPECTED ERROR:', err);
  process.exit(1);
});
