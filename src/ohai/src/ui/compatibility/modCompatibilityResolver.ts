// src/ui/compatibility/modCompatibilityResolver.ts

import type { LegalityResult, LoadoutContext } from './types';
import { getModById } from '../registries/modRegistry';

export function validateModForSlot(
 slot: string,
 modId: string,
 context: LoadoutContext
): LegalityResult {
 const mod = getModById(modId);
 if (!mod) {
  return {
   status: "INVALID",
   issues: [{ code: "MOD_NOT_FOUND", message: `Mod not found: ${modId}`, severity: "error" }]
  };
 }

 const isSuffix = slot.toLowerCase().includes('suffix');
 const baseSlot = slot
  .replace(/Suffix/i, '')
  .replace(/CoreMod/i, '')
  .toLowerCase();

 if (isSuffix) {
  const hasCore = !!context.mods?.[baseSlot]?.core;
  if (!hasCore) {
   return {
    status: "INVALID",
    issues: [{
     code: "MISSING_CORE_MOD",
     message: `Cannot equip suffix without a core mod in ${baseSlot}`,
     severity: "error"
    }]
   };
  }
  return { status: "VALID", issues: [] };
 }

 return { status: "VALID", issues: [] };
}

export function isModComplete(slot: string, context: LoadoutContext): boolean {
 const core = context.mods?.[slot]?.core;
 const suffix = context.mods?.[slot]?.suffix;
 return !!core && !!suffix;
}
