/**
 * Future-safe scaffolding for equipped mod ownership.
 * These types prepare for highest-owned-level + shiny support
 * without implementing fabricated scaling or flash effects.
 */

export interface FutureEquippedModDraft {
  coreModId: string;
  suffixId: string;
  highestOwnedLevel?: number;      // TODO: populate from inventory when available
  activeSubstats?: string[];       // TODO: derive from level when data exists
  isShiny?: boolean;
  flashEffect?: unknown;           // placeholder – never invent values
  flashEffectSource?: string;
}

export interface ModCorePresentation {
  coreModId: string;
  canonicalName: string;
  slot: string | null;
  category: string | null;
  coreEffectDisplayText: string | null;
  availableSuffixes: string[];
  image?: string | null;
}

export interface ModVariantPresentation {
  coreModId: string;
  suffixId: string;
  displayName: string;
  slot: string | null;
  category: string | null;
  image: string | null;
  source: 'ohdb' | 'ohai' | 'mixed';
}
