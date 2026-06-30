import { getWeaponImageOverride } from './weaponImageOverrides';

const expectedPaths: Record<string, string> = {
  'acs12-corrosion': '/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/acs12-corrosion.png',
  'acs12-pyroclasm-starter': '/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/acs12-pyroclasm-starter.png',
  'ebr-14-octopus-grilled-rings': '/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/ebr-14-octopus-grilled-rings.png',
  'aws-338-bullseye': '/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/aws-338-bullseye.png',
  'aws-338-black-panther': '/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/aws-338-black-panther.png',
};

function assertEqual(actual: string | undefined, expected: string, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual ?? 'undefined'}`);
  }
}
for (const [name, expectedPath] of Object.entries(expectedPaths)) {
  const result = getWeaponImageOverride(name);
  assertEqual(result, expectedPath, `resolves ${name} to correct local path`);
  console.log(`PASS resolves ${name}`);
}

console.log('Weapon image override smoke test passed');
