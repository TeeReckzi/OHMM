// src/ui/compatibility/loadoutLegalityEngine.test.ts

import { LoadoutLegalityEngine } from './loadoutLegalityEngine';
import type { LoadoutContext } from './types';

const engine = new LoadoutLegalityEngine();

const baseContext: LoadoutContext = {
 primaryWeaponId: 'acs12-corrosion',
 armor: {},
 mods: {},
 attachments: {}
};

function assert(condition: unknown, message: string): void {
 if (!condition) {
  throw new Error(message);
 }
}

function runCase(name: string, fn: () => void): void {
 try {
  fn();
  console.log(`PASS ${name}`);
 } catch (error) {
  console.error(`FAIL ${name}`);
  throw error;
 }
}

runCase('rejects unknown weapon in primary slot', () => {
 const result = engine.validateItemForSlot('primaryWeapon', 'some-missing-weapon', baseContext);
 assert(result.status === 'INVALID', 'expected missing weapon rejection');
 assert(result.issues[0]?.code === 'WEAPON_NOT_FOUND', 'expected WEAPON_NOT_FOUND issue');
});

runCase('rejects attachment incompatible with weapon family', () => {
 const result = engine.validateItemForSlot('magazine', 'lmg-drum', {
  ...baseContext,
  primaryWeaponId: 'acs12-corrosion'
 });
 assert(result.status === 'INVALID', 'expected incompatible attachment rejection');
 assert(result.issues[0]?.code === 'ATTACHMENT_INCOMPATIBLE', 'expected ATTACHMENT_INCOMPATIBLE issue');
});

runCase('rejects suffix without core mod', () => {
 const result = engine.validateItemForSlot('helmetSuffix', 'violent', baseContext);
 assert(result.status === 'INVALID', 'expected missing core mod rejection');
 assert(result.issues[0]?.code === 'MISSING_CORE_MOD', 'expected MISSING_CORE_MOD issue');
});
runCase('allows valid core + suffix combination', () => {
 const contextWithCore: LoadoutContext = {
  ...baseContext,
  mods: {
   helmet: { core: 'violent', suffix: 'precision' }
  }
 };
 const result = engine.validateItemForSlot('helmetSuffix', 'precision', contextWithCore);
 assert(result.status === 'VALID', 'expected valid core + suffix combination');
});

runCase('rejects armor in wrong slot', () => {
 const result = engine.validateItemForSlot('helmet', 'lonewolf-boots', baseContext);
 assert(result.status === 'INVALID', 'expected wrong armor slot rejection');
 assert(result.issues[0]?.code === 'WRONG_ARMOR_SLOT', 'expected WRONG_ARMOR_SLOT issue');
});

console.log('LoadoutLegalityEngine smoke test passed');
