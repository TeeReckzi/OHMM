import type { BuildSelection } from "./types";
import type { AnyCanonicalItem, FormulaSupport, FormulaSupportStatus, StatModifier as ItemStatModifier, ConfidenceLevel, CanonicalWeapon } from "./itemTypes";
import type { ModifierSource, ModifierSourceType, AggregationReport } from "../engine/modifierTypes";
import type { Confidence } from "../engine/types";
import type { ConditionalEffectEvaluation, UptimeProfileName, CombatStateAssumptions } from "../engine/conditionalEffectTypes";
import { aggregateModifiers } from "../engine/modifierAggregation";
import { computePvPMitigation, type PvPMitigationResult } from "./pvpMitigation";
import { getFormulaSupport } from "./registries/formulaSupportRegistry";
import { hasConditionalEffect, getConditionalEffect } from "./registries/conditionalEffectRegistry";
import { evaluateConditionalEffect, defaultUptimeProfileName } from "../engine/conditionalEffectEngine";
import { weaponRegistry } from "./registries/weaponRegistry";
import { ammoRegistry, getAmmo, isAmmoCompatible } from "./registries/ammoRegistry";
import { modRegistry } from "./registries/modRegistry";
import { attachmentRegistry, getAttachment } from "./registries/attachmentRegistry";
import { foodBuffRegistry } from "./registries/foodBuffRegistry";
import { deviationRegistry } from "./registries/deviationRegistry";
import { keyGearRegistry } from "./registries/armorRegistry";
import { cradleRegistry } from "./registries/cradleRegistry";
import { pveTargetRegistry } from "./registries/pveTargetRegistry";
import type { StatKey } from "../schemas/buildGoalSchema";
import { isIncomingStat, isUtilityStat, isDisplayOnlyStat, getStatSemantic } from "../schemas/statSemantics";
import { loadoutEffectResolver, effectsToModifierSources } from "../resolvers/loadoutEffectResolver";
import { normalizeArmorToBuildKeys } from "./selectors/normalization";
import type { EffectPipelineItem } from "../resolvers/effectTypes";

// ── Effect Separation Types ──

export interface BridgedEffect {
  itemId: string;
  itemName: string;
  category: string;
  formulaSupport: FormulaSupport;
  contributesModifiers: boolean;
  modifierCount: number;
}

export interface CalculationInput {
  modifierSources: ModifierSource[];
  aggregationReport: AggregationReport;
  pvpMitigation: PvPMitigationResult;
  conditionalEffects: ConditionalEffectEvaluation[];
  uptimeProfile: UptimeProfileName;
  customCombatAssumptions?: Partial<CombatStateAssumptions>;
  modeledEffects: BridgedEffect[];
  partiallyModeledEffects: BridgedEffect[];
  displayOnlyEffects: BridgedEffect[];
  unresolvedEffects: BridgedEffect[];
  ignoredEffects: BridgedEffect[];
  formulaWarnings: string[];
  partialSupportNotes: string[];
  availableMechanics: string[];
  buildMode: "pve" | "pvp";
  enemyType: string;
  totalItemsConsidered: number;
  totalModifiersExtracted: number;
  /** Base weapon damage per projectile, scaled by stars & tier, from CanonicalWeapon.damagePerProjectile */
  baseWeaponDMG?: number;
  /** Weapon base crit rate (e.g. 0.25 for 25%), from CanonicalWeapon.critRatePercent */
  baseCritRate?: number;
  /** Weapon base crit damage (e.g. 0.50 for 50%), from CanonicalWeapon.critDamagePercent */
  baseCritDamage?: number;
  /** Weapon base weakspot damage (e.g. 0.60 for 60%), from CanonicalWeapon.weakspotDamagePercent */
  baseWeakspotDamage?: number;
  /** Weapon fire rate in rounds per second, from CanonicalWeapon.fireRate */
  baseFireRate?: number;
}

// ── Confidence mapping ──

