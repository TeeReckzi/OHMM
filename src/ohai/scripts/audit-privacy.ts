import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const blockedPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: 'fetch', pattern: /\bfetch\s*\(/ },
  { label: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { label: 'WebSocket', pattern: /\bWebSocket\b/ },
  { label: 'sendBeacon', pattern: /\bsendBeacon\b/ },
];

const allowedNetworkPrimitiveFiles = new Set([
  // Dev tool that intentionally downloads external icons
  'src/tools/downloadExternalReferenceIcons.ts',
]);

const externalUrlPattern = /https?:\/\//;
const allowedExternalUrlFiles = new Set([
  'src/ui/data/catalog.ts',
  // Generated registry files contain source workbook URLs from the original data
  'src/ui/registries/generated/weapons.generated.ts',
  'src/ui/registries/generated/weaponsStats.generated.ts',
  'src/ui/registries/generated/attachments.generated.ts',
  // Schema and tool references to external documentation
  'src/schemas/externalReferenceSchema.ts',
  'src/tools/downloadExternalReferenceIcons.ts',
  'src/ui/components/IntelGapPanel.tsx',
  'src/ui/registries/staging/stagingValidationSmokeTest.ts',
  'src/ui/registries/weaponRegistry.ts',
]);

const findings: string[] = [];

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(ts|tsx|js|jsx|css|mjs|cjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  for (const blocked of blockedPatterns) {
    if (blocked.pattern.test(text) && !allowedNetworkPrimitiveFiles.has(rel)) {
      findings.push(`${rel}: blocked browser network primitive found (${blocked.label})`);
    }
  }
  if (externalUrlPattern.test(text) && !allowedExternalUrlFiles.has(rel)) {
    findings.push(`${rel}: external URL found outside the audited allowlist`);
  }
}

if (findings.length > 0) {
  console.error('Privacy audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('privacy audit passed');
