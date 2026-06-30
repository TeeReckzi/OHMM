import type { CalculationInput, BridgedEffect } from "./formulaBridge";
import type { PvPMitigationResult, MitigationSource } from "./pvpMitigation";
import type { CombatOutput } from "./combatOutput";

export type NoteCategory = "criticalWarning" | "assumption" | "unsupportedMechanic" | "infoNotice" | "successApplied";

export type NoteImpact = "affects-dps" | "affects-survivability" | "display-only" | "ignored";

export interface CalculationNote {
 id: string;
 category: NoteCategory;
 source: string;
 message: string;
 impact: NoteImpact;
 confidence: "high" | "medium" | "low" | "placeholder";
}

export interface NoteGroup {
 source: string;
 notes: CalculationNote[];
}

export interface CalculationNoteSummary {
 criticalCount: number;
 assumptionCount: number;
 unsupportedCount: number;
 infoCount: number;
 successCount: number;
 total: number;
}

const KNOWN_REWRITES: Record<string, { message: string; impact: NoteImpact; confidence: "high" | "medium" | "low" | "placeholder" }> = {
 "anti-gravity-milkshake": {
  message: "Movement and jump effects are shown for reference but do not affect DPS or TTK.",
  impact: "display-only",
  confidence: "high",
 },
 "chef-rex": {
  message: "Chef Rex scales only active food/drink buff modifiers. It does not directly amplify weapon damage or non-food sources.",
  impact: "affects-dps",
  confidence: "medium",
 },
 "pyro-dino": {
  message: "Chef Rex scales only active food/drink buff modifiers. It does not directly amplify weapon damage or non-food sources.",
  impact: "affects-dps",
  confidence: "medium",
 },
 "gilded-gloves": {
  message: "Burn crit eligibility is enabled by Gilded Gloves; some Burn proc sources still require verification.",
  impact: "affects-dps",
  confidence: "medium",
 },
 "tactical-combo": {
  message: "Estimated from reload and swap frequency under the current uptime profile.",
  impact: "affects-dps",
  confidence: "medium",
 },
 "status-enhancement": {
  message: "Estimated from weakspot uptime under current assumptions.",
  impact: "affects-dps",
  confidence: "medium",
 },
 "safety-sandwich": {
  message: "PvP damage reduction from Safety Sandwich is applied. Chef Rex bonus increases the mitigation total.",
  impact: "affects-survivability",
  confidence: "high",
 },
 "all-weather-stew": {
  message: "Environmental resistance is a defensive effect and does not influence DPS or TTK projections.",
  impact: "display-only",
  confidence: "high",
 },
};

function effectConfidence(confidence: string): "high" | "medium" | "low" | "placeholder" {
 if (confidence === "verified" || confidence === "observed") return "high";
 if (confidence === "estimated") return "medium";
 if (confidence === "experimental") return "low";
 return "placeholder";
}

function buildEffectNote(effect: BridgedEffect, category: NoteCategory, defaultImpact: NoteImpact): CalculationNote {
 const key = effect.itemId === "pyro-dino" ? "chef-rex" : effect.itemId;
 const rewrite = KNOWN_REWRITES[key] ?? KNOWN_REWRITES[effect.itemId];
 if (rewrite) {
  return {
   id: `${effect.itemId}-note`,
   category,
   source: effect.itemName,
   message: rewrite.message,
   impact: rewrite.impact,
   confidence: rewrite.confidence,
  };
 }
 return {
  id: `${effect.itemId}-${category}`,
  category,
  source: effect.itemName,
  message: `${effect.itemName} provides ${effect.category} effects that are included in the calculation.`,
  impact: defaultImpact,
  confidence: effectConfidence(effect.formulaSupport.status),
 };
}

