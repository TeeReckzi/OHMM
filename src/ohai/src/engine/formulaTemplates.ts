import type { FormulaTemplate } from "./types";

export const formulaTemplates: FormulaTemplate[] = [
  {
    templateId: "charged_status_damage_current_patch",
    displayName: "Charged Status DMG (Hybrid Weapons)",
    formula: [
      "(Psi Intensity × Status Base Factor)",
      "× (1 + Elemental DMG %)",
      "× (1 + Status DMG %)",
      "× (1 + Keyword/Suffix DMG %)",
      "× (1 + Crit/Weakspot Modifier)",
      "× (1 + Status Vulnerability %)",
      "× (1 + Enemy Type DMG %)",
    ].join("\n"),
    variables: [
      "Psi Intensity",
      "Status Base Factor",
      "Elemental DMG %",
      "Status DMG %",
      "Keyword/Suffix DMG %",
      "Crit DMG %",
      "Weakspot DMG %",
      "Status Vulnerability %",
      "Enemy Type DMG %",
    ],
    appliesToMechanicIds: ["chargedHybridStatusShot"],
    source: { kind: "patch_note", version: "2.3.8", note: "May 2026 charged hybrid scaling rework formula" },
    confidence: "reported_current_patch_needs_testing",
    patchContext: "May 2026 / Version 2.3.8",
    needsRetest: true,
    notes: "Crit/Weakspot Modifier = (critDMG + weakspotDMG) when both land, critDMG or weakspotDMG if only one, 0 if neither. Assumes additive combination when both apply."
  },
  {
    templateId: "physical_weapon_damage_current_patch",
    displayName: "Physical Weapon DMG",
    formula: [
      "Base Weapon DMG",
      "× (1 + Attack %)",
      "× (1 + Weapon DMG Bonus %)",
      "× (1 + Crit DMG % + Weakspot DMG %)",
      "× (1 + Weapon Vulnerability %)",
      "× (1 + Enemy Type DMG %)",
    ].join("\n"),
    variables: [
      "Base Weapon DMG",
      "Attack %",
      "Weapon DMG Bonus %",
      "Crit DMG %",
      "Weakspot DMG %",
      "Weapon Vulnerability %",
      "Enemy Type DMG %",
    ],
    source: { kind: "manual_model", note: "Standard physical weapon damage formula" },
    confidence: "reported_current_patch_needs_testing",
    patchContext: "May 2026 / Version 2.3.8",
    needsRetest: true,
    notes: "Crit DMG and Weakspot DMG are additive when both apply (combined into single modifier term)."
  },
  {
    templateId: "deviation_skill_damage_current_patch",
    displayName: "Deviation Skill DMG",
    formula: [
      "Psi Intensity × Deviation Base Factor",
    ].join("\n"),
    variables: [
      "Psi Intensity",
      "Deviation Base Factor",
    ],
    appliesToMechanicIds: ["butterflyEmissary", "zapCamLoneWolf", "soulSummoner"],
    source: { kind: "manual_model", note: "Psi Intensity-based deviation damage formula from patch notes / community reports" },
    confidence: "reported_current_patch_needs_testing",
    patchContext: "May 2026 / Version 2.3.8",
    needsRetest: true,
    notes: "Base factor varies by deviation: Butterfly's Emissary 1.2, ZapCam/Lone Wolf 8.0, Soul Summoner 6.0. No vulnerability, crit, or weakspot interaction."
  },
  {
    templateId: "burn_stack_dot",
    displayName: "Burn Stack DoT DMG",
    formula: [
      "Psi Intensity × Burn Damage Per Stack Factor (0.12)",
      "+ Flat Burn Bonus (per stack)",
      "× Current Stacks",
      "× (1 + Status DMG %)",
      "× (1 + Elemental DMG %)",
      "× (1 + Keyword/Suffix DMG %)",
      "× (1 + Human DMG %)",
      "× (1 - DoT Resistance %)",
      "× (1 - Burn Resistance Debuff Level × 0.15)",
      "× (1 + Status Vulnerability %)",
      "× (1 + Enemy Type DMG %)",
      "× Crit Multiplier (if eligible)",
      "× Weakspot Multiplier (if eligible)",
      "",
      "Tick Rate: Base Tick Interval (0.5s) / Tick Frequency Multiplier",
      "Ticks Per Second = 1 / Effective Tick Interval",
      "DPS = Per-Tick Damage × Ticks Per Second",
    ].join("\n"),
    variables: [
      "Psi Intensity",
      "Burn Damage Per Stack Factor (0.12)",
      "Flat Burn Bonus",
      "Current Stacks",
      "Status DMG %",
      "Elemental DMG %",
      "Keyword/Suffix DMG %",
      "Human DMG %",
      "DoT Resistance %",
      "Burn Resistance Debuff Level",
      "Status Vulnerability %",
      "Enemy Type DMG %",
      "Crit Rate",
      "Crit DMG",
      "Weakspot DMG",
      "Base Tick Interval (0.5s)",
      "Tick Frequency Multiplier",
    ],
    appliesToMechanicIds: ["burn"],
    source: { kind: "manual_model", note: "Burn is treated as a PSI Intensity-scaling status DoT. Legacy weapon-DMG stack model removed from active formula." },
    confidence: "reported_current_patch_needs_testing",
    patchContext: "June 2026 — PSI-based Burn model aligned with known Burn mechanic behavior; game-file source still pending bindict recovery.",
    needsRetest: true,
    notes: "Burn is a status DoT and now scales from Psi Intensity in active OHAI formulas. Each stack contributes 12% Psi Intensity per tick before status/element/keyword/resistance modifiers."
  },
];

export function getFormulaTemplate(templateId: string): FormulaTemplate | undefined {
  return formulaTemplates.find((t) => t.templateId === templateId);
}

export function listFormulaTemplates(): FormulaTemplate[] {
  return formulaTemplates;
}
