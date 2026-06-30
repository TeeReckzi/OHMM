import type { ModifierSource } from "./modifierTypes";

const registry = new Map<string, ModifierSource>();

export function registerModifierSource(source: ModifierSource): void {
  registry.set(source.id, source);
}

export function getModifierSource(id: string): ModifierSource | undefined {
  return registry.get(id);
}

export function listModifierSources(): ModifierSource[] {
  return Array.from(registry.values());
}

export function getModifierSourcesByType(
  sourceType: string
): ModifierSource[] {
  return listModifierSources().filter((s) => s.sourceType === sourceType);
}

// ---------------------------------------------------------------------------
// Sample modifier sources — representative examples for testing
// ---------------------------------------------------------------------------

registerModifierSource({
  id: "weapon_base_assault_rifle",
  sourceType: "weapon",
  sourceLabel: "Assault Rifle (base)",
  stat: "weaponDMG",
  value: 100,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "Base weapon damage for a typical AR",
});

registerModifierSource({
  id: "weapon_psi_base",
  sourceType: "weapon",
  sourceLabel: "Status Weapon (base Psi)",
  stat: "psiIntensity",
  value: 100,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "Base psi intensity for status weapon scaling",
});

registerModifierSource({
  id: "mod_scorched",
  sourceType: "mod",
  sourceLabel: "Scorched Mod",
  stat: "burnDMGBonus",
  value: 0.15,
  behavior: "additive",
  mechanicId: "burn",
  confidence: "reported_current_patch_needs_testing",
  notes: "+15% Burn DMG from Scorched weapon mod",
});

registerModifierSource({
  id: "mod_charged",
  sourceType: "mod",
  sourceLabel: "Charged Mod",
  stat: "powerSurgeDMGBonus",
  value: 0.18,
  behavior: "additive",
  mechanicId: "powerSurge",
  confidence: "reported_current_patch_needs_testing",
  notes: "+18% Power Surge DMG from Charged mod",
});

registerModifierSource({
  id: "mod_crit_rate",
  sourceType: "mod",
  sourceLabel: "Crit Rate Mod",
  stat: "critRate",
  value: 0.08,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "+8% crit rate from weapon mod",
});

registerModifierSource({
  id: "mod_crit_damage",
  sourceType: "mod",
  sourceLabel: "Crit Damage Mod",
  stat: "critDMG",
  value: 0.15,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "+15% crit damage from weapon mod",
});

registerModifierSource({
  id: "food_elemental",
  sourceType: "food",
  sourceLabel: "Elemental Food Buff",
  stat: "elementalDMGBonus",
  value: 0.12,
  behavior: "additive",
  confidence: "reported_current_patch_needs_testing",
  notes: "+12% Elemental DMG from food buff",
});

registerModifierSource({
  id: "food_weakspot",
  sourceType: "food",
  sourceLabel: "Weakspot Food Buff",
  stat: "weakspotDMG",
  value: 0.20,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "+20% Weakspot DMG from food",
});

registerModifierSource({
  id: "set_burn_2pc",
  sourceType: "setBonus",
  sourceLabel: "Burn Set 2pc Bonus",
  stat: "burnDMGBonus",
  value: 0.20,
  behavior: "additive",
  mechanicId: "burn",
  tags: ["set:burn_inferno"],
  confidence: "reported_current_patch_needs_testing",
  notes: "+20% Burn DMG from 2-piece set bonus",
});

registerModifierSource({
  id: "set_elemental_3pc",
  sourceType: "setBonus",
  sourceLabel: "Elemental Set 3pc Bonus",
  stat: "elementalDMGBonus",
  value: 0.15,
  behavior: "additive",
  tags: ["set:elemental_mastery"],
  confidence: "reported_current_patch_needs_testing",
  notes: "+15% Elemental DMG from 3-piece set bonus",
});

registerModifierSource({
  id: "calibration_attack_percent",
  sourceType: "calibration",
  sourceLabel: "Calibration: Attack%",
  stat: "attackPercent",
  value: 0.10,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "+10% Attack from weapon calibration",
});