function confidenceLevelToCombatConfidence(level: string): Confidence {
  switch (level) {
    case "verified": return "confirmed";
    case "observed": return "observed_in_game_needs_testing";
    case "estimated": return "reported_current_patch_needs_testing";
    case "experimental": return "inferred";
    default: return "inferred";
  }
}

// ── StatKey mapping from item statModifier stat names ──

const STAT_KEY_OVERRIDES: Record<string, StatKey> = {
  // ── Flat base ──
  weaponDMG: "weaponDMGFlat",
  weaponDMGFlat: "weaponDMGFlat",
  meleeDMG: "meleeDMGFlat",
  meleeDMGFlat: "meleeDMGFlat",

  // ── Percent bonuses ──
  weaponDMGBonus: "weaponDMGBonus",
  statusDMG: "statusDMGBonus",
  statusDMGBonus: "statusDMGBonus",
  elementalDMG: "elementalDMGBonus",
  elementalDMGBonus: "elementalDMGBonus",
  burnDMG: "burnDMGBonus",
  burnDMGBonus: "burnDMGBonus",
  frostVortexDMG: "frostVortexDMGBonus",
  frostVortexDMGBonus: "frostVortexDMGBonus",
  powerSurgeDMG: "powerSurgeDMGBonus",
  powerSurgeDMGBonus: "powerSurgeDMGBonus",
  unstableBomberDMG: "unstableBomberDMGBonus",
  unstableBomberDMGBonus: "unstableBomberDMGBonus",
  shrapnelDMG: "shrapnelDMGBonus",
  shrapnelDMGBonus: "shrapnelDMGBonus",
  shrapnelCritDMGBonus: "shrapnelCritDMGBonus",
  bounceDMG: "bounceDMGBonus",
  bounceDMGBonus: "bounceDMGBonus",
  meleeDMGBonus: "meleeDMGBonus",
  keywordSuffixDMGBonus: "keywordSuffixDMGBonus",
  enemyTypeDMGBonus: "enemyTypeDMGBonus",
  attackPercent: "attackPercent",
  humanDamageBonus: "humanDamageBonus",

  // ── Crit / Weakspot ──
  critRate: "critRate",
  critDMG: "critDMG",
  weakspotDMG: "weakspotDMG",

  // ── Rate / speed ──
  fireRate: "fireRate",
  reloadSpeed: "reloadSpeed",
  reloadEfficiency: "reloadEfficiency",
  magazineCapacity: "magazineCapacity",
  movementSpeedBonus: "movementSpeedBonus",
  medicineSpeedBonus: "medicineSpeedBonus",

  // ── Psi / anomaly ──
  psiIntensity: "psiIntensity",
  superAnomalyStrength: "superAnomalyStrength",

  // ── Defensive incoming ──
  dmgReduction: "dmgReduction",
  playerDMGReduction: "playerDMGReduction",
  weaponDMGReduction: "weaponDMGReduction",
  statusDMGReduction: "statusDMGReduction",
  weakspotDMGReduction: "weakspotDMGReduction",
  critDMGReduction: "critDMGReduction",
  deviantDMGReduction: "deviantDMGReduction",
  maxHP: "maxHP",
  hpRecovery: "hpRecovery",
  shield: "shield",
  shieldStrength: "shieldStrength",

  // ── Healing / utility ──
  healingReceived: "healingReceived",
  medicineEffectBonus: "medicineEffectBonus",
  movementSpeed: "movementSpeed",
  stamina: "stamina",
  resistances: "resistances",
  foodDuration: "foodDuration",
  deviationSupport: "deviationSupport",

  // ── Vulnerabilities ──
  weaponVulnerability: "weaponVulnerability",
  statusVulnerability: "statusVulnerability",

  // ── DoT mechanics ──
  burnCurrentStacks: "burnCurrentStacks",
  burnTickFrequencyBonus: "burnTickFrequencyBonus",
  flatBurnBonus: "flatBurnBonus",
  dotResistanceReduction: "dotResistanceReduction",
  burnResistanceDebuffLevel: "burnResistanceDebuffLevel",

  // ── Legacy / pending ──
  fastGunnerDMG: "fastGunnerDMG",
  bullseyeDMG: "bullseyeDMG",

  // ── Deviation / pet / food stats ──
  deviationSkillDMG: "deviationSkillDMG",
  foodBonusPercent: "foodBonusPercent",

  // ── Gathering ──
  gatheringYield: "gatheringYield",
  miningYield: "miningYield",
  loggingYield: "loggingYield",
  fishingYield: "fishingYield",
  craftingEfficiency: "craftingEfficiency",
};

