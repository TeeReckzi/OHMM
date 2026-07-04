import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { safeWrite } from '../../../src/pipeline/safeWriter';
import { PipelineConfig } from '../../../src/pipeline/types';

let tmpDir = '';
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

async function assertThrows(fn: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await fn();
    console.error(`  ✗ ${label} (did not throw)`);
    failed++;
  } catch {
    console.log(`  ✓ ${label}`);
    passed++;
  }
}

async function run(): Promise<void> {
  console.log('safeWriter smoke test\n');

  // Create temp directory
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'safe-writer-test-'));
  const config: PipelineConfig = {
    decodedOutputDir: tmpDir,
    defaultSourceScanPath: 'unused',
    pipelineVersion: '0.1.0',
  };

  // Test 1: Valid relative path succeeds
  await safeWrite('foo.json', '{"test": true}', config);
  const exists = fs.existsSync(path.join(tmpDir, 'foo.json'));
  assert(exists, 'accepts valid relative path (writes file successfully)');

  // Test 2: Nested relative path succeeds
  await safeWrite('sub/bar.json', '{}', config);
  const nestedExists = fs.existsSync(path.join(tmpDir, 'sub', 'bar.json'));
  assert(nestedExists, 'accepts nested relative path (creates parent dirs)');

  // Test 3: Rejects ../escape.json
  await assertThrows(
    () => safeWrite('../escape.json', '{}', config),
    'rejects ../escape.json (throws)'
  );

  // Test 4: Rejects /absolute/path.json
  await assertThrows(
    () => safeWrite('/absolute/path.json', '{}', config),
    'rejects /absolute/path.json (throws)'
  );

  // Test 5: Rejects ../../etc/hosts
  await assertThrows(
    () => safeWrite('../../etc/hosts', '{}', config),
    'rejects ../../etc/hosts (throws)'
  );

  // Test 6: Rejects backslash absolute
  await assertThrows(
    () => safeWrite('\\absolute\\path.json', '{}', config),
    'rejects \\absolute\\path.json (throws)'
  );

  console.log(`\n${passed} passed, ${failed} failed`);
}

run()
  .catch((err) => {
    console.error('UNEXPECTED ERROR:', err);
    process.exit(1);
  })
  .finally(() => {
    // Cleanup temp dir
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    if (failed > 0) process.exit(1);
  });
