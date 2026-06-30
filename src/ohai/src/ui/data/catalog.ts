import type { WeaponBlueprint, DamageProfile } from '../types';
import type { AnyCanonicalItem, CanonicalPvETarget, CanonicalArmor, CanonicalKeyGear, CanonicalMod } from '../itemTypes';
import { weaponRegistry } from '../registries/weaponRegistry';
import { armorRegistry, keyGearRegistry } from '../registries/armorRegistry';
import { enrichCatalogArmorItem } from '../../presentation/armorPresentationBridge';
import { enrichCatalogModItem } from '../../presentation/modPresentationBridge';
import { modRegistry } from '../registries/modRegistry';
import { foodBuffRegistry } from '../registries/foodBuffRegistry';
import { deviationRegistry } from '../registries/deviationRegistry';
import { cradleRegistry } from '../registries/cradleRegistry';
import { pveTargetRegistry } from '../registries/pveTargetRegistry';
import { ammoRegistry } from '../registries/ammoRegistry';
import { getAttachmentsBySlot, getAttachmentsBySlotAndFamily } from '../registries/attachmentRegistry';
import { getModsBySlot } from '../registries/modRegistry';
import type { AttachmentSlot } from '../itemTypes';
import { displayKeywordLabel, displayTagLabel, displayWeaponFamilyLabel } from '../displayLabels';
import { resolveLocalImage, type ManifestCategory } from './localImageResolver';

export interface CatalogItem {
 id: string;
 name: string;
 iconUrl?: string;
 category?: string;
 description?: string;
 effects?: string[];
 slot?: string;
 modType?: 'core' | 'suffix';
}

export interface TargetProfile extends CatalogItem {
 group: 'Monolith Boss' | 'Silo Boss' | 'Silo Side-Boss' | 'Elite / Field Boss';
 recommendedMode: 'pve';
 resistanceHint: string;
}

const imageSlug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function localImagePath(kind: ManifestCategory, id: string): string {
 return `/assets/ohdb_import_corpus_v2/images_cutout_safe/${kind}/${imageSlug(id)}.png`;
}

function withLocalIcon(item: CatalogItem, kind: ManifestCategory): CatalogItem {
 if (item.id === 'none' || item.id === 'empty') return item;
 return { ...item, iconUrl: resolveLocalImage(kind, item.id, item.name) ?? item.iconUrl ?? localImagePath(kind, item.id) };
}

const weaponIconById: Record<string, string> = {};

const itemIconById: Record<string, string> = {};

function keywordLabel(item: AnyCanonicalItem): string {
 const firstKeyword = item.keywordAssociations?.[0];
 const firstTag = item.tags.find((tag) => !tag.includes(':'));
 return displayKeywordLabel(firstKeyword ?? firstTag ?? 'General');
}

function catalogEffects(item: AnyCanonicalItem): string[] {
 const effects = [item.effectSummary];

 if (item.statModifiers?.length) {
  effects.push(
   ...item.statModifiers.map((modifier) => {
    const unit = modifier.unit === 'percent' ? '%' : modifier.unit ? ` ${modifier.unit}` : '';
    return `${modifier.stat}: ${modifier.value}${unit}`;
   }),
  );
 }

 if (item.formulaSupport?.status) {
  effects.push(`Formula support: ${item.formulaSupport.status}`);
 }

 effects.push(`Confidence: ${item.confidence}${item.needsReview ? ' · needs review' : ''}`);

 if (item.sourceNotes) {
  effects.push(item.sourceNotes);
 }

 return effects;
}

function itemSlot(item: AnyCanonicalItem): string | undefined {
 if (item.category === 'armor') return (item as CanonicalArmor).slot;
 if (item.category === 'key_gear') return (item as CanonicalKeyGear).slot;
 if (item.category === 'mod') return (item as CanonicalMod).modSlot;
 return undefined;
}

function itemModType(item: AnyCanonicalItem): 'core' | 'suffix' | undefined {
 if (item.category !== 'mod') return undefined;
 return (item as CanonicalMod).modType;
}

