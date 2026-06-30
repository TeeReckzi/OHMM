import { weaponRegistry } from '../registries/weaponRegistry';
import { auditWeaponSelectorReadiness } from './weaponAudit';
import { buildWeaponSelectorItems } from './weaponSelectorBuilder';
import { getCanonicalItemKey, normalizeWeaponFamily } from './normalization';
import { getItemReadinessState } from './itemReadiness';

console.log('=== Full Weapon Registry Audit ===');

const audit = auditWeaponSelectorReadiness(weaponRegistry);

console.log(`Total weapons scanned: ${audit.totalScanned}`);
console.log(`READY: ${audit.readyCount}`);
console.log(`PARTIAL: ${audit.partialCount}`);
console.log(`DISPLAY_ONLY: ${audit.displayOnlyCount}`);
console.log(`BLOCKED: ${audit.blockedCount}`);
console.log(`INVALID: ${audit.invalidCount}`);
console.log(`Missing image: ${audit.missingImageCount}`);
console.log(`Missing formula inputs: ${audit.missingFormulaInputCount}`);
console.log(`Missing family: ${audit.missingFamilyCount}`);
console.log(`Missing evidence: ${audit.missingEvidenceCount}`);
console.log(`Duplicate canonical key groups: ${audit.duplicateCanonicalKeys.length}`);
console.log(`Replacement char weapons: ${audit.replacementCharWeapons.length}`);
console.log(`Raw slug fallback weapons: ${audit.rawSlugFallbackWeapons.length}`);

// Golden case: ACS-12 Corrosion
const corrosion = weaponRegistry.find(w => w.id.includes('acs12-corrosion'));
if (corrosion) {
 const key = getCanonicalItemKey(corrosion);
 const fam = normalizeWeaponFamily(corrosion.family || '');
 const ready = getItemReadinessState(corrosion, { slot: 'primaryWeapon' });
 console.log(`\n[ACS-12 Corrosion] key=${key} family=${fam} state=${ready.state}`);
 if (ready.missingInputs.length) console.log(` missingInputs: ${ready.missingInputs.join(', ')}`);
}

// Quick invariant checks
let allHaveReadiness = true;
let allHaveKeys = true;
for (const w of weaponRegistry) {
 const r = getItemReadinessState(w, { slot: 'primaryWeapon' });
 if (!r.state) allHaveReadiness = false;
 if (!getCanonicalItemKey(w)) allHaveKeys = false;
}
console.log(`\nInvariant: every weapon has readiness state = ${allHaveReadiness}`);
console.log(`Invariant: every weapon has canonical key = ${allHaveKeys}`);
console.log(`Invariant: no replacement chars in display = ${audit.replacementCharWeapons.length === 0}`);

console.log('\n=== Audit complete ===');