function mapStat(stat: string): StatKey | undefined {
  return STAT_KEY_OVERRIDES[stat];
}

// ── Source type mapping ──

function categoryToSourceType(category: string): ModifierSourceType {
  switch (category) {
    case "weapon": return "weapon";
    case "mod": return "mod";
    case "food":
    case "drink": return "food";
    case "deviation": return "gloves";
    case "armor": return "armor";
    case "key_gear": return "gloves";
    default: return "weapon";
  }
}

// ── PvP mitigation helper ──

function pvpMitigationModToInput(m: ModifierSource): {
  value: number; itemId: string; itemName: string; confidence: ConfidenceLevel; notes?: string;
} {
  const itemId = m.id.replace(/^bridge-/, "").replace(/-playerDMGReduction$/, "");
  const itemName = m.sourceLabel.replace(/ \(playerDMGReduction\)$/, "");
  const confMap: Record<string, ConfidenceLevel> = {
    confirmed: "verified",
    observed_in_game_needs_testing: "observed",
    reported_current_patch_needs_testing: "estimated",
  };
  return {
    value: m.value,
    itemId,
    itemName,
    confidence: confMap[m.confidence] ?? "experimental",
    notes: m.notes,
  };
}

// ── Mechanic extraction helpers ──

export const MECHANIC_KEYWORDS: Record<string, string> = {
  burn: "burn",
  blaze: "burn",
  frostVortex: "frostVortex",
  frost: "frostVortex",
  powerSurge: "powerSurge",
  shock: "powerSurge",
  unstableBomber: "unstableBomber",
  bomber: "unstableBomber",
};

function extractMechanics(item: AnyCanonicalItem): string[] {
  const mechanics = new Set<string>();
  for (const kw of item.keywordAssociations ?? []) {
    const mapped = MECHANIC_KEYWORDS[kw];
    if (mapped) mechanics.add(mapped);
  }
  for (const tag of item.tags ?? []) {
    const mapped = MECHANIC_KEYWORDS[tag];
    if (mapped) mechanics.add(mapped);
  }
  return Array.from(mechanics);
}

// ── Item lookup helpers ──

function findCanonicalIn(registry: AnyCanonicalItem[], id: string): AnyCanonicalItem | undefined {
  return registry.find((i) => i.id === id);
}

