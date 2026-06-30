import type {
  ModifierSource,
  ModifierBreakdownEntry,
  AggregatedStats,
  DuplicateReport,
  AggregationReport,
} from "./modifierTypes";
import type { StatKey } from "../schemas/buildGoalSchema";

function isDuplicate(
  a: ModifierSource,
  b: ModifierSource
): boolean {
  if (a.sourceType !== b.sourceType) return false;
  if (a.stat !== b.stat) return false;
  if (a.id === b.id) return true;
  if (a.sourceLabel === b.sourceLabel && a.sourceType === b.sourceType)
    return true;
  return false;
}

function pickKept(
  existing: ModifierSource,
  incoming: ModifierSource
): { kept: ModifierSource; suppressed: ModifierSource } {
  if (existing.confidence === "confirmed") return { kept: existing, suppressed: incoming };
  if (incoming.confidence === "confirmed") return { kept: incoming, suppressed: existing };
  return { kept: existing, suppressed: incoming };
}

export function aggregateModifiers(
  sources: ModifierSource[]
): AggregationReport {
  const additiveMap = new Map<string, { total: number; entries: ModifierSource[] }>();
  const multiplicativeSources: ModifierSource[] = [];
  const duplicates: DuplicateReport[] = [];
  const processed = new Set<string>();

  for (const source of sources) {
    if (source.behavior === "multiplicative") {
      multiplicativeSources.push(source);
      continue;
    }

    const key = `${source.stat}`;

    if (source.behavior === "conditional" && source.conditional && !source.conditional.isActive) {
      continue;
    }

    if (!additiveMap.has(key)) {
      additiveMap.set(key, { total: 0, entries: [] });
    }

    const group = additiveMap.get(key)!;

    let isDup = false;
    for (const existing of group.entries) {
      if (isDuplicate(existing, source)) {
        const { kept, suppressed } = pickKept(existing, source);
        duplicates.push({
          id: `dup_${existing.id}_${source.id}`,
          kept,
          suppressed: [suppressed],
        });
        const keptIdx = group.entries.indexOf(existing);
        group.entries[keptIdx] = kept;
        isDup = true;
        break;
      }
    }

    if (!isDup) {
      group.entries.push(source);
      group.total += source.value;
      processed.add(source.id);
    }
  }

  const additiveStats: Partial<Record<string, number>> = {};
  const breakdown: Partial<Record<string, ModifierBreakdownEntry[]>> = {};

  for (const [key, group] of additiveMap) {
    const rounded = Math.round(group.total * 10000) / 10000;
    additiveStats[key] = rounded;
    breakdown[key] = group.entries.map((e) => ({
      sourceId: e.id,
      sourceLabel: e.sourceLabel,
      sourceType: e.sourceType,
      value: e.value,
      conditional: e.conditional,
      mechanicId: e.mechanicId,
    }));
  }

  for (const ms of multiplicativeSources) {
    if (ms.conditional && !ms.conditional.isActive) {
      continue;
    }
    const key = `${ms.stat}`;
    const current = additiveStats[key] ?? 0;
    const newVal = current * ms.value;
    additiveStats[key] = Math.round(newVal * 10000) / 10000;
    if (!breakdown[key]) breakdown[key] = [];
    breakdown[key]!.push({
      sourceId: ms.id,
      sourceLabel: ms.sourceLabel,
      sourceType: ms.sourceType,
      value: ms.value,
      conditional: ms.conditional,
      mechanicId: ms.mechanicId,
    });
  }

  const stats = additiveStats as Partial<Record<import("./modifierTypes").ModifierSource["stat"], number>>;

  return {
    stats: {
      stats,
      breakdown,
      sourceCount: processed.size,
    },
    duplicates,
    totalSources: sources.length,
    activeSources: processed.size,
    suppressedCount: duplicates.length,
  };
}

export function formatBreakdown(
  statKey: string,
  entries: ModifierBreakdownEntry[]
): string[] {
  const lines: string[] = [];
  const total = entries.reduce((s, e) => s + e.value, 0);
  lines.push(`${statKey} = ${Math.round(total * 10000) / 10000}`);
  for (const e of entries) {
    const sign = e.value >= 0 ? "+" : "";
    const conditional = e.conditional && !e.conditional.isActive
      ? ` [INACTIVE: ${e.conditional.description}]`
      : "";
    const mechanic = e.mechanicId ? ` (mechanic: ${e.mechanicId})` : "";
    lines.push(`  ${sign}${e.value.toFixed(4)} from ${e.sourceLabel} [${e.sourceType}]${mechanic}${conditional}`);
  }
  return lines;
}

export function formatAggregationReport(report: AggregationReport): string[] {
  const lines: string[] = [];
  lines.push("=".repeat(60));
  lines.push("MODIFIER AGGREGATION REPORT");
  lines.push("=".repeat(60));
  lines.push(`Total sources: ${report.totalSources}`);
  lines.push(`Active sources: ${report.activeSources}`);
  lines.push(`Suppressed duplicates: ${report.suppressedCount}`);
  lines.push("");

  const statKeys = Object.keys(report.stats.stats).sort();
  for (const rawKey of statKeys) {
    const key = rawKey as StatKey;
    const entries = report.stats.breakdown[key];
    if (entries) {
      lines.push(...formatBreakdown(key, entries));
      lines.push("");
    }
  }

  if (report.duplicates.length > 0) {
    lines.push("--- Duplicates ---");
    for (const d of report.duplicates) {
      lines.push(
        `  ${d.kept.sourceLabel} kept over ${d.suppressed.map((s) => s.sourceLabel).join(", ")}`
      );
    }
    lines.push("");
  }

  lines.push("=".repeat(60));
  return lines;
}