function parseWarningString(w: string): CalculationNote | null {
 const sourceMatch = w.match(/^\[([^\]]+)\]\s*(.*)/);
 const source = sourceMatch ? sourceMatch[1] : "Formula Engine";
 const rest = sourceMatch ? sourceMatch[2] : w;

 const itemMatch = source.match(/^Cradle:\s*(.+)/);
 const itemId = itemMatch ? itemMatch[1].toLowerCase().replace(/\s+/g, "-") : source.toLowerCase().replace(/\s+/g, "-");

 const rewrite = KNOWN_REWRITES[itemId];
 if (rewrite) {
  return {
   id: `warning-${itemId}`,
   category: rewrite.impact === "display-only" ? "infoNotice" : "assumption",
   source,
   message: rewrite.message,
   impact: rewrite.impact,
   confidence: rewrite.confidence,
  };
 }

 const lower = rest.toLowerCase();
 let category: NoteCategory = "infoNotice";
 let impact: NoteImpact = "display-only";
 let confidence: "high" | "medium" | "low" | "placeholder" = "medium";

 if (lower.includes("unresolved") || lower.includes("no formula") || lower.includes("not modeled") || lower.includes("pending")) {
  category = "unsupportedMechanic";
  impact = "affects-dps";
  confidence = "low";
 } else if (lower.includes("not included") || lower.includes("not reflected") || lower.includes("display-only")) {
  category = "infoNotice";
  impact = "display-only";
  confidence = "high";
 } else if (lower.includes("shown at full") || lower.includes("estimated from") || lower.includes("depends on pending")) {
  category = "assumption";
  impact = "affects-dps";
  confidence = "medium";
 } else if (lower.includes("mitigation applied") || lower.includes("mitigation source")) {
  category = "successApplied";
  impact = "affects-survivability";
  confidence = "high";
 } else if (lower.includes("no mitigation") || lower.includes("not applied") || lower.includes("ignored")) {
  category = "infoNotice";
  impact = "ignored";
  confidence = "high";
 } else if (lower.includes("crit") || lower.includes("weakspot") || lower.includes("context override")) {
  category = "infoNotice";
  impact = "affects-dps";
  confidence = "high";
 } else if (lower.includes("clamped") || lower.includes("exceed")) {
  category = "criticalWarning";
  impact = "affects-survivability";
  confidence = "high";
 }

 return {
  id: `warning-${itemId}-${category}`,
  category,
  source,
  message: rest,
  impact,
  confidence,
 };
}

function buildPvPMitigationNotes(pvp: PvPMitigationResult): CalculationNote[] {
 const notes: CalculationNote[] = [];
 if (!pvp.pvpMode) return notes;

 if (pvp.sources.length > 0) {
  const sourceNames = pvp.sources.map((s) => s.sourceName).join(", ");
  notes.push({
   id: "pvp-mitigation-applied",
   category: "successApplied",
   source: "PvP Mitigation",
   message: `Applied: ${pvp.sources.length} mitigation source(s) (${sourceNames}). Total reduction: ${pvp.totalReductionPercent.toFixed(1)}%.`,
   impact: "affects-survivability",
   confidence: "high",
  });

  for (const src of pvp.sources) {
   if (src.chefRexAdjustedReductionPercent !== src.baseReductionPercent) {
    notes.push({
     id: `chef-rex-mitigation-${src.sourceItemId}`,
     category: "infoNotice",
     source: "Chef Rex (Mitigation)",
     message: `Chef Rex ${src.chefRexAdjustedReductionPercent > src.baseReductionPercent ? "increases" : "reduces"} the mitigation from ${src.sourceName} from ${(src.baseReductionPercent * 100).toFixed(1)}% to ${(src.chefRexAdjustedReductionPercent * 100).toFixed(1)}%.`,
     impact: "affects-survivability",
     confidence: "high",
    });
   }
  }
 } else {
  notes.push({
   id: "pvp-no-mitigation",
   category: "infoNotice",
   source: "PvP Mitigation",
   message: "No PvP mitigation sources found. Damage projections show raw output with no player damage reduction.",
   impact: "display-only",
   confidence: "high",
  });
 }

 return notes;
}

function buildAssumptionNotes(input: CalculationInput): CalculationNote[] {
 const notes: CalculationNote[] = [];
 const profileLabel: Record<string, string> = {
  conservative: "Conservative — assumes lowest uptime and average execution.",
  realistic: "Realistic — balanced assumptions for typical play sessions.",
  optimized: "Optimized — assumes good uptime and above-average execution.",
  perfect: "Perfect — assumes ideal conditions and maximum execution.",
  custom: "Custom — user-controlled assumptions override the baseline profile.",
 };

 notes.push({
  id: "uptime-profile",
  category: "assumption",
  source: "Uptime Profile",
  message: profileLabel[input.uptimeProfile] ?? `Using "${input.uptimeProfile}" profile.`,
  impact: "affects-dps",
  confidence: "high",
 });

 if (input.customCombatAssumptions && Object.keys(input.customCombatAssumptions).length > 0) {
  const overrides = Object.entries(input.customCombatAssumptions)
   .filter(([, v]) => v !== undefined)
   .map(([k, v]) => `${k}=${v}`);
  notes.push({
   id: "custom-assumptions",
   category: "assumption",
   source: "Custom Assumptions",
   message: `User overrides active: ${overrides.join(", ")}.`,
   impact: "affects-dps",
   confidence: "medium",
  });
 }

 return notes;
}

