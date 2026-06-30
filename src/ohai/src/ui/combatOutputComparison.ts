import type { CombatOutput } from "./combatOutput";

export interface CombatOutputDelta {
 outgoingDamageDelta: number;
 outgoingDamagePct: string;
 dpsDelta: number;
 dpsPct: string;
 mitigationDelta: number;
 mitigationDirection: "more" | "less" | "unchanged";
 effectiveHPDelta: number | undefined;
 effectiveHPPct: string | undefined;
 shotsToDieDelta: number | undefined;
 shotsToDieDirection: "better" | "worse" | "unchanged" | undefined;
 ttkDelta: number | undefined;
 ttkDirection: "faster" | "slower" | "unchanged" | undefined;
 survivabilityLabel: string;
 damageLabel: string;
}

function pct(a: number, b: number): string {
 if (b === 0) return "N/A";
 return `${Math.round(((a - b) / b) * 100)}%`;
}

export function compareCombatOutputs(before: CombatOutput, after: CombatOutput): CombatOutputDelta {
 const dmgDelta = after.damageOutput.expectedDamage - before.damageOutput.expectedDamage;
 const dpsDelta = (after.damageOutput.DPS ?? 0) - (before.damageOutput.DPS ?? 0);
 const mitDelta = after.survivability.damageTakenMultiplier - before.survivability.damageTakenMultiplier;
 const ehpDelta = after.survivability.effectiveHealth !== undefined && before.survivability.effectiveHealth !== undefined
  ? after.survivability.effectiveHealth - before.survivability.effectiveHealth
  : undefined;
 const ehpPct = ehpDelta !== undefined
  && before.survivability.effectiveHealth !== undefined
  && after.survivability.effectiveHealth !== undefined
  ? pct(after.survivability.effectiveHealth, before.survivability.effectiveHealth)
  : undefined;
 const stdDelta = after.survivability.shotsToDie !== undefined && before.survivability.shotsToDie !== undefined
  ? after.survivability.shotsToDie - before.survivability.shotsToDie
  : undefined;
 const ttk = after.pvpDuel.outgoingTTK !== undefined && before.pvpDuel.outgoingTTK !== undefined
  ? after.pvpDuel.outgoingTTK - before.pvpDuel.outgoingTTK
  : undefined;

 const mitDir: "more" | "less" | "unchanged" = mitDelta < 0 ? "more" : mitDelta > 0 ? "less" : "unchanged";
 const stdDir: "better" | "worse" | "unchanged" | undefined = stdDelta !== undefined
  ? stdDelta > 0 ? "better" : stdDelta < 0 ? "worse" : "unchanged"
  : undefined;
 const ttkDir: "faster" | "slower" | "unchanged" | undefined = ttk !== undefined
  ? ttk < 0 ? "faster" : ttk > 0 ? "slower" : "unchanged"
  : undefined;

 let survLabel: string;
 if (mitDir === "more" || (ehpDelta !== undefined && ehpDelta > 0) || (stdDelta !== undefined && stdDelta > 0)) {
  survLabel = "Improved";
 } else if (mitDir === "less" || (ehpDelta !== undefined && ehpDelta < 0) || (stdDelta !== undefined && stdDelta < 0)) {
  survLabel = "Reduced";
 } else {
  survLabel = "Unchanged";
 }

 let dmgLabel: string;
 if (dmgDelta > 0 || dpsDelta > 0) {
  dmgLabel = "Increased";
 } else if (dmgDelta < 0 || dpsDelta < 0) {
  dmgLabel = "Decreased";
 } else {
  dmgLabel = "Unchanged";
 }

 return {
  outgoingDamageDelta: Math.round(dmgDelta * 100) / 100,
  outgoingDamagePct: pct(after.damageOutput.expectedDamage, before.damageOutput.expectedDamage),
  dpsDelta: Math.round(dpsDelta * 100) / 100,
  dpsPct: before.damageOutput.DPS !== undefined && before.damageOutput.DPS > 0
   ? `${Math.round(((after.damageOutput.DPS ?? 0) / before.damageOutput.DPS - 1) * 100)}%`
   : "N/A",
  mitigationDelta: Math.round(mitDelta * 10000) / 10000,
  mitigationDirection: mitDir,
  effectiveHPDelta: ehpDelta !== undefined ? Math.round(ehpDelta * 100) / 100 : undefined,
  effectiveHPPct: ehpPct,
  shotsToDieDelta: stdDelta,
  shotsToDieDirection: stdDir,
  ttkDelta: ttk !== undefined ? Math.round(ttk * 100) / 100 : undefined,
  ttkDirection: ttkDir,
  survivabilityLabel: survLabel,
  damageLabel: dmgLabel,
 };
}
