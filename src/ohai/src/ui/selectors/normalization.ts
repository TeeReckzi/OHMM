// Canonical normalization helpers for selector system

export function getCanonicalItemKey(input: string | { id?: string; slug?: string; name?: string }): string {
 if (typeof input === 'object') {
  return input.id || input.slug || normalizeKey(input.name || '');
 }
 return normalizeKey(input);
}

function normalizeKey(s: string): string {
 return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeWeaponFamily(input: string): string {
 const map: Record<string, string> = {
  pistol: 'pistol',
  shotgun: 'shotgun',
  smg: 'smg',
  submachinegun: 'smg',
  'sub machine gun': 'smg',
  assaultrifle: 'assault_rifle',
  'assault rifle': 'assault_rifle',
  sniperrifle: 'sniper_rifle',
  'sniper rifle': 'sniper_rifle',
  lmg: 'lmg',
  'light machine gun': 'lmg',
  bow: 'bow',
  crossbow: 'crossbow',
  heavy: 'heavy',
  melee: 'melee',
 };
 const key = input.toLowerCase().replace(/[^a-z]/g, '');
 return map[key] || input.toLowerCase();
}

export const ALL_WEAPON_FAMILIES = [
 'pistol','shotgun','smg','assault_rifle','sniper_rifle','lmg','bow','crossbow','heavy','melee'
];

export const ALL_MECHANIC_FAMILIES = [
 'burn','blaze','scorch','power_surge','surge','frost_vortex','frozen','frost',
 'bullseye','mark','fortress_warfare','armed','unstable_bomber','fast_gunner','quick_draw',
 'bounce','shrapnel','crit','weakspot','status','elemental'
];

export function normalizeMechanicFamily(input: string): string {
 const map: Record<string, string> = {
  burn: 'burn',
  powersurge: 'power_surge',
  'power surge': 'power_surge',
  frostvortex: 'frost_vortex',
  'frost vortex': 'frost_vortex',
  bullseye: 'bullseye',
  fortresswarfare: 'fortress_warfare',
  'fortress warfare': 'fortress_warfare',
  unstablebomber: 'unstable_bomber',
  'unstable bomber': 'unstable_bomber',
  fastgunner: 'fast_gunner',
  'fast gunner': 'fast_gunner',
  bounce: 'bounce',
  shrapnel: 'shrapnel',
  crit: 'crit',
  weakspot: 'weakspot',
  status: 'status',
  elemental: 'elemental',
 };
 const key = input.toLowerCase().replace(/[^a-z]/g, '');
 return map[key] || input.toLowerCase();
}

export function normalizeArmorSlot(input: string): string {
 const map: Record<string, string> = {
  head: 'helmet',
  helmet: 'helmet',
  mask: 'mask',
  gloves: 'gloves',
  torso: 'torso',
  chest: 'torso',
  legs: 'legs',
  pants: 'legs',
  boots: 'boots',
 };
 return map[input.toLowerCase()] || input.toLowerCase();
}

export function normalizeModSlot(input: string): { slot: string; type: 'core' | 'suffix' } {
 const lower = input.toLowerCase();
 if (lower.includes('suffix')) return { slot: lower.replace('suffix', ''), type: 'suffix' };
 if (lower.includes('core')) return { slot: lower.replace('coremod', '').replace('core', ''), type: 'core' };
 return { slot: lower, type: 'core' };
}

export function dedupeDisplayValues(values: string[]): string[] {
 const seen = new Set<string>();
 const out: string[] = [];
 for (const v of values) {
  const k = normalizeWeaponFamily(v); // normalize before dedupe
  if (!seen.has(k)) {
   seen.add(k);
   out.push(v);
  }
 }
 return out;
}

// =====================================================
// ARMOR SLOT ADAPTERS (Boundary Layer - Sprint C-B)
// Do not use these to refactor components yet.
// Purpose: single place for mapping between BuildSelection keys
// (head/chest/pants) and selector/UI keys (helmet/torso/legs).
// Use for normalization at load/save/calc boundaries only.
// =====================================================

export type BuildArmorSlot = 'head' | 'mask' | 'chest' | 'gloves' | 'pants' | 'boots';
export type SelectorArmorSlot = 'helmet' | 'mask' | 'torso' | 'gloves' | 'legs' | 'boots';

const BUILD_TO_SELECTOR: Record<BuildArmorSlot, SelectorArmorSlot> = {
 head: 'helmet',
 mask: 'mask',
 chest: 'torso',
 gloves: 'gloves',
 pants: 'legs',
 boots: 'boots',
};

const SELECTOR_TO_BUILD: Record<SelectorArmorSlot, BuildArmorSlot> = {
 helmet: 'head',
 mask: 'mask',
 torso: 'chest',
 gloves: 'gloves',
 legs: 'pants',
 boots: 'boots',
};

export function isBuildArmorSlot(key: string): key is BuildArmorSlot {
 return key in BUILD_TO_SELECTOR;
}

export function isSelectorArmorSlot(key: string): key is SelectorArmorSlot {
 return key in SELECTOR_TO_BUILD;
}

export function toBuildArmorSlot(input: string): BuildArmorSlot | null {
 const lower = input.toLowerCase();
 if (isBuildArmorSlot(lower)) return lower;
 if (isSelectorArmorSlot(lower)) return SELECTOR_TO_BUILD[lower];
 return null;
}

export function toSelectorArmorSlot(input: string): SelectorArmorSlot | null {
 const lower = input.toLowerCase();
 if (isSelectorArmorSlot(lower)) return lower;
 if (isBuildArmorSlot(lower)) return BUILD_TO_SELECTOR[lower];
 return null;
}

/**
 * Normalizes an armor object (e.g. from BuildSelection.armor) to use
 * canonical Build keys. Returns a new object + warnings for any unknown keys.
 */
export function normalizeArmorToBuildKeys(
 armor: Record<string, string | { id: string; stars?: number; tier?: number }>
): { normalized: Partial<Record<BuildArmorSlot, string | { id: string; stars?: number; tier?: number }>>; warnings: string[] } {
 const normalized: Partial<Record<BuildArmorSlot, string | { id: string; stars?: number; tier?: number }>> = {};
 const warnings: string[] = [];

 const getId = (v: any) => (typeof v === 'string' ? v : v?.id) || '';

 // Process in two passes to define clear winner on collision:
 // 1. Explicit Build keys win over mapped Selector keys
 const buildKeysFirst: Array<[string, any]> = [];
 const selectorKeys: Array<[string, any]> = [];

 for (const [rawKey, value] of Object.entries(armor)) {
  const id = getId(value);
  if (!id || id === 'none' || id === '') continue;
  const payload = value; // preserve full object (with stars/tier) or string
  if (isBuildArmorSlot(rawKey)) {
   buildKeysFirst.push([rawKey, payload]);
  } else if (isSelectorArmorSlot(rawKey)) {
   selectorKeys.push([rawKey, payload]);
  } else {
   warnings.push(`Unknown armor slot key "${rawKey}" - value "${id}" ignored during normalization`);
  }
 }

 // Apply Build keys first (they win collisions)
 for (const [key, value] of buildKeysFirst) {
  const bKey = key as BuildArmorSlot;
  normalized[bKey] = value;
 }

 // Apply selector mappings only if the target Build key not already set
 for (const [rawKey, value] of selectorKeys) {
  const buildKey = toBuildArmorSlot(rawKey) as BuildArmorSlot;
  if (!Object.prototype.hasOwnProperty.call(normalized, buildKey)) {
   normalized[buildKey] = value;
  } else {
   warnings.push(`Collision for slot "${rawKey}" (maps to ${buildKey}): explicit Build key took precedence over Selector key`);
  }
 }

 // Ensure all build keys exist
 const allKeys: BuildArmorSlot[] = ['head', 'mask', 'chest', 'gloves', 'pants', 'boots'];
 for (const k of allKeys) {
  if (!(k in normalized)) {
   const orig = (armor as any)[k];
   normalized[k] = orig || '';
  }
 }

 return { normalized, warnings };
}
