import { normalizeStatKey, getDisplayName } from "./normalizer";
import type { StatKey } from "../../schemas/buildGoalSchema";

export type ParseConfidence = "exact" | "alias" | "partial" | "unknown";

export interface GearStatReviewItem {
  text: string;
  reason: string;
  suggestedStatKey?: StatKey;
}

export interface ParsedGearStats {
  sourceText: string;
  stats: Partial<Record<StatKey, number>>;
  review: GearStatReviewItem[];
  confidence: number;
}

export interface SingleParseResult {
  statKey: StatKey | null;
  value: number;
  rawLabel: string;
  rawValue: string;
  confidence: ParseConfidence;
}

const SEPARATOR_RE = /[•;\n\r、]+|,(?![^()]*\))/;
const STAT_VALUE_PATTERN = /([A-Za-z\u4e00-\u9fff\s/]+?)\s*([+-]?\s*\d+(?:\.\d+)?)\s*(%|seconds|stacks)?\s*$/i;
const STAT_PLUS_PATTERN = /([A-Za-z\u4e00-\u9fff\s/]+?)\s*[+-]\s*(\d+(?:\.\d+)?)\s*(%|seconds|stacks)?/gi;

const PERMANENT_DURATION_WORDS = /\b(Duration|Cooldown|seconds|stacks|機率|冷卻|Range|Area)\b/i;

const CN_STAT_HINTS: Record<string, StatKey> = {
  "灼燒": "burnDMGBonus",
  "熾能": "burnDMGBonus",
  "霜寒": "frostVortexDMGBonus",
  "冰霜": "frostVortexDMGBonus",
  "電離": "powerSurgeDMGBonus",
  "爆炸": "unstableBomberDMGBonus",
  "不穩定": "unstableBomberDMGBonus",
  "槍械": "weaponDMG",
  "攻擊力": "weaponDMG",
  "暴擊": "critRate",
  "弱點": "weakspotDMG",
  "元素": "elementalDMGBonus",
  "異常": "statusDMGBonus",
  "耐力": "stamina",
  "生命": "maxHP",
  "回復": "hpRecovery",
  "護盾": "shield",
  "移動": "movementSpeed",
  "採集": "gatheringYield",
  "礦物": "miningYield",
  "砍伐": "loggingYield",
  "釣魚": "fishingYield"
};

function stripParenthetical(text: string): string {
  return text.replace(/\([^)]*\)/g, "").trim();
}

function isNonStatSegment(segment: string): boolean {
  const clean = segment.replace(/[+\-\d.%\s]/g, "").trim();
  return clean.length === 0;
}

function resolveStatKey(label: string): { statKey: StatKey | null; confidence: ParseConfidence } {
  const exact = normalizeStatKey(label);
  if (exact) return { statKey: exact, confidence: "exact" };

  const clean = label.replace(/[+\-]/g, "").trim();
  const alias = normalizeStatKey(clean);
  if (alias) return { statKey: alias, confidence: "alias" };

  for (const [cn, key] of Object.entries(CN_STAT_HINTS)) {
    const lower = label.toLowerCase();
    if (lower.includes(cn.toLowerCase())) {
      const remaining = lower.replace(cn.toLowerCase(), "").trim();
      if (remaining.length === 0 || remaining === "damage" || remaining === "dmg") {
        return { statKey: key, confidence: "partial" };
      }
    }
  }

  return { statKey: null, confidence: "unknown" };
}

const SPECIFIC_DAMAGE_KEYS = new Set<StatKey>([
  "burnDMGBonus", "frostVortexDMGBonus", "powerSurgeDMGBonus", "unstableBomberDMGBonus"
]);

function resolveCNHybridStatKeys(
  label: string
): Array<{ statKey: StatKey; confidence: ParseConfidence }> {
  const results: Array<{ statKey: StatKey; confidence: ParseConfidence }> = [];

  for (const [cn, key] of Object.entries(CN_STAT_HINTS)) {
    const lower = label.toLowerCase();
    if (lower.includes(cn.toLowerCase())) {
      const remaining = lower.replace(cn.toLowerCase(), "").trim();
      if (remaining.length > 0 && remaining !== "damage" && remaining !== "dmg") {
        const englishKey = normalizeStatKey(remaining);

        if (!results.some((r) => r.statKey === key)) {
          results.push({ statKey: key, confidence: "partial" });
        }

        if (englishKey && !results.some((r) => r.statKey === englishKey)) {
          const isSpecificDamage = SPECIFIC_DAMAGE_KEYS.has(key);
          const isGenericCategory = englishKey === "elementalDMGBonus" || englishKey === "statusDMGBonus";
          if (!(isSpecificDamage && isGenericCategory)) {
            results.push({ statKey: englishKey, confidence: "partial" });
          }
        }
      }
    }
  }

  return results;
}

const UNSIGNED_VALUE_PATTERN = /([A-Za-z\s/]+?)\s+(\d+(?:\.\d+)?)\s*(%)?\s*$/i;

