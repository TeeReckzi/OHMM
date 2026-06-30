export type OhdbRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string;

export interface OhdbImageRef {
  category: 'weapons' | 'armor' | 'mods' | 'attachments';
  slug: string;
  name: string;
  variant?: string | null;
  slot?: string | null;
  sourceUrl: string;
  localPath: string;
  filename: string;
  downloaded: boolean;
}

export interface OhdbWeapon {
  slug: string;
  name: string;
  family: string;
  variantName: string | null;
  type: string;
  rarity: OhdbRarity;
  tier: number;
  damage: number | null;
  rpm: number | null;
  imageUrl: string | null;
  localImagePath: string | null;
}

export interface OhdbArmor {
  slug: string;
  name: string;
  armorType: string;
  rarity: OhdbRarity;
  style: string | null;
  hp: string | null;
  hpValue: number | null;
  imageUrl: string | null;
  localImagePath: string | null;
}

export interface OhdbModVariant {
  slug: string;
  name: string;
  variant: string;
  coreModKey: string;
  suffixKey: string;
  equippedIdentity: string;
  modType: string;
  category: string;
  rarity: OhdbRarity;
  coreEffect: string;
  imageUrl: string | null;
  localImagePath: string | null;
}

export interface OhdbAttachment {
  slug: string;
  name: string;
  slotName: 'Sight' | 'Muzzle' | 'Tactical' | 'Magazine';
  rarity: OhdbRarity;
  effectSummary: string | null;
  imageUrl: string | null;
  localImagePath: string | null;
}
