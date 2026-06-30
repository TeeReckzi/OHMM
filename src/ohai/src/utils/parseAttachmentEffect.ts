import type { StatModifier } from "../ui/itemTypes";

const ATTACHMENT_STAT_MAP: Record<string, string> = {
  "stability": "stability",
  "mobility": "mobility",
  "accuracy": "accuracy",
  "range": "range",
  "fire rate": "fireRate",
  "reload speed": "reloadSpeed",
  "aiming speed": "aimSpeed",
  "hit shake resistance": "hitShakeResistance",
};

function normalizeStatName(raw: string): string | undefined {
  const lower = raw.trim().toLowerCase();
  return ATTACHMENT_STAT_MAP[lower];
}

const DISPLAY_ONLY_PREFIXES = ["zoom level"];

export function parseAttachmentEffectSummary(effectSummary: string): StatModifier[] {
  if (!effectSummary || effectSummary.trim() === "") return [];
  const modifiers: StatModifier[] = [];
  const parts = effectSummary.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (DISPLAY_ONLY_PREFIXES.some((p) => part.toLowerCase().startsWith(p))) continue;
    const match = part.match(/^([A-Za-z\s]+?)\s*([+-]?\s*\d+(?:\.\d+)?)\s*(%)?$/);
    if (!match) continue;
    const rawStat = match[1].trim();
    const rawValue = parseFloat(match[2].replace(/\s+/g, ""));
    const isPercent = match[3] === "%";
    const statKey = normalizeStatName(rawStat);
    if (statKey) {
      modifiers.push({
        stat: statKey,
        value: isPercent ? rawValue / 100 : rawValue,
        unit: isPercent ? "percent" : "flat",
      });
    }
  }
  return modifiers;
}
