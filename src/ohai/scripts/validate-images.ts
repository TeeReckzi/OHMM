/**
 * Image validation script.
 * Checks for image-related issues in the codebase.
 *
 * Checks:
 * - local image references exist under public/assets
 * - remote image URLs in source files
 * - stale src/data/external/ohdb paths
 * - backslashes in web paths
 * - duplicate slashes in paths
 * - missing image extensions where filename implies an image
 *
 * Detection only. Does not fix anything.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const PUBLIC_DIR = join(ROOT, 'public');
const CUTOUT_SAFE_DIR = join(PUBLIC_DIR, 'assets/ohdb_import_corpus_v2/images_cutout_safe');

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ui',
  'coverage',
  '.git',
  'tools',
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

// Check 1: stale src/data/external/ohdb paths
function checkStaleOhdbPaths(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('data/external/ohdb') || line.includes('src/data/external/ohdb')) {
      addFinding(relPath, i + 1, 'error', 'stale-ohdb-path', 'Stale src/data/external/ohdb path (moved to src/presentation/ohdb)');
    }
  }
}

// Check 2: backslashes in web paths
function checkBackslashesInPaths(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for backslashes in string literals that look like web paths
    if (/['"][^'"]*\\[^'"]*['"]/.test(line) && (line.includes('/assets/') || line.includes('images/') || line.includes('icon'))) {
      // Exclude Windows file system paths (C:\, etc.)
      if (!line.includes('C:\\') && !line.includes('process.cwd()')) {
        addFinding(relPath, i + 1, 'warning', 'backslash-path', 'Backslash in web path (should use forward slashes)');
      }
    }
  }
}

// Check 3: duplicate slashes in paths
function checkDuplicateSlashes(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for // in string literals that look like paths (but not http:// or https://)
    if (/['"][^'"]*\/{2,}[^'"]*['"]/.test(line) && !line.includes('http://') && !line.includes('https://')) {
      addFinding(relPath, i + 1, 'warning', 'duplicate-slash', 'Duplicate slashes in path');
    }
  }
}

// Check 4: remote image URLs
function checkRemoteImageUrls(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for remote image URLs (http/https with image extensions)
    if (/https?:\/\/[^"'\s]+\.(png|jpg|jpeg|gif|webp|svg)/i.test(line)) {
      addFinding(relPath, i + 1, 'warning', 'remote-image-url', 'Remote image URL found');
    }
  }
}

// Check 5: missing image extensions
function checkMissingImageExtensions(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for image path assignments without extensions
    const imagePatterns = [
      /(?:icon|image|src|path|url)\s*[:=]\s*['"]([^'"]+)['"]/,
      /['"]\/assets\/[^'"]+['"]/,
      /['"]\/images\/[^'"]+['"]/,
    ];
    
    for (const pattern of imagePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const path = match[1];
        // Skip if it's a remote URL or has an extension
        if (path.startsWith('http://') || path.startsWith('https://')) continue;
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path)) continue;
        // Skip if it's clearly not an image path (e.g., directory paths)
        if (path.endsWith('/')) continue;
        
        // Check if it looks like it should be an image
        if (path.includes('icon') || path.includes('image') || path.includes('cutout') || path.includes('weapon') || path.includes('armor')) {
          addFinding(relPath, i + 1, 'warning', 'missing-image-extension', 'Image path may be missing extension');
        }
      }
    }
  }
}

// Check 6: local image references that don't exist
function checkLocalImageReferences(file: string, content: string, relPath: string) {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for local image path references
    const localPathMatches = line.matchAll(/['"]\/assets\/ohdb_import_corpus_v2\/images_cutout_safe\/([^'"]+)['"]/g);
    
    for (const match of localPathMatches) {
      const imagePath = match[1];
      const fullPath = join(CUTOUT_SAFE_DIR, imagePath);
      
      if (!existsSync(fullPath)) {
        addFinding(relPath, i + 1, 'warning', 'missing-local-image', `Local image not found: ${imagePath}`);
      }
    }
  }
}

// Main validation
console.log('🖼️  Validating images...\n');

// Check if cutout-safe directory exists
if (!existsSync(CUTOUT_SAFE_DIR)) {
  console.error(`❌ Cutout-safe directory not found: ${CUTOUT_SAFE_DIR}`);
  process.exit(1);
}

// Count images
let imageCount = 0;
function countImages(dir: string) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      countImages(full);
    } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry)) {
      imageCount++;
    }
  }
}
countImages(CUTOUT_SAFE_DIR);
console.log(`Found ${imageCount} images in cutout-safe directory.\n`);

const files = walk(SRC_DIR);

for (const file of files) {
  const relPath = relative(ROOT, file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');
  
  checkStaleOhdbPaths(file, content, relPath);
  checkBackslashesInPaths(file, content, relPath);
  checkDuplicateSlashes(file, content, relPath);
  checkRemoteImageUrls(file, content, relPath);
  checkMissingImageExtensions(file, content, relPath);
  checkLocalImageReferences(file, content, relPath);
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
  
  console.error(`\nImage validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
} else {
  console.log(`\n✓ Image validation passed with ${warnings.length} warning(s).`);
  process.exit(0);
}
