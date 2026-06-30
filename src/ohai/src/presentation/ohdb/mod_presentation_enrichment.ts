import type { OhdbModVariant } from './ohdb_types';
import { loadOhdbModVariants } from './ohdb_adapters';
import { resolveOhdbImage } from './image_resolver';

export interface EnrichedModVariantPresentation {
  displayName: string;
  coreModKey: string;
  suffixKey: string;
  suffixDisplayName: string;
  slotLabel: string | null;
  categoryLabel: string | null;
  image: string | null;
  coreEffectText: string | null;
  source: 'ohdb' | 'ohai' | 'mixed';
}

export function enrichModVariantPresentation(variant: OhdbModVariant): EnrichedModVariantPresentation {
  const resolved = resolveOhdbImage({ ...variant, family: '', variantName: null } as any, 'mods');

  return {
    displayName: variant.name,
    coreModKey: variant.coreModKey,
    suffixKey: variant.suffixKey,
    suffixDisplayName: variant.variant,
    slotLabel: variant.modType,
    categoryLabel: variant.category,
    image: resolved?.src ?? resolved?.path ?? null,
    coreEffectText: variant.coreEffect,
    source: 'ohdb'
  };
}

export function getOhdbModVariants(): OhdbModVariant[] {
  return loadOhdbModVariants().data;
}

export function getOhdbModVariantsForCore(coreModKey: string): OhdbModVariant[] {
  return getOhdbModVariants().filter(v => v.coreModKey === coreModKey);
}

export function getOhdbModVariant(coreModKey: string, suffixName: string): OhdbModVariant | undefined {
  return getOhdbModVariants().find(v =>
    v.coreModKey === coreModKey && v.variant === suffixName
  );
}

export function getAvailableSuffixesForCore(coreModKey: string): string[] {
  const variants = getOhdbModVariantsForCore(coreModKey);
  return [...new Set(variants.map(v => v.variant))];
}
