import type { ConfidenceLevel } from "../itemTypes";
import { weaponRegistry } from "./weaponRegistry";
import { armorRegistry, keyGearRegistry } from "./armorRegistry";
import { modRegistry } from "./modRegistry";
import { foodBuffRegistry } from "./foodBuffRegistry";
import { deviationRegistry } from "./deviationRegistry";
import { cradleRegistry } from "./cradleRegistry";
import { pveTargetRegistry } from "./pveTargetRegistry";

export interface RegistryMeta {
 registryName: string;
 knownItemCount: number;
 verifiedCount: number;
 observedCount: number;
 estimatedCount: number;
 experimentalCount: number;
 placeholderCount: number;
 needsReviewCount: number;
 notes: string;
}

function computeMeta(
 registryName: string,
 items: { confidence: ConfidenceLevel; needsReview: boolean }[],
 notes: string
): RegistryMeta {
 const byConfidence = (level: ConfidenceLevel) =>
  items.filter((i) => i.confidence === level).length;
 return {
  registryName,
  knownItemCount: items.length,
  verifiedCount: byConfidence("verified"),
  observedCount: byConfidence("observed"),
  estimatedCount: byConfidence("estimated"),
  experimentalCount: byConfidence("experimental"),
  placeholderCount: byConfidence("placeholder"),
  needsReviewCount: items.filter((i) => i.needsReview).length,
  notes,
 };
}

export const weaponMeta: RegistryMeta = computeMeta(
 "Weapon Registry",
 weaponRegistry,
  `17 weapons: 7 observed (ACS-12 x2, EBR, AWS.338, Burden of Betrayal, P90, R500), 4 estimated (inline), 6 estimated (bulk import). Power Surge, Burn, Frost, Bounce, Kinetic, Shock profiles.`
);

export const armorMeta: RegistryMeta = computeMeta(
 "Armor Registry",
 armorRegistry,
 "30 pieces across 5 sets (Lone Wolf, Shelterer, Blackstone, Renegade, Bastille). All estimated/needsReview. 22 armor sets documented in armorSetMetaMap (A_project_verified)."
);

export const keyGearMeta: RegistryMeta = computeMeta(
 "Key Gear Registry",
 keyGearRegistry,
  "40 items: 38 generated from verified community sheet (all estimated/needsReview), 2 manually curated (Blue Flame Boots estimated, Frost Whisper Boots experimental). Covers Burn, Frost Vortex, Power Surge, Unstable Bomber, Bullseye, Fortress Warfare, Fast Gunner, Bounce, Shrapnel keywords, plus 2 non-keyword items (Snowbreak Top, Glide Pants)."
);

export const modMeta: RegistryMeta = computeMeta(
 "Mod Registry",
 modRegistry,
 `137 mods: 4 observed (existing cores + suffix: Scorched, Charged, Burn Set 2pc, Blaze), 5 estimated (existing vendor suffixes), 99 estimated (bulk mod cores), 29 observed (bulk mod suffixes, A_project_verified).`
);

export const foodBuffMeta: RegistryMeta = computeMeta(
 "Food/Buff Registry",
 foodBuffRegistry,
  `91 items: 1 verified (empty-state), 84 observed (3 curated + 81 bulk import from verified food data), 6 experimental (placeholder offensive foods).`
);

export const deviationMeta: RegistryMeta = computeMeta(
 "Deviation Registry",
 deviationRegistry,
 `77 deviations: 1 verified (empty-state), 6 observed (existing curated), 1 estimated (existing: Festering Gel), 69 observed (bulk import — owner-approved names from verified deviation data).`
);

export const cradleMeta: RegistryMeta = computeMeta(
 "Cradle Perk Registry",
 cradleRegistry,
 "25 overrides: all observed (extracted from user-provided in-game hover footage). No placeholder entries remain. Covers weapon mastery, status/elemental, offense, defense-support, melee, and special groups."
);

export const pveTargetMeta: RegistryMeta = computeMeta(
 "PvE Target Registry",
 pveTargetRegistry,
 "12 targets: 10 verified (real Once Human enemies + dummy), 2 estimated (Lava Walker, Frost Titan — names from external ref, marked unverified)."
);

export const allRegistryMeta: RegistryMeta[] = [
 weaponMeta,
 armorMeta,
 keyGearMeta,
 modMeta,
 foodBuffMeta,
 deviationMeta,
 cradleMeta,
 pveTargetMeta,
];
