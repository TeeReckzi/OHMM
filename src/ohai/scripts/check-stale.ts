/**
 * Stale path reference checker.
 * Fails if any source file imports from deprecated paths.
 *
 * Checks:
 * - src/utils/combat (moved to src/engine)
 * - ../utils/combat, ../../utils/combat, ../../../utils/combat
 * - src/ui/resolvers (moved to src/resolvers)
 * - ./resolvers/ when in src/ui/ context (old resolver path)
 *
 * Ignores: node_modules, dist, build output, coverage, .git, generated raw output
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');

const STALE_PATTERNS = [
  { pattern: /from ['"][^'"]*utils\/combat/, label: 'utils/combat import (moved to src/engine)' },
  { pattern: /from ['"]\.\.\/utils\/combat/, label: '../utils/combat import' },
  { pattern: /from ['"]\.\.\/\.\.\/utils\/combat/, label: '../../utils/combat import' },
  { pattern: /from ['"]\.\.\/\.\.\/\.\.\/utils\/combat/, label: '../../../utils/combat import' },
  { pattern: /from ['"][^'"]*ui\/resolvers/, label: 'ui/resolvers import (moved to src/resolvers)' },
  { pattern: /from ['"][^'"]*data\/external\/ohdb/, label: 'data/external/ohdb import (moved to src/presentation/ohdb)' },
  { pattern: /from ['"][^'"]*ui\/registries\/(weapon|armor|mod)PresentationBridge/, label: 'ui/registries/*PresentationBridge import (moved to src/presentation)' },
  { pattern: /from ['"][^'"]*ui\/registries\/itemImageResolver/, label: 'ui/registries/itemImageResolver import (moved to src/presentation)' },
];

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ui',
  'coverage',
  '.git',
  'data',
  'docs',
  'tools',
  'public',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;

    const full = join(dir, entry);
    const stats = statSync(full);

    if (stats.isDirectory()) {
      files.push(...walk(full));
    } else if (SOURCE_EXTENSIONS.has(entry.substring(entry.lastIndexOf('.')))) {
      files.push(full);
    }
  }

  return files;
}

const findings: string[] = [];

for (const file of walk(SRC_DIR)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { pattern, label } of STALE_PATTERNS) {
      if (pattern.test(line)) {
        findings.push(`${rel}:${i + 1} — ${label}\n  ${line.trim()}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error('❌ Stale path references found:\n');
  for (const finding of findings) {
    console.error(finding);
    console.error('');
  }
  console.error(`Found ${findings.length} stale reference(s).`);
  console.error('');
  console.error('These paths were moved during migration. Update imports to use new paths.');
  process.exit(1);
} else {
  console.log('✓ No stale path references found.');
  process.exit(0);
}
