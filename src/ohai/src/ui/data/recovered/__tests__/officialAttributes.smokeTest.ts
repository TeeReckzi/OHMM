import {
 RECOVERED_OFFICIAL_ATTRIBUTE_BY_ID,
 RECOVERED_OFFICIAL_ATTRIBUTE_BY_KEY,
 RECOVERED_OFFICIAL_ATTRIBUTES,
 getRecoveredOfficialAttribute,
} from '../officialAttributes.generated';

function assert(condition: unknown, message: string): void {
 if (!condition) {
  throw new Error(message);
 }
}

assert(RECOVERED_OFFICIAL_ATTRIBUTES.length >= 800, 'expected recovered official attribute table');

const weaponDurability = getRecoveredOfficialAttribute('Weapon_durability_addition');
assert(weaponDurability?.attrId === 'B28', 'expected official weapon durability attr id B28');
assert(weaponDurability?.maxValue === 100, 'expected official weapon durability max');

const abnormalPvp = getRecoveredOfficialAttribute('abnormal_dmg_conversion_pvp');
assert(abnormalPvp?.attrId === 'Y03', 'expected abnormal PVP conversion attr id Y03');
assert(abnormalPvp?.minValue === -1, 'expected abnormal PVP conversion min');

assert(RECOVERED_OFFICIAL_ATTRIBUTE_BY_KEY.get('action_speed_add_rate')?.attrId === 'S21', 'expected action speed attr key lookup');
assert(RECOVERED_OFFICIAL_ATTRIBUTE_BY_ID.get('B29')?.key === 'Armor_durability_addition', 'expected attr id lookup');

console.log('Recovered official attributes smoke test passed');