function cleanCatalogName(item: AnyCanonicalItem): string {
 const raw = item.name && !item.name.includes('-') ? item.name : item.id;
 const slotMap: Record<string, string> = { head: 'Helmet', chest: 'Chest', pants: 'Pants', boots: 'Boots', mask: 'Mask', gloves: 'Gloves' };
 return raw
  .split('-')
  .map((part) => slotMap[part] ?? (part === 'lonewolf' ? 'Lone Wolf' : part.charAt(0).toUpperCase() + part.slice(1)))
  .join(' ');
}

function toCatalogItem(item: AnyCanonicalItem): CatalogItem {
 return {
  id: item.id,
  name: cleanCatalogName(item),
  iconUrl: itemIconById[item.id],
  category: item.subcategory ?? displayTagLabel(item.category),
  description: item.effectSummary,
  effects: catalogEffects(item),
  slot: itemSlot(item),
  modType: itemModType(item),
 };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
 const seen = new Set<string>();
 return items.filter((item) => {
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return true;
 });
}

export const weaponBlueprints: WeaponBlueprint[] = weaponRegistry.map((weapon) => ({
 id: weapon.id,
 name: weapon.name,
 family: displayWeaponFamilyLabel(weapon.family),
 blueprintQuality: weapon.blueprintQuality,
 maxStars: weapon.maxStars,
 keyword: keywordLabel(weapon),
 damageProfile: weapon.damageProfile as DamageProfile,
 iconUrl: weaponIconById[weapon.id] ?? resolveLocalImage('weapons', weapon.id, weapon.name) ?? localImagePath('weapons', weapon.id),
}));

export const targetProfiles: TargetProfile[] = pveTargetRegistry.map((target: CanonicalPvETarget) => ({
 id: target.id,
 name: target.name,
 group: target.targetType === 'boss'
  ? 'Monolith Boss'
  : target.targetType === 'elite'
   ? 'Elite / Field Boss'
   : 'Silo Side-Boss',
 recommendedMode: 'pve',
 category: target.subcategory ?? target.faction ?? displayTagLabel(target.targetType),
 description: target.effectSummary,
 resistanceHint: target.sourceNotes ?? 'Use verified target metadata when available.',
 effects: catalogEffects(target),
}));

const ammoOptions: CatalogItem[] = ammoRegistry.map((ammo) => ({
 id: ammo.id,
 name: ammo.name,
 category: `Ammo · ${displayTagLabel(ammo.ammoCategory)}`,
 description: ammo.sourceNotes ?? `${ammo.name} ammunition profile.`,
 effects: [
  `Ammo category: ${displayTagLabel(ammo.ammoCategory)}`,
  `Compatible families: ${ammo.compatibleWeaponFamilies.map(displayWeaponFamilyLabel).join(', ') || 'None'}`,
  `Confidence: ${ammo.confidence}${ammo.needsReview ? ' · needs review' : ''}`,
 ],
}));

function fromAttachmentRegistry(slot: AttachmentSlot, weaponFamily?: string): CatalogItem[] {
 const items = weaponFamily
  ? getAttachmentsBySlotAndFamily(slot, weaponFamily)
  : getAttachmentsBySlot(slot);
 return items.map((a) => ({
  id: a.id,
  name: a.name,
  iconUrl: a.iconUrl,
  category: 'attachment',
  slot,
  effects: a.effectSummary ? [a.effectSummary] : undefined,
 }));
}

function formatModDisplayName(name: string): string {
 return name
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
}

function fromModRegistry(slot: string, modType: 'core' | 'suffix'): CatalogItem[] {
 return getModsBySlot(slot)
  .filter((m) => m.modType === modType)
  .map((m) => ({
   id: m.id,
   name: formatModDisplayName(m.name),
   category: modType === 'core' ? `${displayTagLabel(slot)} mod` : `${displayTagLabel(slot)} suffix`,
   description: m.effectSummary,
   effects: catalogEffects(m as AnyCanonicalItem),
   slot,
   modType,
  }));
}

