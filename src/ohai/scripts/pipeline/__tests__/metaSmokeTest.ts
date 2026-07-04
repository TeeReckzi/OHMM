import { generateMeta } from '../../../src/pipeline/metaGenerator';
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

function run(): void {
  console.log('metaGenerator smoke test\n');

  const config = createPipelineConfig();
  const sourceContent = '{"test": "deterministic hashing"}';

  const meta1 = generateMeta({
    sourceFile: 'test.pyc',
    sourceScannedPath: '/scan/test.pyc',
    extractionMethod: 'bindict',
    recordCount: 42,
    sourceContent,
    config,
  });

  const meta2 = generateMeta({
    sourceFile: 'test.pyc',
    sourceScannedPath: '/scan/test.pyc',
    extractionMethod: 'bindict',
    recordCount: 42,
    sourceContent,
    config,
  });

  // Test 1: sourceHash is deterministic
  assert(
    meta1.sourceHash === meta2.sourceHash,
    `sourceHash is deterministic (same input → same hash)`
  );

  // Test 2: sourceHash is 64-char lowercase hex (SHA-256)
  assert(
    /^[0-9a-f]{64}$/.test(meta1.sourceHash),
    `sourceHash is 64-char lowercase hex`
  );

  // Test 3: decodedAt matches ISO 8601 pattern
  const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  assert(
    iso8601.test(meta1.decodedAt),
    `decodedAt matches ISO 8601 pattern (got ${meta1.decodedAt})`
  );

  // Test 4: pipelineVersion matches config
  assert(
    meta1.pipelineVersion === config.pipelineVersion,
    `pipelineVersion matches config (${meta1.pipelineVersion})`
  );

  // Test 5: recordCount matches input
  assert(meta1.recordCount === 42, `recordCount is 42`);

  // Test 6: Different content produces different hash
  const meta3 = generateMeta({
    sourceFile: 'test.pyc',
    sourceScannedPath: '/scan/test.pyc',
    extractionMethod: 'bindict',
    recordCount: 42,
    sourceContent: '{"different": "content"}',
    config,
  });
  assert(
    meta3.sourceHash !== meta1.sourceHash,
    `different content produces different hash`
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
