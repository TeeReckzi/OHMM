import { weaponRegistry } from '../../../registries/weaponRegistry';
import {
 OFFICIAL_WEAPON_STAT_GROUPS,
 buildOfficialWeaponStatAudit,
 matchOfficialWeaponStatGroup,
} from '../officialWeaponStatAdapter';

function assert(condition: unknown, message: string): void {
 if (!condition) throw new Error(message);
}

assert(OFFICIAL_WEAPON_STAT_GROUPS.length >= 20, 'expected official weapon stat platform groups');

const akm = weaponRegistry.find((weapon) => weapon.id === 'akm');
assert(akm, 'expected AKM in weapon registry');

const akmMatch = matchOfficialWeaponStatGroup(akm!);
assert(akmMatch.status === 'matched', 'expected AKM to match official AK platform');
assert(akmMatch.official?.fireRateRpm?.values.some((value) => Math.abs(value - 600) < 0.01), 'expected official AK fire rate around 600 RPM');

const acs12 = weaponRegistry.find((weapon) => weapon.id === 'acs12-corrosion');
assert(acs12, 'expected ACS-12 Corrosion in weapon registry');

const acs12Match = matchOfficialWeaponStatGroup(acs12!);
assert(acs12Match.status === 'matched', 'expected ACS-12 to match official AA12 platform');
assert(acs12Match.official?.projectileBulletSpeed, 'expected ACS-12 official projectile bullet speed');

const audit = buildOfficialWeaponStatAudit(weaponRegistry);
assert(audit.length === weaponRegistry.length, 'expected one official weapon audit row per registry weapon');
assert(audit.some((row) => row.match.status === 'matched'), 'expected at least one matched audit row');
assert(audit.some((row) => row.comparisons.fireRate?.severity === 'warning'), 'expected at least one fire-rate mismatch warning');

console.log('Official weapon stat adapter smoke test passed');
