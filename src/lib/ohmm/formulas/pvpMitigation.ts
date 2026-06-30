import type { ConfidenceLevel } from "./itemTypes";

export interface MitigationSource {
  sourceItemId: string;
  sourceName: string;
  baseReductionPercent: number;
  chefRexAdjustedReductionPercent: number;
  finalReductionPercent: number;
  confidence: ConfidenceLevel;
  sourceNotes: string;
  appliesTo: "pvp-only";
  formulaSupportStatus: string;
}

export interface PvPMitigationResult {
  sources: MitigationSource[];
  totalReductionPercent: number;
  incomingDamageExample: number;
  finalDamageTaken: number;
  pvpMode: boolean;
  warnings: string[];
}

const DEFAULT_INCOMING_DAMAGE = 1000;

export function computePvPMitigation(
  playerDMGReductionModifiers: { value: number; itemId: string; itemName: string; confidence: ConfidenceLevel; notes?: string; chefRexEligible?: boolean }[],
  chefRexBonusPercent: number,
  mode: "pve" | "pvp",
  incomingDamage?: number,
): PvPMitigationResult {
  const warnings: string[] = [];
  const sources: MitigationSource[] = [];

  if (mode === "pve") {
    return {
      sources: [],
      totalReductionPercent: 0,
      incomingDamageExample: incomingDamage ?? DEFAULT_INCOMING_DAMAGE,
      finalDamageTaken: incomingDamage ?? DEFAULT_INCOMING_DAMAGE,
      pvpMode: false,
      warnings: [],
    };
  }

  if (playerDMGReductionModifiers.length === 0) {
    return {
      sources: [],
      totalReductionPercent: 0,
      incomingDamageExample: incomingDamage ?? DEFAULT_INCOMING_DAMAGE,
      finalDamageTaken: incomingDamage ?? DEFAULT_INCOMING_DAMAGE,
      pvpMode: true,
      warnings: [],
    };
  }

  for (const mod of playerDMGReductionModifiers) {
    const basePct = mod.value * 100;
    const shouldScaleWithChefRex = !!mod.chefRexEligible && chefRexBonusPercent > 0;
    const chefAdjusted = shouldScaleWithChefRex
      ? Math.round(basePct * (1 + chefRexBonusPercent / 100) * 100) / 100
      : basePct;

    if (shouldScaleWithChefRex && chefRexBonusPercent > 42) {
      warnings.push(`[${mod.itemName}] Chef Rex bonus of ${chefRexBonusPercent}% exceeds realistic maximum of 42%. Clamping to 42% for mitigation.`);
    }

    sources.push({
      sourceItemId: mod.itemId,
      sourceName: mod.itemName,
      baseReductionPercent: basePct,
      chefRexAdjustedReductionPercent: chefAdjusted,
      finalReductionPercent: chefAdjusted,
      confidence: mod.confidence,
      sourceNotes: mod.notes ?? "",
      appliesTo: "pvp-only",
      formulaSupportStatus: "partially-modeled",
    });
  }

  const totalReduction = Math.min(
    sources.reduce((sum, s) => sum + s.finalReductionPercent, 0),
    100,
  );

  if (totalReduction >= 100) {
    warnings.push("[PvP Mitigation] Total reduction clamped to 100% to prevent invulnerability.");
  }

  const dmg = incomingDamage ?? DEFAULT_INCOMING_DAMAGE;
  const finalDmg = Math.round(dmg * (1 - totalReduction / 100));

  return {
    sources,
    totalReductionPercent: totalReduction,
    incomingDamageExample: dmg,
    finalDamageTaken: finalDmg,
    pvpMode: true,
    warnings,
  };
}