function buildSuccessNotes(input: CalculationInput): CalculationNote[] {
 const notes: CalculationNote[] = [];
 const modeled = input.modeledEffects;
 if (modeled.length > 0) {
  const bySource = new Map<string, BridgedEffect[]>();
  for (const eff of modeled) {
   if (!bySource.has(eff.itemName)) bySource.set(eff.itemName, []);
   bySource.get(eff.itemName)!.push(eff);
  }
  for (const [name, effects] of bySource) {
   notes.push({
    id: `modeled-${name}`,
    category: "successApplied",
    source: name,
    message: `${effects.length} formula-supported effect(s) applied to the calculation.`,
    impact: "affects-dps",
    confidence: "high",
   });
  }
 }
 return notes;
}

export function extractCalculationNotes(input: CalculationInput): CalculationNote[] {
 const notes: CalculationNote[] = [];

 notes.push(...buildSuccessNotes(input));
 notes.push(...buildAssumptionNotes(input));
 notes.push(...buildPvPMitigationNotes(input.pvpMitigation));

 for (const eff of input.partiallyModeledEffects) {
  notes.push(buildEffectNote(eff, "unsupportedMechanic", "affects-dps"));
 }
 for (const eff of input.displayOnlyEffects) {
  notes.push(buildEffectNote(eff, "infoNotice", "display-only"));
 }
 for (const eff of input.unresolvedEffects) {
  notes.push(buildEffectNote(eff, "unsupportedMechanic", "affects-dps"));
 }

 for (const w of input.formulaWarnings) {
  const parsed = parseWarningString(w);
  if (parsed) {
   const dup = notes.find((n) => n.id === parsed.id);
   if (!dup) notes.push(parsed);
  }
 }

 for (const n of input.partialSupportNotes) {
  const note: CalculationNote = {
   id: `partial-note-${n.slice(0, 20)}`,
   category: "assumption",
   source: "Partial Support",
   message: n,
   impact: "affects-dps",
   confidence: "medium",
  };
  const dup = notes.find((e) => e.message === n);
  if (!dup) notes.push(note);
 }

 return groupAndSort(notes);
}

export function groupAndSort(notes: CalculationNote[]): CalculationNote[] {
 const seen = new Set<string>();
 const deduped: CalculationNote[] = [];

 for (const note of notes) {
  if (!seen.has(note.id)) {
   seen.add(note.id);
   deduped.push(note);
  }
 }

 const categoryOrder: Record<NoteCategory, number> = {
  criticalWarning: 0,
  unsupportedMechanic: 1,
  assumption: 2,
  infoNotice: 3,
  successApplied: 4,
 };

 deduped.sort((a, b) => {
  const catDiff = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
  if (catDiff !== 0) return catDiff;
  return a.source.localeCompare(b.source);
 });

 return deduped;
}

export function groupNotesBySource(notes: CalculationNote[]): NoteGroup[] {
 const map = new Map<string, CalculationNote[]>();
 for (const note of notes) {
  if (!map.has(note.source)) map.set(note.source, []);
  map.get(note.source)!.push(note);
 }
 return Array.from(map.entries())
  .map(([source, groupNotes]) => ({ source, notes: groupNotes }))
  .sort((a, b) => a.source.localeCompare(b.source));
}

export function computeSummary(notes: CalculationNote[]): CalculationNoteSummary {
 const s: CalculationNoteSummary = { criticalCount: 0, assumptionCount: 0, unsupportedCount: 0, infoCount: 0, successCount: 0, total: notes.length };
 for (const n of notes) {
  if (n.category === "criticalWarning") s.criticalCount++;
  else if (n.category === "assumption") s.assumptionCount++;
  else if (n.category === "unsupportedMechanic") s.unsupportedCount++;
  else if (n.category === "infoNotice") s.infoCount++;
  else if (n.category === "successApplied") s.successCount++;
 }
 return s;
}
