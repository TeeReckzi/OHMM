export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type Side = "offensive" | "defensive";

export type ModalKind =
  | "weapon" | "armor" | "weapon_mod" | "armor_mod"
  | "attachment" | "ammo" | "buff" | "deviation" | "cradle" | "calibration"
  | null;

export interface EquippedItem {
  id: string;
  name: string;
  category: string;
  rarity: Rarity;
  tier: number;
  stars: number;
  meta?: Record<string, string | number | string[] | undefined>;
  iconUrl?: string; // From Supabase app_images or GitHub ohmm-icondb CDN

  // Rich data for selector modals
  effectSummary?: string;
  statModifiers?: Array<{ stat: string; value: number; unit?: string }>;
  tags?: string[];
  modType?: 'core' | 'suffix';
  description?: string;
}

export type LoadoutMap = Record<string, EquippedItem | null>;

export interface ModalState {
  open: boolean;
  kind: ModalKind;
  slot: string;
  side: Side;
  label: string;
}

export const R_COLOR: Record<Rarity, string> = {
  Common:    "#8898a8",
  Uncommon:  "#4ade80",
  Rare:      "#38bdf8",
  Epic:      "#c084fc",
  Legendary: "#fb923c",
};

export const WEAPON_CATS = ["All", "AR", "SMG", "LMG", "Shotgun", "Sniper", "Pistol", "Crossbow"] as const;
export const WEAPON_CATEGORY_LABELS = new Set<string>(WEAPON_CATS.filter((cat) => cat !== "All").map((cat) => cat.toLowerCase()));

export function isWeaponItem(item: EquippedItem | null | undefined): boolean {
  if (!item) return false;
  const family = typeof item.meta?.family === "string" ? item.meta.family.toLowerCase() : "";
  const category = item.category?.toLowerCase() || "";
  return WEAPON_CATEGORY_LABELS.has(category) || WEAPON_CATEGORY_LABELS.has(family);
}

export const CYAN   = "#00c8ff";
export const VIOLET = "#7c5cff";
export const ORANGE = "#ff6b35";
export const GREEN  = "#4ade80";
export const OHMM_NAVBAR_LOGO = "/assets/ohmm-design/logos/ohmm-navbar.jpg";