export const attachmentOptions: Record<string, CatalogItem[]> = {
 optic: [
  { id: 'none', name: 'No Optic', description: 'No optic modifier selected.', effects: ['Baseline sight behavior'], slot: 'optic' },
  ...fromAttachmentRegistry("optic"),
 ],
 muzzle: [
  { id: 'none', name: 'No Muzzle', description: 'No muzzle modifier selected.', effects: ['Baseline recoil and spread behavior'], slot: 'muzzle' },
  ...fromAttachmentRegistry("muzzle"),
 ],
 magazine: [
  { id: 'none', name: 'No Magazine', description: 'No magazine modifier selected.', effects: ['Baseline magazine behavior'], slot: 'magazine' },
  ...fromAttachmentRegistry("magazine"),
 ],
 tactical: [
  { id: 'none', name: 'No Tactical Attachment', description: 'No tactical modifier selected.', effects: ['Baseline handling'], slot: 'tactical' },
  ...fromAttachmentRegistry("tactical"),
 ],
 stock: [
  { id: 'none', name: 'No Stock', description: 'No stock modifier selected.', effects: ['Baseline stability'], slot: 'stock' },
  ...fromAttachmentRegistry("stock"),
 ],
 ammo: ammoOptions,
};

export const armorOptions: CatalogItem[] = uniqueById([
 { id: 'empty', name: 'Not selected', description: 'No armor item selected.', effects: ['Slot ignored'] },
 ...armorRegistry.map((item) => withLocalIcon(enrichCatalogArmorItem(toCatalogItem(item as AnyCanonicalItem)), 'armor')),
 ...keyGearRegistry.map((item) => withLocalIcon(enrichCatalogArmorItem(toCatalogItem(item as AnyCanonicalItem)), 'armor')),
]);

export function getArmorOptionsBySlot(slot: string): CatalogItem[] {
 return armorOptions.filter((item) => item.id === 'empty' || item.slot === slot);
}

const emptyMod = (slot: string): CatalogItem => ({
 id: 'none',
 name: 'None',
 description: `No ${slot} mod selected.`,
 effects: ['Default behavior'],
 slot,
});

export const modOptions: Record<string, CatalogItem[]> = {
 weapon: [emptyMod('weapon'), ...fromModRegistry("weapon", 'core').map(enrichCatalogModItem)],
 head: [emptyMod('head'), ...fromModRegistry("head", 'core').map(enrichCatalogModItem)],
 mask: [emptyMod('mask'), ...fromModRegistry("mask", 'core').map(enrichCatalogModItem)],
 chest: [emptyMod('chest'), ...fromModRegistry("chest", 'core').map(enrichCatalogModItem)],
 gloves: [emptyMod('gloves'), ...fromModRegistry("gloves", 'core').map(enrichCatalogModItem)],
 pants: [emptyMod('pants'), ...fromModRegistry("pants", 'core').map(enrichCatalogModItem)],
 boots: [emptyMod('boots'), ...fromModRegistry("boots", 'core').map(enrichCatalogModItem)],
};

export const modSuffixOptions: Record<string, CatalogItem[]> = {
 weapon: [emptyMod('weapon suffix'), ...fromModRegistry("weapon", 'suffix').map(enrichCatalogModItem)],
 head: [emptyMod('head suffix'), ...fromModRegistry("head", 'suffix').map(enrichCatalogModItem)],
 mask: [emptyMod('mask suffix'), ...fromModRegistry("mask", 'suffix').map(enrichCatalogModItem)],
 chest: [emptyMod('chest suffix'), ...fromModRegistry("chest", 'suffix').map(enrichCatalogModItem)],
 gloves: [emptyMod('gloves suffix'), ...fromModRegistry("gloves", 'suffix').map(enrichCatalogModItem)],
 pants: [emptyMod('pants suffix'), ...fromModRegistry("pants", 'suffix').map(enrichCatalogModItem)],
 boots: [emptyMod('boots suffix'), ...fromModRegistry("boots", 'suffix').map(enrichCatalogModItem)],
};

export const cradlePerks: CatalogItem[] = cradleRegistry.map((item) => toCatalogItem(item as AnyCanonicalItem));

export const deviantOptions: CatalogItem[] = uniqueById([
 { id: 'none', name: 'No Deviant', description: 'No deviant selected.', effects: ['No deviant effects applied'] },
 ...deviationRegistry.map((item) => toCatalogItem(item as AnyCanonicalItem)),
]);

export const foodOptions: CatalogItem[] = uniqueById([
 { id: 'none', name: 'No Food Buff', description: 'No food buff selected.', effects: ['No consumable bonus applied'] },
 ...foodBuffRegistry.map((item) => toCatalogItem(item as AnyCanonicalItem)),
]);
