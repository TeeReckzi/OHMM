/**
 * Data validation script.
 * Checks for registry data quality issues that block registry migration.
 *
 * Checks:
 * - wikily / oncehuman.wiki URLs in source files
 * - remote URLs in canonical registry/data files
 * - empty statModifiers in canonical mod/armor/weapon registries
 * - possible core-only mod selection paths
 * - suffix value "none"
 * - coreModId without suffixId
 * - selectedMod without selectedSuffix
 * - `as any` in engine/resolvers/registries/presentation
 * - registry-like files not under src/registries/
 *
 * Detection only. Does not fix anything.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ui',
  'coverage',
  '.git',
  'tools',
  'public',
  '__tests__',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

interface Finding {
  file: string;
  line: number;
  type: 'error' | 'warning';
  category: string;
  message: string;
}

const errors: Finding[] = [];
const warnings: Finding[] = [];

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

function addFinding(file: string, line: number, type: 'error' | 'warning', category: string, message: string) {
  const finding: Finding = { file, line, type, category, message };
  if (type === 'error') {
    errors.push(finding);
  } else {
    warnings.push(finding);
  }
}

// Check 1: wikily / oncehuman.wiki URLs
function checkWikilyUrls(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('wikily.gg') || line.includes('oncehuman.wiki')) {
      addFinding(relPath, i + 1, 'error', 'wikily-url', 'Remote wikily/oncehuman.wiki URL found');
    }
  }
}

// Check 2: remote URLs in registry files
function checkRemoteUrlsInRegistries(file: string, content: string, relPath: string) {
  if (!relPath.includes('registries/') && !relPath.includes('data/')) return;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for http/https URLs in registry data
    if (/(https?:\/\/[^"'\s]+)/.test(line) && !line.includes('// Allow') && !line.includes('// See')) {
      addFinding(relPath, i + 1, 'warning', 'remote-url', 'Remote URL in registry/data file');
    }
  }
}

// Check 3: empty statModifiers in canonical registries
function checkEmptyStatModifiers(file: string, content: string, relPath: string) {
  // Only check canonical registry files (not generated, not staging)
  if (!relPath.includes('registries/') || relPath.includes('generated/') || relPath.includes('staging/')) return;
  if (!relPath.includes('modRegistry') && !relPath.includes('armorRegistry') && !relPath.includes('weaponRegistry')) return;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/statModifiers:\s*\[\]/.test(line)) {
      addFinding(relPath, i + 1, 'warning', 'empty-stat-modifiers', 'Empty statModifiers array in canonical registry');
    }
  }
}

// Check 4: core-only mod selection patterns
function checkCoreOnlyModSelection(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for suffix: "none" or suffix: 'none'
    if (/suffix:\s*["']none["']/.test(line)) {
      addFinding(relPath, i + 1, 'warning', 'suffix-none', 'Suffix value "none" found');
    }
    
    // Check for coreModId without suffixId in same object
    if (/coreModId:/.test(line) && !/suffixId:/.test(line)) {
      // Look ahead a few lines for suffixId
      let hasSuffix = false;
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (/suffixId:/.test(lines[j])) {
          hasSuffix = true;
          break;
        }
      }
      if (!hasSuffix) {
        addFinding(relPath, i + 1, 'warning', 'core-only-mod', 'coreModId without suffixId');
      }
    }
    
    // Check for selectedMod without selectedSuffix
    if (/selectedMod:/.test(line) && !/selectedSuffix:/.test(line)) {
      let hasSuffix = false;
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (/selectedSuffix:/.test(lines[j])) {
          hasSuffix = true;
          break;
        }
      }
      if (!hasSuffix) {
        addFinding(relPath, i + 1, 'warning', 'selected-mod-no-suffix', 'selectedMod without selectedSuffix');
      }
    }
  }
}

// Check 5: `as any` in critical directories
function checkAsAny(file: string, content: string, relPath: string) {
  const criticalDirs = ['engine/', 'resolvers/', 'registries/', 'presentation/'];
  const isInCriticalDir = criticalDirs.some(dir => relPath.includes(dir));
  if (!isInCriticalDir) return;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\bas any\b/.test(line)) {
      addFinding(relPath, i + 1, 'warning', 'as-any', '`as any` cast in critical directory');
    }
  }
}

// Check 6: registry-like files not under src/registries/
function checkRegistryFilesOutsideRegistries(file: string, content: string, relPath: string) {
  if (relPath.includes('src/registries/')) return;
  if (!relPath.startsWith('src/')) return;
  
  // Check if file name suggests it's a registry
  const fileName = relPath.split('/').pop() || '';
  if (/(Registry|registry)\.ts/.test(fileName) && !relPath.includes('ui/registries/')) {
    addFinding(relPath, 1, 'warning', 'registry-location', 'Registry file not under src/registries/');
  }
}

// Main validation
console.log('🔍 Validating data quality...\n');

const files = walk(SRC_DIR);

for (const file of files) {
  const relPath = relative(ROOT, file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');
  
  checkWikilyUrls(file, content, relPath);
  checkRemoteUrlsInRegistries(file, content, relPath);
  checkEmptyStatModifiers(file, content, relPath);
  checkCoreOnlyModSelection(file, content, relPath);
  checkAsAny(file, content, relPath);
  checkRegistryFilesOutsideRegistries(file, content, relPath);
}

// Report
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):\n`);
  const byCategory = new Map<string, Finding[]>();
  for (const w of warnings) {
    if (!byCategory.has(w.category)) byCategory.set(w.category, []);
    byCategory.get(w.category)!.push(w);
  }
  
  for (const [category, findings] of byCategory) {
    console.log(`  ${category}: ${findings.length} occurrence(s)`);
    for (const f of findings.slice(0, 3)) {
      console.log(`    ${f.file}:${f.line} — ${f.message}`);
    }
    if (findings.length > 3) {
      console.log(`    ... and ${findings.length - 3} more`);
    }
    console.log();
  }
}

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} error(s):\n`);
  const byCategory = new Map<string, Finding[]>();
  for (const e of errors) {
    if (!byCategory.has(e.category)) byCategory.set(e.category, []);
    byCategory.get(e.category)!.push(e);
  }
  
  for (const [category, findings] of byCategory) {
    console.error(`  ${category}: ${findings.length} occurrence(s)`);
    for (const f of findings.slice(0, 5)) {
      console.error(`    ${f.file}:${f.line} — ${f.message}`);
    }
    if (findings.length > 5) {
      console.error(`    ... and ${findings.length - 5} more`);
    }
    console.error();
  }
  
  console.error(`\nData validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
} else {
  console.log(`\n✓ Data validation passed with ${warnings.length} warning(s).`);
  process.exit(0);
}