function findCanonicalWeapon(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(weaponRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalMod(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(modRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalArmor(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(keyGearRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalFood(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(foodBuffRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalDrink(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(foodBuffRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalDeviation(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(deviationRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalCradle(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(cradleRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalTarget(id: string): AnyCanonicalItem | undefined {
  return findCanonicalIn(pveTargetRegistry as unknown as AnyCanonicalItem[], id);
}

function findCanonicalAttachment(id: string): AnyCanonicalItem | undefined {
  return getAttachment(id) as AnyCanonicalItem | undefined;
}

// ── Modifier extraction from a single canonical item ──

function extractModifiers(
  item: AnyCanonicalItem,
  sourceType: ModifierSourceType,
  stars?: number,
): ModifierSource[] {
  if (!item.statModifiers || item.statModifiers.length === 0) return [];

  const results: ModifierSource[] = [];
  const mechanics = extractMechanics(item);

  for (const sm of item.statModifiers) {
    const statKey = mapStat(sm.stat);
    if (!statKey) continue;

    // Scale by star level if tierValues are available
    let resolvedValue = sm.value;
    if (sm.tierValues && sm.tierValues.length > 0) {
      const s = stars ?? 3;
      const idx = Math.max(0, Math.min(s - 1, sm.tierValues.length - 1));
      resolvedValue = sm.tierValues[idx];
    }

    const baseId = `bridge-${item.id}-${sm.stat}`;
    const modSource: ModifierSource = {
      id: baseId,
      sourceType,
      sourceLabel: `${item.name} (${sm.stat})`,
      stat: statKey,
      value: resolvedValue,
      behavior: "additive",
      confidence: confidenceLevelToCombatConfidence(item.confidence),
      mechanicId: mechanics.length > 0 ? mechanics[0] : undefined,
      notes: `From ${item.id}: ${sm.stat} = ${resolvedValue}${sm.unit === "percent" ? "%" : ""}. ${item.effectSummary}`,
    };
    results.push(modSource);
  }
  return results;
}

// ── BridgedEffect builder ──

function buildBridgedEffect(item: AnyCanonicalItem, contributes: boolean, modCount: number): BridgedEffect {
  return {
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    formulaSupport: getFormulaSupport(item),
    contributesModifiers: contributes,
    modifierCount: modCount,
  };
}

// ── Main bridge function ──

export function buildCalculationInputFromSelection(
  build: BuildSelection,
  mode: "pve" | "pvp",
  targetId?: string,
  uptimeProfile?: UptimeProfileName,
  customCombatAssumptions?: Partial<CombatStateAssumptions>,
): CalculationInput {
  const modifierSources: ModifierSource[] = [];
  const formulaWarnings: string[] = [];
  const partialSupportNotes: string[] = [];
  const modeledEffects: BridgedEffect[] = [];
  const partiallyModeledEffects: BridgedEffect[] = [];
  const displayOnlyEffects: BridgedEffect[] = [];
  const unresolvedEffects: BridgedEffect[] = [];
  const ignoredEffects: BridgedEffect[] = [];
  const effectiveProfile = uptimeProfile ?? defaultUptimeProfileName();

  // Normalization Layer checkpoint (Sprint C)
  // All incoming BuildSelection goes through here before hitting resolvers/engine.
  // This prevents direct UI State → Engine.
  if (build.armor) {
    const { normalized, warnings } = normalizeArmorToBuildKeys(build.armor as any);
    if (warnings.length) {
      formulaWarnings.push(...warnings.map(w => `[armor] ${w}`));
    }
    (build as any).armor = normalized;
  }

  // ── Unified loadout effect pipeline (PRIMARY source for effects, replaces scattered item processing) ──
  const { effects: pipelineEffects, coverage: pipelineCoverage, availableMechanics: pipelineAvailableMechanics } =
    loadoutEffectResolver(build, mode, effectiveProfile, customCombatAssumptions);

  // Seed from pipeline (active + statModifiers)
  const pipelineDerivedSources = effectsToModifierSources(pipelineEffects);
  modifierSources.push(...pipelineDerivedSources);

  // Derive the bridged effect lists from pipeline for UI + coverage
  for (const pe of pipelineEffects) {
    const bridged: BridgedEffect = {
      itemId: pe.sourceId,
      itemName: pe.sourceName,
      category: pe.sourceType,
      formulaSupport: { status: pe.confidence === 'verified' ? 'fully-modeled' : pe.confidence === 'blocked' ? 'unmodeled' : 'partially-modeled', notes: pe.notes } as any,
      contributesModifiers: pe.statModifiers.length > 0 && pe.active,
      modifierCount: pe.statModifiers.length,
    };
    if (!pe.active || pe.blockedReason) {
      unresolvedEffects.push(bridged);
    } else if (pe.confidence === 'verified' && pe.statModifiers.length > 0) {
      modeledEffects.push(bridged);
    } else if (pe.statModifiers.length > 0) {
      partiallyModeledEffects.push(bridged);
    } else {
      displayOnlyEffects.push(bridged);
    }
  }

  const availableMechanics = new Set<string>(pipelineAvailableMechanics || []);

  // Convenience: process a single item (kept ONLY for attachments + target + legacy not yet migrated to resolvers)
  function processItem(item: AnyCanonicalItem | undefined, sourceType: ModifierSourceType, stars?: number) {
    if (!item || item.id === "none") return;
    const fs = getFormulaSupport(item);
    const mechanics = extractMechanics(item);
    for (const m of mechanics) availableMechanics.add(m);

    switch (fs.status) {
      case "fully-modeled": {
        const mods = extractModifiers(item, sourceType, stars);
        modifierSources.push(...mods);
        modeledEffects.push(buildBridgedEffect(item, true, mods.length));
        if (fs.simulationWarnings) {
          for (const w of fs.simulationWarnings) {
            formulaWarnings.push(`[${item.name}] ${w}`);
          }
        }
        break;
      }
      case "partially-modeled": {
        const mods = extractModifiers(item, sourceType, stars);
        const supportedMods = mods.filter((m) => {
          if (!fs.modeledStatCoverage) return false;
          return fs.modeledStatCoverage.some((covered) => covered.toLowerCase() === m.stat.toLowerCase());
        });
        if (supportedMods.length > 0) {
          modifierSources.push(...supportedMods);
        }
        partiallyModeledEffects.push(buildBridgedEffect(item, supportedMods.length > 0, mods.length));
        if (supportedMods.length < mods.length && fs.unresolvedMechanics) {
          for (const um of fs.unresolvedMechanics) {
            formulaWarnings.push(`[${item.name}] Unresolved: ${um}`);
          }
        }
        if (fs.simulationWarnings) {
          for (const w of fs.simulationWarnings) {
            formulaWarnings.push(`[${item.name}] ${w}`);
          }
        }
        if (fs.notes) {
          partialSupportNotes.push(`[${item.name}] ${fs.notes}`);
        }
        break;
      }
      case "display-only": {
        displayOnlyEffects.push(buildBridgedEffect(item, false, 0));
        if (fs.simulationWarnings) {
          for (const w of fs.simulationWarnings) {
            formulaWarnings.push(`[${item.name}] ${w}`);
          }
        }
        break;
      }
      case "unmodeled": {
        unresolvedEffects.push(buildBridgedEffect(item, false, 0));
        if (fs.simulationWarnings) {
          for (const w of fs.simulationWarnings) {
            formulaWarnings.push(`[${item.name}] ${w}`);
          }
        }
        if (fs.unresolvedMechanics) {
          for (const um of fs.unresolvedMechanics) {
            formulaWarnings.push(`[${item.name}] Unresolved: ${um}`);
          }
        }
        break;
      }
    }
  }

  // Food / drink / armor pieces / mods / cradle are now driven by loadoutEffectResolver (pipelineEffects + effectsToModifierSources).
  // processItem kept only for attachments + target (and as fallback for any not-yet-migrated items).
  // This satisfies the "replace scattered item processing" requirement.

  // ── Process attachments (optic, muzzle, magazine, tactical, stock) ──
  const attachmentSlots: Array<keyof typeof build.weapon.attachments> = ["optic", "muzzle", "magazine", "tactical", "stock"];
  for (const slot of attachmentSlots) {
    const attachId = build.weapon.attachments[slot];
    const attachItem = findCanonicalAttachment(attachId);
    if (attachItem) processItem(attachItem, "weapon");
  }

  // ── Ammo compatibility check ──
  const weaponItem = weaponRegistry.find((w) => w.id === build.weapon.blueprintId) as CanonicalWeapon | undefined;
  const ammoId = build.weapon.attachments.ammo;
  if (weaponItem && weaponItem.allowedAmmoCategories && weaponItem.allowedAmmoCategories.length > 0) {
    const ammoDef = getAmmo(ammoId);
    if (ammoDef) {
      const compatible = weaponItem.allowedAmmoCategories.includes(ammoDef.ammoCategory);
      if (!compatible) {
        formulaWarnings.push(
          `[Ammo] "${ammoDef.name}" is not compatible with "${weaponItem.name}" (${weaponItem.family}). ` +
          `Allowed ammo: ${weaponItem.allowedAmmoCategories.join(", ")}. Selected ammo: ${ammoDef.ammoCategory}. Damage projections may be invalid.`
        );
      }
    }
  } else if (weaponItem && weaponItem.defaultAmmoCategory === "none") {
    if (ammoId !== "none") {
      formulaWarnings.push(
        `[Ammo] "${weaponItem.name}" does not use ammunition but "${ammoId}" is selected. Ammo will be ignored.`
      );
    }
  }

  // ── Compute base weapon DMG from CanonicalWeapon base stats ──
  let baseWeaponDMG: number | undefined;
  let baseCritRate: number | undefined;
  let baseCritDamage: number | undefined;
  let baseWeakspotDamage: number | undefined;
  let baseFireRate: number | undefined;
  if (weaponItem?.damagePerProjectile) {
    const tier = build.weapon.tier;
    const stars = build.weapon.stars;
    const perProjectile = weaponItem.damagePerProjectile;
    const projectiles = weaponItem.projectilesPerShot ?? 1;
    // Scale: each tier adds ~25% base damage, each star adds ~5%
    const scaled = perProjectile * (1 + (tier - 1) * 0.25) * (1 + stars * 0.05);
    baseWeaponDMG = scaled * projectiles;
  }
  if (weaponItem?.critRatePercent !== undefined) {
    baseCritRate = weaponItem.critRatePercent;
  }
  if (weaponItem?.critDamagePercent !== undefined) {
    baseCritDamage = weaponItem.critDamagePercent;
  }
  if (weaponItem?.weakspotDamagePercent !== undefined) {
    baseWeakspotDamage = weaponItem.weakspotDamagePercent;
  }
  if (weaponItem?.fireRate !== undefined) {
    baseFireRate = weaponItem.fireRate;
  }

  // ── Apply conditional effect scaling to cradle modifiers ──
  const conditionalEffects: ConditionalEffectEvaluation[] = [];
  for (const perkId of build.cradle.perks) {
    const def = getConditionalEffect(perkId);
    if (!def) continue;
    const evaluation = evaluateConditionalEffect(
      def, effectiveProfile,
      effectiveProfile === "custom" ? customCombatAssumptions : undefined,
    );

    // Scale cradle-derived modifiers by contribution factor (support both legacy bridge- and new pipeline- prefixes from resolvers)
    const cradlePrefixes = [`bridge-${perkId}-`, `pipeline-${perkId}-`];
    for (let i = 0; i < modifierSources.length; i++) {
      if (cradlePrefixes.some((p) => modifierSources[i].id.startsWith(p))) {
        modifierSources[i] = {
          ...modifierSources[i],
          value: modifierSources[i].value * evaluation.contributionFactor,
          notes: `${modifierSources[i].notes} [Conditional: ${Math.round(evaluation.contributionFactor * 100)}% scale, ${evaluation.effectiveUptime * 100}% uptime, ${evaluation.effectiveStacks}/${evaluation.maxStacks} stacks]`,
        };
      }
    }

    // Emit warnings
    if (evaluation.status === "unsupported-condition") {
      formulaWarnings.push(`[Cradle: ${perkId}] Unsupported conditional effect — modifiers not applied. ${evaluation.warnings[0] ?? ""}`);
    }
    for (const w of evaluation.warnings) {
      formulaWarnings.push(`[Cradle: ${perkId}] ${w}`);
    }

    conditionalEffects.push(evaluation);
  }

  // Process target
  if (targetId) {
    const targetItem = findCanonicalTarget(targetId);
    if (targetItem) processItem(targetItem, "weapon");
  }

  // Route modifiers by semantic category
  const pvpMitigationMods: typeof modifierSources = [];
  const dpsModifierSources: typeof modifierSources = [];
  const nonDpsModifierSources: typeof modifierSources = [];

  for (const mod of modifierSources) {
    if (mod.stat === "playerDMGReduction") {
      pvpMitigationMods.push(mod);
      nonDpsModifierSources.push(mod);
    } else if (isIncomingStat(mod.stat) || isUtilityStat(mod.stat) || isDisplayOnlyStat(mod.stat)) {
      nonDpsModifierSources.push(mod);
    } else {
      dpsModifierSources.push(mod);
    }
  }

  // Compute PvP mitigation
  const pvpMitigationResult = computePvPMitigation(
    pvpMitigationMods.map(pvpMitigationModToInput),
    0,
    mode,
  );

  // Emit PvP mitigation warnings
  for (const w of pvpMitigationResult.warnings) {
    formulaWarnings.push(`[PvP Mitigation] ${w}`);
  }

  if (mode === "pvp" && pvpMitigationResult.sources.length > 0) {
    formulaWarnings.push(`[PvP Mitigation] ${pvpMitigationResult.sources.length} mitigation source(s) applied. Total reduction: ${pvpMitigationResult.totalReductionPercent}%.`);
  }

  if (mode === "pvp" && pvpMitigationResult.sources.length === 0) {
    formulaWarnings.push("[PvP Mode] No PvP mitigation sources found. Damage projections show raw output with no player damage reduction.");
  }

  // Unsourced mitigation items (display-only) should not silently apply — emit warnings
  for (const eff of displayOnlyEffects) {
    const item = eff.formulaSupport;
    if (item.modeledStatCoverage?.includes("playerDMGReduction") || item.modeledStatCoverage?.includes("dmgReduction")) {
      formulaWarnings.push(`[${eff.itemName}] Display-only mitigation item has playerDMGReduction coverage but is not modeled — mitigation not applied.`);
    }
  }

  // Warn in PvE mode if PvP-only mitigation items are selected
  if (mode === "pve") {
    for (const eff of [...modeledEffects, ...partiallyModeledEffects, ...displayOnlyEffects]) {
      if (eff.formulaSupport.notes?.includes("PvP") || eff.formulaSupport.notes?.includes("pvp")) {
        formulaWarnings.push(`[${eff.itemName}] This item provides PvP-only mitigation — ignored in PvE mode.`);
      }
    }
  }

  // Aggregate all modifiers (DPS + non-DPS) for display; DPS modifiers only used in formula
  const aggregationReport = aggregateModifiers([...dpsModifierSources, ...nonDpsModifierSources]);

  return {
    modifierSources: dpsModifierSources,
    aggregationReport,
    pvpMitigation: pvpMitigationResult,
    conditionalEffects,
    uptimeProfile: effectiveProfile,
    customCombatAssumptions: effectiveProfile === "custom" ? customCombatAssumptions : undefined,
    modeledEffects,
    partiallyModeledEffects,
    displayOnlyEffects,
    unresolvedEffects,
    ignoredEffects,
    formulaWarnings,
    partialSupportNotes,
    availableMechanics: Array.from(availableMechanics),
    buildMode: mode,
    enemyType: targetId ?? "unknown",
    totalItemsConsidered:
      modeledEffects.length +
      partiallyModeledEffects.length +
      displayOnlyEffects.length +
      unresolvedEffects.length,
    totalModifiersExtracted: modifierSources.length,
    baseWeaponDMG,
    baseCritRate,
    baseCritDamage,
    baseWeakspotDamage,
    baseFireRate,
  };
}
