import { getOhdbModVariantsForCore } from '../../presentation/ohdb/mod_presentation_enrichment';

/**
 * Returns the list of valid suffix IDs for a given core mod.
 * Currently sourced from OHDB mod variants (presentation + reference data).
 * This is a reference layer only — OHAI locked registry remains the gameplay authority.
 */
export function getValidSuffixesForModCore(coreModId: string): string[] {
 if (!coreModId) return [];
 const variants = getOhdbModVariantsForCore(coreModId);
 return [...new Set(variants.map(v => v.suffixKey))];
}

export function isSuffixValidForModCore(coreModId: string, suffixId: string): boolean {
 if (!coreModId || !suffixId) return false;
 const valid = getValidSuffixesForModCore(coreModId);
 return valid.includes(suffixId);
}

export function getModCoreSuffixLegalityReport() {
 // Placeholder for future detailed reporting
 return {
  totalCoresWithSuffixes: 0,
  totalValidPairs: 0,
  coresWithoutSuffixes: [],
 };
}
