import { armorOptions, getArmorOptionsBySlot, modOptions, modSuffixOptions } from '../data/catalog';

const armorSlots = ['head', 'mask', 'chest', 'gloves', 'pants', 'boots'];
const modSlots = ['weapon', 'head', 'mask', 'chest', 'gloves', 'pants', 'boots'];

function assert(condition: unknown, message: string): void {
 if (!condition) throw new Error(message);
}

for (const slot of armorSlots) {
 const options = getArmorOptionsBySlot(slot);
 assert(options.length > 0, `Expected armor options for ${slot}`);
 assert(options.some((item) => item.id === 'empty'), `Expected empty armor option for ${slot}`);
 for (const item of options) {
  assert(item.id === 'empty' || item.slot === slot, `Armor option ${item.id} leaked into ${slot}; item slot=${item.slot}`);
 }
}

for (const item of armorOptions) {
 if (item.id === 'empty') continue;
 assert(item.slot && armorSlots.includes(item.slot), `Armor option ${item.id} missing valid slot metadata`);
}

for (const slot of modSlots) {
 const coreOptions = modOptions[slot] ?? [];
 const suffixOptions = modSuffixOptions[slot] ?? [];
 assert(coreOptions.length > 0, `Expected core mod options for ${slot}`);
 assert(suffixOptions.length > 0, `Expected suffix mod options for ${slot}`);
 for (const item of coreOptions) {
  assert(item.id === 'none' || item.modType === 'core', `Core selector ${slot} contains non-core mod ${item.id}`);
 }
 for (const item of suffixOptions) {
  assert(item.id === 'none' || item.modType === 'suffix', `Suffix selector ${slot} contains non-suffix mod ${item.id}`);
 }
}

console.log('loadoutSlotFilteringSmokeTest passed');
