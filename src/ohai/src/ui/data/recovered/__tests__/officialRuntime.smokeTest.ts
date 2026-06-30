import {
 OFFICIAL_BUFF_BY_ID_LEVEL,
 OFFICIAL_BULLET_RUNTIME_BY_BASE_NO,
 OFFICIAL_GUN_PRESET_BY_EQUIP_ID,
 OFFICIAL_GUN_RUNTIME_BY_GUN_NO,
 OFFICIAL_RUNTIME_CATALOG,
 OFFICIAL_WEAPON_EQUIPMENT_BY_EQUIP_ID,
} from '../officialRuntime.generated';

function assert(condition: unknown, message: string): void {
 if (!condition) throw new Error(message);
}

assert(OFFICIAL_RUNTIME_CATALOG.weaponEquipments.length >= 2000, 'expected official weapon equipment rows');
assert(OFFICIAL_RUNTIME_CATALOG.gunPresetStats.length >= 1900, 'expected official gun preset rows');
assert(OFFICIAL_RUNTIME_CATALOG.gunRuntimeStats.length >= 300, 'expected official gun runtime rows');
assert(OFFICIAL_RUNTIME_CATALOG.bulletRuntimeStats.length >= 300, 'expected official bullet runtime rows');
assert(OFFICIAL_RUNTIME_CATALOG.buffDefinitions.length >= 1400, 'expected official buff rows');
assert(OFFICIAL_RUNTIME_CATALOG.behaviorBuffLinks.length >= 2900, 'expected official behavior-buff links');

const desertEagleEquip = OFFICIAL_WEAPON_EQUIPMENT_BY_EQUIP_ID.get(10111100) as any;
assert(desertEagleEquip?.gunNo === 10110011, 'expected Desert Eagle equipment to link gun 10110011');
assert(desertEagleEquip?.blueprintNo === 13111101, 'expected Desert Eagle blueprint id');

const desertEaglePreset = OFFICIAL_GUN_PRESET_BY_EQUIP_ID.get(10111100) as any;
assert(desertEaglePreset?.gunPresetAttack === 79, 'expected official Desert Eagle preset attack');
assert(desertEaglePreset?.baseAttrs?.some((attr: any) => attr.attrId === 'O1100'), 'expected official base attr list');

const desertEagleRuntime = OFFICIAL_GUN_RUNTIME_BY_GUN_NO.get(10110011) as any;
assert(desertEagleRuntime?.autoTimeInterval === 0.315, 'expected official Desert Eagle fire interval');
assert(desertEagleRuntime?.bulletBaseNo === 10110011, 'expected official Desert Eagle bullet base');

const desertEagleBullet = OFFICIAL_BULLET_RUNTIME_BY_BASE_NO.get(10110011) as any;
assert(desertEagleBullet?.bulletSpeed === 280, 'expected official Desert Eagle bullet speed');

const buff10003 = OFFICIAL_BUFF_BY_ID_LEVEL.get('10003:1') as any;
assert(buff10003?.buffMaxStack === 15, 'expected official buff 10003 max stack');
assert(buff10003?.lifeTime === 12.9, 'expected official buff 10003 lifetime');

console.log('Recovered official runtime smoke test passed');