registerModifierSource({
  id: "calibration_elemental",
  sourceType: "calibration",
  sourceLabel: "Calibration: Elemental DMG",
  stat: "elementalDMGBonus",
  value: 0.10,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "+10% Elemental DMG from calibration",
});

registerModifierSource({
  id: "mod_suffix_burn",
  sourceType: "modSuffix",
  sourceLabel: "Mod Suffix: Blaze",
  stat: "burnDMGBonus",
  value: 0.08,
  behavior: "additive",
  mechanicId: "burn",
  confidence: "observed_in_game_needs_testing",
  notes: "+8% Burn DMG from mod suffix",
});

registerModifierSource({
  id: "keyword_burn_amplifier",
  sourceType: "keywordEffect",
  sourceLabel: "Burn Amplifier (Keyword)",
  stat: "burnDMGBonus",
  value: 0.25,
  behavior: "multiplicative",
  mechanicId: "burn",
  conditional: {
    description: "Active when target has 5 Burn stacks",
    isActive: true,
  },
  confidence: "inferred",
  notes: "Multiplicative 1.25x Burn DMG when target at max stacks",
});

registerModifierSource({
  id: "enemy_type_boss_bonus",
  sourceType: "enemyTypeBonus",
  sourceLabel: "Boss Enemy Type Bonus",
  stat: "enemyTypeDMGBonus",
  value: 0.10,
  behavior: "additive",
  enemyType: "boss",
  confidence: "inferred",
  notes: "+10% damage vs boss-type enemies",
});

registerModifierSource({
  id: "temporary_buff_rage",
  sourceType: "temporaryBuff",
  sourceLabel: "Rage Buff (Temporary)",
  stat: "weaponDMG",
  value: 0.25,
  behavior: "multiplicative",
  conditional: {
    description: "Active during Rage mode (10s after kill)",
    isActive: false,
  },
  confidence: "reported_current_patch_needs_testing",
  notes: "1.25x weapon DMG during Rage — currently inactive",
});

registerModifierSource({
  id: "armor_status_dmg",
  sourceType: "armor",
  sourceLabel: "Armor Piece: Status DMG",
  stat: "statusDMGBonus",
  value: 0.10,
  behavior: "additive",
  confidence: "observed_in_game_needs_testing",
  notes: "+10% Status DMG from armor piece",
});

// ---------------------------------------------------------------------------
// BBQ Gloves — Burn frequency modifier
// ---------------------------------------------------------------------------
registerModifierSource({
  id: "bbq_gloves_frequency",
  sourceType: "gloves",
  sourceLabel: "BBQ Gloves",
  stat: "burnTickFrequencyBonus",
  value: 1.0,
  behavior: "additive",
  mechanicId: "burn",
  conditional: {
    description: "+100% Burn tick frequency at 5 stacks. Scales with stack count.",
    isActive: true,
  },
  confidence: "inferred",
  notes: "BBQ Gloves increase Burn tick frequency by 20% per stack up to +100% at max stacks.",
});

// ---------------------------------------------------------------------------
// Flat Burn Bonus (e.g. from calibration or set bonus)
// ---------------------------------------------------------------------------
registerModifierSource({
  id: "flat_burn_calibration",
  sourceType: "calibration",
  sourceLabel: "Calibration: Flat Burn DMG",
  stat: "flatBurnBonus",
  value: 1.0,
  behavior: "additive",
  mechanicId: "burn",
  confidence: "inferred",
  notes: "+1 flat Burn damage per stack from calibration",
});

// ---------------------------------------------------------------------------
// Human Damage Bonus
// ---------------------------------------------------------------------------
registerModifierSource({
  id: "human_damage_keyword",
  sourceType: "keywordEffect",
  sourceLabel: "Human DMG Bonus (Keyword)",
  stat: "humanDamageBonus",
  value: 0.10,
  behavior: "additive",
  confidence: "inferred",
  notes: "+10% damage vs human-type enemies",
});
