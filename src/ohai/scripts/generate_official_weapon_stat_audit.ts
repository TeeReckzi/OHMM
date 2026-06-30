import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { weaponRegistry } from '../src/ui/registries/weaponRegistry';
import { buildOfficialWeaponStatAudit } from '../src/ui/data/recovered/officialWeaponStatAdapter';

const outputArgIndex = process.argv.findIndex((arg) => arg === '-o' || arg === '--output');
const positionalOutput = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const outputPath = resolve(
  outputArgIndex >= 0 && process.argv[outputArgIndex + 1]
    ? process.argv[outputArgIndex + 1]
    : positionalOutput
      ? positionalOutput
    : '../../docs/OFFICIAL_WEAPON_STAT_AUDIT.json',
);

const audit = buildOfficialWeaponStatAudit(weaponRegistry);
const summary = {
  generatedAt: new Date().toISOString(),
  weaponCount: audit.length,
  matchedCount: audit.filter((row) => row.match.status === 'matched').length,
  ambiguousCount: audit.filter((row) => row.match.status === 'ambiguous').length,
  missingCount: audit.filter((row) => row.match.status === 'missing').length,
  fireRateWarningCount: audit.filter((row) => row.comparisons.fireRate?.severity === 'warning').length,
  reloadWarningCount: audit.filter((row) => row.comparisons.reloadTimeSeconds?.severity === 'warning').length,
  damageInfoCount: audit.filter((row) => row.comparisons.damagePerProjectile?.severity === 'info').length,
};

writeFileSync(outputPath, `${JSON.stringify({ summary, audit }, null, 2)}\n`, 'utf-8');
console.log(JSON.stringify({ output: outputPath, ...summary }, null, 2));