export function parseStatText(sourceText: string): ParsedGearStats {
  const stats: Partial<Record<StatKey, number>> = {};
  const review: GearStatReviewItem[] = [];
  let totalConfidence = 0;
  let parsedCount = 0;

  if (!sourceText || sourceText.trim().length === 0) {
    return { sourceText, stats, review, confidence: 1.0 };
  }

  const segments = sourceText
    .split(SEPARATOR_RE)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const rawSegment of segments) {
    const segment = stripParenthetical(rawSegment);
    if (isNonStatSegment(segment)) continue;

    const exactResults = parseExactSegment(segment);
    const allExactFailed = exactResults.length === 0 || exactResults.every((r) => r.statKey === null);

    let results: SingleParseResult[];

    if (allExactFailed) {
      results = parseFreeformSegment(segment);

      if (results.length === 0) {
        if (!PERMANENT_DURATION_WORDS.test(segment)) {
          review.push({
            text: rawSegment,
            reason: "unable_to_parse",
            suggestedStatKey: fuzzySuggestStatKey(rawSegment)
          });
        }
        continue;
      }
    } else {
      results = exactResults;
    }

    for (const r of results) {
      if (r.statKey && r.value !== 0) {
        stats[r.statKey] = (stats[r.statKey] ?? 0) + r.value;
        totalConfidence += confidenceWeight(r.confidence);
        parsedCount++;
      } else if (!r.statKey && r.value !== 0) {
        review.push({
          text: rawSegment,
          reason: "unrecognized_stat_label",
          suggestedStatKey: fuzzySuggestStatKey(r.rawLabel)
        });
      }
    }
  }

  const confidence = parsedCount > 0 ? totalConfidence / parsedCount : 1.0;

  return { sourceText, stats, review, confidence };
}

function confidenceWeight(c: ParseConfidence): number {
  switch (c) {
    case "exact": return 1.0;
    case "alias": return 0.8;
    case "partial": return 0.5;
    case "unknown": return 0.2;
  }
}

function hasCNPrefix(label: string): boolean {
  const lower = label.toLowerCase();
  return Object.keys(CN_STAT_HINTS).some((cn) => lower.includes(cn.toLowerCase()));
}

function parseExactSegment(segment: string): SingleParseResult[] {
  const results: SingleParseResult[] = [];

  const match = segment.match(STAT_VALUE_PATTERN);
  if (!match) return results;

  const rawLabel = match[1].trim();
  const rawValue = match[2].replace(/\s/g, "");
  const unit = (match[3] || "").toLowerCase();

  if (unit === "seconds" || unit === "stacks" || /\bstacks?\b/i.test(rawLabel)) return results;

  const value = parseFloat(rawValue);
  if (isNaN(value)) return results;

  if (hasCNPrefix(rawLabel)) {
    const cnHybrid = resolveCNHybridStatKeys(rawLabel);
    if (cnHybrid.length > 0) {
      for (const h of cnHybrid) {
        results.push({
          statKey: h.statKey,
          value,
          rawLabel,
          rawValue,
          confidence: "partial"
        });
      }
      return results;
    }
  }

  const resolved = resolveStatKey(rawLabel);
  if (resolved.statKey) {
    results.push({
      statKey: resolved.statKey,
      value,
      rawLabel,
      rawValue,
      confidence: resolved.confidence === "exact" ? "exact" : "partial"
    });
  } else {
    results.push({
      statKey: null,
      value,
      rawLabel,
      rawValue,
      confidence: "unknown"
    });
  }

  return results;
}

function parseFreeformSegment(segment: string): SingleParseResult[] {
  const results: SingleParseResult[] = [];

  const plusMatches = [...segment.matchAll(STAT_PLUS_PATTERN)];
  for (const m of plusMatches) {
    const rawLabel = m[1].trim();
    const rawValue = m[2].replace(/\s/g, "");
    const unit = (m[3] || "").toLowerCase();

    if (unit === "seconds" || unit === "stacks" || /\bstacks?\b/i.test(m[1])) continue;

    const value = parseFloat(rawValue);
    if (isNaN(value)) continue;

    const resolved = resolveStatKey(rawLabel);
    if (resolved.statKey) {
      results.push({
        statKey: resolved.statKey,
        value,
        rawLabel,
        rawValue,
        confidence: "partial"
      });
    } else if (hasCNPrefix(rawLabel)) {
      const cnHybrid = resolveCNHybridStatKeys(rawLabel);
      for (const h of cnHybrid) {
        results.push({
          statKey: h.statKey,
          value,
          rawLabel,
          rawValue,
          confidence: "partial"
        });
      }
    } else {
      const cnHybrid = resolveCNHybridStatKeys(rawLabel);
      if (cnHybrid.length > 0) {
        for (const h of cnHybrid) {
          results.push({
            statKey: h.statKey,
            value,
            rawLabel,
            rawValue,
            confidence: "partial"
          });
        }
      } else {
        results.push({
          statKey: null,
          value,
          rawLabel,
          rawValue,
          confidence: "unknown"
        });
      }
    }
  }

  const unsignedMatch = segment.match(UNSIGNED_VALUE_PATTERN);
  if (unsignedMatch && plusMatches.length === 0) {
    const rawLabel = unsignedMatch[1].trim();
    const rawValue = unsignedMatch[2].replace(/\s/g, "");
    const value = parseFloat(rawValue);
    if (!isNaN(value)) {
      const resolved = resolveStatKey(rawLabel);
      if (resolved.statKey && !results.some((r) => r.statKey === resolved.statKey)) {
        results.push({
          statKey: resolved.statKey,
          value,
          rawLabel,
          rawValue,
          confidence: "alias"
        });
      }
    }
  }

  return results;
}

function fuzzySuggestStatKey(text: string): StatKey | undefined {
  for (const [keyword, key] of Object.entries(CN_STAT_HINTS)) {
    if (text.includes(keyword)) return key;
  }
  return undefined;
}

export function parseCleanStatLabel(label: string): { statKey: StatKey | null; confidence: ParseConfidence } {
  return resolveStatKey(label);
}

export function parseGearItemStats(
  statEnglish: string | null | undefined,
  specialEffectEnglishPartial: string | null | undefined
): ParsedGearStats {
  if (!statEnglish && !specialEffectEnglishPartial) {
    return { sourceText: "", stats: {}, review: [], confidence: 1.0 };
  }
  const combined = [statEnglish, specialEffectEnglishPartial].filter(Boolean).join("\n");
  return parseStatText(combined);
}
