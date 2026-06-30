import type { RawObservation } from "./observationTypes";

export interface OcrExportLine {
  timestamp?: string;
  damage: number;
  mechanicHint?: string;
  crit?: boolean;
  weakspot?: boolean;
  tags?: string[];
}

const OCR_LINE_RE =
  /^(\d{4}[-\/]\d{2}[-\/]\d{2}[\sT]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\s+Damage:\s*(\d+)(?:\s*\(([^)]*)\))?\s*(?:\[([^\]]*)\])?$/;

const FRAME_OCR_RE =
  /^frame=(\d+)\s+time=([\d.]+)s\s+damage=(\d+)\s+raw=(\d+(?:\.\d+)?)\s+confidence=([\d.]+)(?:\s+(.+))?$/;

function parseTimestamp(raw: string): string | undefined {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function parseOcrExportLine(
  line: string
): RawObservation | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//"))
    return undefined;

  // Try legacy timestamp format first
  const match = trimmed.match(OCR_LINE_RE);
  if (match) {
    const rawTs = match[1];
    const damage = parseInt(match[2], 10);
    const mechanicRaw = match[3];
    const tagRaw = match[4];

    const tags = tagRaw ? tagRaw.split(",").map((t) => t.trim().toLowerCase()) : [];

    const metadata: Record<string, unknown> = {};
    if (mechanicRaw) metadata.mechanicId = mechanicRaw.trim().toLowerCase();
    if (tags.length > 0) metadata.tags = tags;

    const timestamp = rawTs ? parseTimestamp(rawTs) : undefined;

    return {
      id: `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      rawDamage: damage,
      timestamp,
      sourceType: "ocr",
      rawText: trimmed,
      sourceLabel: "OCR export",
      metadata,
    };
  }

  // Try frame/time OCR format
  const frameMatch = trimmed.match(FRAME_OCR_RE);
  if (frameMatch) {
    const frame = parseInt(frameMatch[1], 10);
    const timeSecs = parseFloat(frameMatch[2]);
    const damage = parseInt(frameMatch[3], 10);
    const raw = parseFloat(frameMatch[4]);
    const confidence = parseFloat(frameMatch[5]);
    const extra = frameMatch[6]?.trim();

    const metadata: Record<string, unknown> = {
      frame,
      relativeTimeSeconds: timeSecs,
      raw,
      confidence,
      ocrFormat: "frame_time",
    };
    if (extra) metadata.rawText = extra;

    return {
      id: `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      rawDamage: damage,
      timestamp: undefined,
      sourceType: "ocr",
      rawText: trimmed,
      sourceLabel: "OCR export (frame/time)",
      metadata,
    };
  }

  return undefined;
}

export function parseOcrExport(text: string): RawObservation[] {
  return text
    .split("\n")
    .map((line) => parseOcrExportLine(line))
    .filter((r): r is RawObservation => r !== undefined);
}

export function parseManualJson(
  json: string
): RawObservation[] {
  const data = JSON.parse(json);

  if (Array.isArray(data)) {
    return data.map((entry, i) => ({
      id: `manual_${i}_${Date.now()}`,
      rawDamage: entry.rawDamage ?? entry.damage ?? entry.value ?? 0,
      timestamp: entry.timestamp ?? entry.time,
      sourceType: "manual" as const,
      sourceLabel: entry.label ?? "manual entry",
      metadata: {
        mechanicId: entry.mechanicId ?? entry.mechanic,
        tags: entry.tags ?? [],
        notes: entry.notes,
        playerStats: entry.playerStats,
        activeGear: entry.activeGear,
        normalizationFactor: entry.normalizationFactor,
      },
    }));
  }

  if (data.hits && Array.isArray(data.hits)) {
    return data.hits.map((hit: Record<string, unknown>, i: number) => ({
      id: `manual_${i}_${Date.now()}`,
      rawDamage: (hit.rawValue ??
        hit.rawDamage ??
        hit.damage ??
        hit.value ??
        0) as number,
      timestamp: (hit.timestamp ?? hit.time ?? data.timestamp) as
        | string
        | undefined,
      sourceType: "manual" as const,
      sourceLabel: data.displayName ?? data.label ?? "manual case",
      metadata: {
        mechanicId: data.mechanicId ?? data.mechanic,
        tags: hit.tags ?? [],
        notes: data.notes,
        playerStats: data.playerStats,
        activeGear: data.activeGear,
        normalizationFactor: data.normalizationFactor,
      },
    }));
  }

  return [];
}

export function parseStructuredJson(
  json: string
): RawObservation[] {
  const data = JSON.parse(json);

  if (!data.observations && !Array.isArray(data)) {
    return [];
  }

  const list = data.observations ?? data;

  return (list as Record<string, unknown>[]).map(
    (entry: Record<string, unknown>, i: number) => ({
      id: `json_${i}_${Date.now()}`,
      rawDamage: (entry.rawDamage ??
        entry.damage ??
        entry.value ??
        0) as number,
      timestamp: (entry.timestamp ?? entry.time) as string | undefined,
      sourceType: "json_import" as const,
      sourceLabel: (entry.label ?? entry.sourceLabel ?? "JSON import") as string,
      metadata: {
        mechanicId: entry.mechanicId ?? entry.mechanic,
        tags: entry.tags ?? [],
        notes: entry.notes,
        playerStats: entry.playerStats,
        activeGear: entry.activeGear,
        normalizationFactor: entry.normalizationFactor,
        confidence: entry.confidence,
      },
    })
  );
}
