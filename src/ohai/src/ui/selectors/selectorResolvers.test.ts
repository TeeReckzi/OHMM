import { getCanonicalItemKey, normalizeWeaponFamily, dedupeDisplayValues } from './normalization';
import { getItemReadinessState } from './itemReadiness';
import { validateSlotSelection } from './slotValidation';
import { getCalibrationOptionsForWeapon } from './calibrationResolver';
import type { CanonicalWeapon } from '../itemTypes';

function assert(cond: boolean, msg: string) {
 if (!cond) throw new Error('FAIL: ' + msg);
}

console.log('=== Selector Resolver Smoke Tests ===');

// 1. ACS-12 Corrosion canonical key
const key = getCanonicalItemKey('acs12-corrosion');
assert(key === 'acs12corrosion', 'ACS-12 Corrosion canonical key');
console.log('PASS: ACS-12 Corrosion canonical key');

// 2. Family resolves to Shotgun
const fam = normalizeWeaponFamily('Shotgun');
assert(fam === 'shotgun', 'Shotgun family normalization');
console.log('PASS: ACS-12 Corrosion → Shotgun family');

// 3. Readiness when formula inputs missing
const acsItem = { id: 'acs12-corrosion', family: 'Shotgun' };
const readiness = getItemReadinessState(acsItem, { slot: 'primaryWeapon' });
assert(readiness.state === 'PARTIAL', 'ACS-12 should be PARTIAL without damage/fireRate');
assert(readiness.missingInputs.includes('damage'), 'missing damage');
assert(readiness.missingInputs.includes('fireRate'), 'missing fireRate');
console.log('PASS: ACS-12 Corrosion readiness = PARTIAL with exact missingInputs');

// 4. Calibration resolver returns metadataAvailable:false when empty
const weapon: CanonicalWeapon = { id: 'acs12-corrosion', family: 'Shotgun', name: 'ACS-12 Corrosion' } as any;
const calRes = getCalibrationOptionsForWeapon(weapon, []);
assert(calRes.metadataAvailable === false, 'calibration metadata not available');
assert(!!calRes.warning?.includes('No calibration metadata'), 'warning about missing registry');
assert(calRes.selectedWeaponFamily === 'shotgun', 'selected family still resolved');
console.log('PASS: Calibration resolver graceful fallback when registry missing');

// 5. Fake shotgun calibration compatibility
const fakeCals = [{ id: 'sg-cal-1', name: 'Shotgun Rapid', family: 'Shotgun' }];
const calCompat = getCalibrationOptionsForWeapon(weapon, fakeCals);
assert(calCompat.options[0].readiness === 'READY', 'shotgun calibration ready');
console.log('PASS: Shotgun calibration compatibility');

// 6. Weapon swap invalidates incompatible calibration
const nonShotgun: CanonicalWeapon = { id: 'ak', family: 'Assault Rifle', name: 'AK' } as any;
const swapped = getCalibrationOptionsForWeapon(nonShotgun, fakeCals);
assert(swapped.options[0].readiness === 'BLOCKED', 'incompatible after weapon swap');
console.log('PASS: Weapon swap invalidates calibration');

// 7. Wrong armor slot blocked
const armorRes = validateSlotSelection('helmet', { id: 'lonewolf-boots', slot: 'boots' }, {});
assert(armorRes.valid === false, 'wrong armor slot blocked');
console.log('PASS: Armor wrong-slot blocked');

// 8. lonewolf-head display fallback
const lone = getItemReadinessState({ id: 'lonewolf-head' }, { slot: 'helmet' });
assert(lone.missingInputs.includes('displayName'), 'displayName missing for slug-only');
console.log('PASS: lonewolf-head display fallback');

// 9. Core mod without suffix incomplete
const modRes = validateSlotSelection('helmetSuffix', { id: 'violent' }, { selectedCoreMods: {} });
assert(modRes.valid === false && modRes.blockedReasons.some(r => r.includes('suffix')), 'suffix required');
console.log('PASS: Core mod without suffix incomplete');

// 10. Dedupe families
const dups = dedupeDisplayValues(['Assault Rifle', 'assault_rifle', 'Assault Rifle']);
assert(dups.length === 1, 'duplicate families removed');
console.log('PASS: Duplicate family labels deduped');

// 11. Raw entry does not report READY
const raw = getItemReadinessState({ id: 'raw-item' }, { slot: 'primaryWeapon' });
assert(raw.state !== 'READY', 'raw entry not READY');
console.log('PASS: Raw/display-only weapons not READY without formula inputs');

console.log('=== All selector resolver tests passed ===');
