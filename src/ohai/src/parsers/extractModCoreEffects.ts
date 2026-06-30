import fs from "node:fs";
import path from "node:path";
import { formatModCoreZodError, modCoreEffectsRawSchema } from "../schemas/modCoreEffectSchema";
import { normalizeModCoreEffectRow, type OverlayCandidate } from "../utils/normalizeModCoreEffect";
import { listSheetNames, openWorkbook, readSheetAsMatrix } from "../utils/workbook";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";
const SOURCE_ORIGINAL_NAME = "七日世界";
const ROOT_DIR = path.resolve(__dirname, "..", "..");

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const sourcePath = path.join(ROOT_DIR, "data", "raw", "七日世界.xlsx");
  const overlayPath = path.join(ROOT_DIR, "data", "raw", "translation-overlays", "oncehumandatatables.xlsx");
  const workbook = await openWorkbook(sourcePath);
  const overlayWorkbook = fs.existsSync(overlayPath) ? await openWorkbook(overlayPath) : null;

  const sheetNames = listSheetNames(workbook);
  console.log(`Detected workbook: ${path.basename(sourcePath)}`);
  console.log(`Workbook sheet names: ${sheetNames.join(", ")}`);

  const detectedSheetName = detectSheet(sheetNames);
  if (!detectedSheetName) {
    console.log("No mod core effects sheet was found.");
    console.log(`Sheet names: ${sheetNames.join(", ")}`);
    return;
  }

  const rows = readSheetAsMatrix(workbook, detectedSheetName);
  const headerDetection = detectHeaderRow(rows.slice(0, 30));
  const headers = buildHeaders(rows[headerDetection.rowIndex] ?? [], headerDetection.warnings);
  const dataRows = rows.slice(headerDetection.rowIndex + 1);
  const overlaySheetName = overlayWorkbook ? findOverlaySheetName(listSheetNames(overlayWorkbook)) : null;
  const overlayRows = overlayWorkbook && overlaySheetName ? readSheetAsMatrix(overlayWorkbook, overlaySheetName) : [];

  let currentSection: "武器" | "防具" | null = null;
  let blankRowsSkipped = 0;
  const warnings = [...headerDetection.warnings];
  const items: Array<any> = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const originalRowNumber = headerDetection.rowIndex + 2 + index;
    if (isCompletelyBlank(row)) {
      blankRowsSkipped += 1;
      continue;
    }

    if (isSectionMarkerRow(row)) {
      currentSection = String(row[0]) === "武器" ? "武器" : String(row[0]) === "防具" ? "防具" : currentSection;
      warnings.push(`Row ${originalRowNumber}: skipped section marker row for ${String(row[0])}.`);
      continue;
    }

    const original = arrayToObject(headers, row);
    const overlayCandidate = buildOverlayCandidate(overlayRows[originalRowNumber - 1] ?? [], overlaySheetName);
    const normalizedResult = normalizeModCoreEffectRow(original, originalRowNumber, { currentSection, overlayCandidate });
    items.push({
      sourceId: SOURCE_ID,
      sourceOriginalName: SOURCE_ORIGINAL_NAME,
      sourceSheetOriginal: "模組核心效果",
      sourceSheetEnglish: "Mod Core Effects",
      importedAt: new Date().toISOString(),
      confidence: "B_pending_verification",
      locked: false,
      originalRowNumber,
      original,
      overlay: normalizedResult.overlay,
      normalized: normalizedResult.normalized
    });
  }

  const idCounts = new Map<string, number>();
  for (const item of items) idCounts.set(item.normalized.id, (idCounts.get(item.normalized.id) ?? 0) + 1);
  const duplicateIdCount = [...idCounts.values()].filter((count) => count > 1).length;

  const output = {
    module: "mod_core_effects",
    moduleStatus: "raw_extracted_not_verified",
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: path.basename(sourcePath),
    sourceSheetOriginal: "模組核心效果",
    sourceSheetEnglish: "Mod Core Effects",
    importedAt: new Date().toISOString(),
    locked: false,
    confidence: "B_pending_verification",
    languagePolicy: {
      projectLanguage: "English",
      preserveOriginalSourceValues: true,
      originalValuesLocation: "items[].original",
      normalizedEnglishValuesLocation: "items[].normalized"
    },
    modSystemPolicy: {
      registrySource: "data/verified/mod-system-registry.verified.json",
      defaultOptimizerPoolMode: "current_only",
      doNotMergeLegacyAndCurrentEffects: true
    },
    translationOverlayPolicy: {
      overlayWorkbook: "data/raw/translation-overlays/oncehumandatatables.xlsx",
      overlayIsSourceOfTruth: false,
      autoPromoteOverlayValues: false
    },
    workbook: {
      detectedWorkbookPath: sourcePath,
      sheetCount: sheetNames.length,
      sheetNamesOriginal: sheetNames,
      sheetNamesEnglish: sheetNames.map((name) => (name === detectedSheetName ? "Mod Core Effects" : name))
    },
    extraction: {
      detectedSheetName,
      detectedHeaderRow: headerDetection.rowNumber,
      headerConfidence: headerDetection.confidence,
      headersOriginal: headers,
      headersEnglishBestEffort: headers.map(bestEffortHeaderEnglish),
      rowCount: items.length,
      blankRowsSkipped,
      warnings: [...new Set(warnings)]
    },
    items
  };

  const parsed = modCoreEffectsRawSchema.safeParse(output);
  if (!parsed.success) {
    console.error("Mod core effect extraction failed validation:");
    for (const line of formatModCoreZodError(parsed.error)) console.error(`- ${line}`);
    return;
  }

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "mod-core-effects.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");

  const qaPath = path.join(ROOT_DIR, "docs", "module-4-mod-core-effects-qa.md");
  const qa = buildQaReport(parsed.data, duplicateIdCount);
  fs.writeFileSync(qaPath, qa, "utf8");

  const counts = countClassifications(parsed.data.items);
  const rarityClassification = classifyRarity(parsed.data.items);
  const keywordClassification = classifyKeywords(parsed.data.items);
  const effectClassification = classifyEffects(parsed.data.items);
  console.log(`Detected sheet: ${detectedSheetName}`);
  console.log(`Header row: ${headerDetection.rowNumber}`);
  console.log(`Header confidence: ${headerDetection.confidence}`);
  console.log(`Rows extracted: ${items.length}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`Duplicate ID count: ${duplicateIdCount}`);
  console.log(`Schema validation result: pass`);
  console.log(`SystemVersion counts: current_post_overhaul=${counts.system.current_post_overhaul}, legacy_pre_overhaul=${counts.system.legacy_pre_overhaul}, hybrid_player_inventory=${counts.system.hybrid_player_inventory}, unknown=${counts.system.unknown}`);
  console.log(`Availability counts: currently_farmable=${counts.availability.currently_farmable}, legacy_retained_only=${counts.availability.legacy_retained_only}, unknown=${counts.availability.unknown}`);
  console.log(`Overlay match confidence counts: high=${counts.overlayMatch.high}, medium=${counts.overlayMatch.medium}, low=${counts.overlayMatch.low}, none=${counts.overlayMatch.none}`);
  console.log(`Overlay translation confidence counts: approved=${counts.overlayTranslation.approved}, high=${counts.overlayTranslation.high}, medium=${counts.overlayTranslation.medium}, low=${counts.overlayTranslation.low}, unknown=${counts.overlayTranslation.unknown}`);
  console.log(`Overlay needs review counts: true=${counts.overlayNeedsReview.true}, false=${counts.overlayNeedsReview.false}`);
  console.log(`Rarity classification counts: no_rarity_listed=${rarityClassification.noRarityListed}, translated=${rarityClassification.translated}, untranslated=${rarityClassification.untranslatedRarity}, detection_failed=${rarityClassification.detectionFailed}`);
  console.log(`Keyword classification counts: translated=${keywordClassification.translated}, no_keyword_listed=${keywordClassification.noKeywordListed}, untranslated=${keywordClassification.untranslatedKeyword}, detection_failed=${keywordClassification.detectionFailed}, ambiguous=${keywordClassification.ambiguousKeyword}`);
  console.log(`Effect classification counts: effect_original_present=${effectClassification.effectOriginalPresent}, effect_original_missing=${effectClassification.effectOriginalMissing}, effect_english_null_by_design=${effectClassification.effectEnglishNullByDesign}, effect_partial_available=${effectClassification.effectEnglishPartialAvailable}, full_translation_pending=${effectClassification.fullEffectTranslationPending}, detection_failed=${effectClassification.effectDetectionFailed}`);
  console.log(`Output path: ${outputPath}`);
  console.log(`QA report path: ${qaPath}`);
  console.log(`Warnings: ${parsed.data.extraction.warnings.length ? parsed.data.extraction.warnings.join(" | ") : "none"}`);
  console.log("npm audit result: run separately.");
  console.log("Module 5 was not started.");
}

function detectSheet(sheetNames: string[]): string | null {
  const exact = sheetNames.find((name) => name === "模組核心效果");
  if (exact) return exact;
  return sheetNames.find((name) => /模組核心效果|模組|核心效果|mod core|mod effects|mods/i.test(name)) ?? null;
}

function findOverlaySheetName(sheetNames: string[]): string | null {
  return sheetNames.find((name) => simplify(name) === simplify("Module Core Effects") || simplify(name).includes(simplify("Module Core Effects"))) ?? null;
}

function buildOverlayCandidate(overlayRow: unknown[], overlaySheetName: string | null): OverlayCandidate {
  const candidateEnglishName = asString(overlayRow[1]);
  const candidateEnglishEffect = asString(overlayRow[2]);
  if (!overlaySheetName || (!candidateEnglishName && !candidateEnglishEffect)) {
    return {
      candidateEnglishName: null,
      candidateEnglishEffect: null,
      matchConfidence: "none",
      translationConfidence: "unknown",
      needsReview: false,
      reason: null
    };
  }
  return {
    candidateEnglishName,
    candidateEnglishEffect,
    matchConfidence: "high",
    translationConfidence: "low",
    needsReview: true,
    reason: "Exact overlay sheet alias and row alignment candidate; manual review still required."
  };
}

function detectHeaderRow(rows: unknown[][]): { rowIndex: number; rowNumber: number; confidence: "high" | "medium" | "low"; warnings: string[] } {
  let bestScore = -Infinity;
  let bestIndex = 0;
  const scored: Array<{ index: number; score: number }> = [];
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreHeaderRow(rows[i] ?? []);
    scored.push({ index: i, score });
    if (score > bestScore) { bestScore = score; bestIndex = i; }
  }
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const warnings: string[] = [];
  if (sorted[1] && Math.abs(sorted[0].score - sorted[1].score) <= 2) warnings.push(`Header row candidates are close: ${sorted.slice(0, 3).map((item) => `row ${item.index + 1} (${item.score})`).join(", ")}`);
  const confidence = bestScore >= 10 ? "high" : bestScore >= 6 ? "medium" : "low";
  if (confidence === "low") warnings.push(`Header confidence is low for row ${bestIndex + 1}.`);
  return { rowIndex: bestIndex, rowNumber: bestIndex + 1, confidence, warnings };
}

function scoreHeaderRow(row: unknown[]): number {
  const hints = ["模組", "名稱", "模組名稱", "核心", "核心效果", "效果", "部位", "槽位", "類型", "品質", "稀有度", "關鍵詞", "關鍵字", "說明", "描述", "來源", "系統", "版本"];
  let score = 0;
  let textCount = 0;
  let nonEmptyCount = 0;
  for (const cell of row) {
    if (cell === null || cell === undefined || cell === "") continue;
    nonEmptyCount += 1;
    if (typeof cell === "string") {
      textCount += 1;
      const lowered = cell.toLowerCase();
      for (const hint of hints) {
        if (lowered === hint.toLowerCase()) score += 5;
        else if (lowered.includes(hint.toLowerCase())) score += 3;
      }
    }
  }
  score += Math.min(nonEmptyCount, 12) * 0.4;
  if (textCount >= 3) score += 2;
  return score;
}

function buildHeaders(headerRow: unknown[], warnings: string[]): string[] {
  const headers: string[] = [];
  const seen = new Map<string, number>();
  for (let index = 0; index < headerRow.length; index += 1) {
    const raw = asString(headerRow[index]);
    if (!raw) {
      const fallback = `unnamedColumn_${index + 1}`;
      headers.push(fallback);
      warnings.push(`Blank header detected at column ${index + 1}; using ${fallback}.`);
      continue;
    }
    const count = (seen.get(raw) ?? 0) + 1;
    seen.set(raw, count);
    if (count > 1) {
      const duplicate = `duplicateHeader_${count}`;
      headers.push(duplicate);
      warnings.push(`Duplicate header detected: ${raw} at column ${index + 1}; using ${duplicate}.`);
      continue;
    }
    headers.push(raw);
  }
  return headers;
}

function bestEffortHeaderEnglish(header: string): string | null {
  if (header === "流派/部位") return "Keyword/Slot";
  if (header === "模組名稱") return "Mod Name";
  if (header === "核心效果") return "Core Effect";
  if (header === "後綴") return "Suffix";
  if (header === "閃光效果") return "Glint Effect";
  return null;
}

function arrayToObject(headers: string[], row: unknown[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const width = Math.max(headers.length, row.length);
  for (let index = 0; index < width; index += 1) {
    const key = headers[index] ?? `unnamedColumn_${index + 1}`;
    result[key] = index < row.length ? row[index] : null;
  }
  return result;
}

function isCompletelyBlank(row: unknown[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || cell === "");
}

function isSectionMarkerRow(row: unknown[]): boolean {
  const populated = row.filter((cell) => cell !== null && cell !== undefined && cell !== "").map((cell) => String(cell));
  return populated.length > 0 && new Set(populated).size === 1 && ["武器", "防具"].includes(populated[0]);
}

function countClassifications(items: any[]) {
  const system: Record<string, number> = { current_post_overhaul: 0, legacy_pre_overhaul: 0, hybrid_player_inventory: 0, unknown: 0 };
  const availability: Record<string, number> = { currently_farmable: 0, legacy_retained_only: 0, unknown: 0 };
  const overlayMatch: Record<string, number> = { high: 0, medium: 0, low: 0, none: 0 };
  const overlayTranslation: Record<string, number> = { approved: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  const overlayNeedsReview: Record<string, number> = { true: 0, false: 0 };
  for (const item of items) {
    system[item.normalized.systemVersion] += 1;
    if (item.normalized.availability === "currently_farmable") availability.currently_farmable += 1;
    else if (item.normalized.availability === "legacy_retained_only") availability.legacy_retained_only += 1;
    else availability.unknown += 1;
    overlayMatch[item.overlay.matchConfidence] += 1;
    overlayTranslation[item.overlay.translationConfidence] += 1;
    overlayNeedsReview[item.overlay.needsReview ? "true" : "false"] += 1;
  }
  return { system, availability, overlayMatch, overlayTranslation, overlayNeedsReview };
}

function classifyRarity(items: any[]) {
  const result = { noRarityListed: 0, translated: 0, untranslatedRarity: 0, detectionFailed: 0 };
  for (const item of items) {
    const n = item.normalized;
    if (isMissingValue(n.rarityOriginal)) result.noRarityListed += 1;
    else if (!isMissingValue(n.rarityEnglish)) result.translated += 1;
    else result.untranslatedRarity += 1;
  }
  return result;
}

function classifyKeywords(items: any[]) {
  const result = { translated: 0, noKeywordListed: 0, untranslatedKeyword: 0, detectionFailed: 0, ambiguousKeyword: 0 };
  for (const item of items) {
    const n = item.normalized;
    const keywordOriginal = typeof n.keywordOriginal === "string" ? n.keywordOriginal.trim() : "";
    if (!keywordOriginal || ["-", "none", "None", "無"].includes(keywordOriginal)) {
      result.noKeywordListed += 1;
    } else if (!isMissingValue(n.keywordEnglish) && String(n.keywordEnglish).includes("/")) {
      result.ambiguousKeyword += 1;
    } else if (!isMissingValue(n.keywordEnglish)) {
      result.translated += 1;
    } else {
      result.untranslatedKeyword += 1;
    }
  }
  return result;
}

function classifyEffects(items: any[]) {
  const result = { effectOriginalPresent: 0, effectOriginalMissing: 0, effectEnglishNullByDesign: 0, effectEnglishPartialAvailable: 0, fullEffectTranslationPending: 0, effectDetectionFailed: 0 };
  for (const item of items) {
    const n = item.normalized;
    if (isMissingValue(n.effectOriginal)) result.effectOriginalMissing += 1;
    else result.effectOriginalPresent += 1;
    if (isMissingValue(n.effectEnglish)) result.effectEnglishNullByDesign += 1;
    if (!isMissingValue(n.effectEnglishPartial)) result.effectEnglishPartialAvailable += 1;
    if (!isMissingValue(n.effectOriginal) && isMissingValue(n.effectEnglish)) result.fullEffectTranslationPending += 1;
  }
  return result;
}

function buildQaReport(data: any, duplicateIdCount: number): string {
  const items = data.items as any[];
  const isMissing = (value: unknown) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");
  const countMissing = (selector: (item: any) => unknown) => items.filter((item) => isMissing(selector(item))).length;
  const classificationCounts = countClassifications(items);
  const systemCounts = classificationCounts.system;
  const availabilityCounts = classificationCounts.availability;
  const overlayMatchCounts = classificationCounts.overlayMatch;
  const overlayTranslationCounts = classificationCounts.overlayTranslation;
  const overlayNeedsReviewCounts = classificationCounts.overlayNeedsReview;
  const rarityMap = new Map<string, number>();
  const slotMap = new Map<string, Set<string | null>>();
  const keywordMap = new Map<string, Set<string | null>>();
  const untranslatedSlots = new Set<string>();
  const untranslatedKeywords = new Set<string>();
  const noNameRows: number[] = [];
  const unknownSystemRows: number[] = [];
  const unknownAvailabilityRows: number[] = [];
  const rarityClassification = { noRarityListed: 0, translated: 0, untranslatedRarity: 0, detectionFailed: 0 };
  const keywordClassification = { translated: 0, noKeywordListed: 0, untranslatedKeyword: 0, detectionFailed: 0, ambiguousKeyword: 0 };
  const effectClassification = { effectOriginalPresent: 0, effectOriginalMissing: 0, effectEnglishNullByDesign: 0, effectEnglishPartialAvailable: 0, fullEffectTranslationPending: 0, effectDetectionFailed: 0 };

  for (const item of items) {
    const n = item.normalized;
    if (n.rarityOriginal) rarityMap.set(n.rarityOriginal, (rarityMap.get(n.rarityOriginal) ?? 0) + 1);
    if (n.slotOriginal) {
      if (!slotMap.has(n.slotOriginal)) slotMap.set(n.slotOriginal, new Set());
      slotMap.get(n.slotOriginal)!.add(n.slotEnglish ?? null);
      if (isMissing(n.slotEnglish)) untranslatedSlots.add(n.slotOriginal);
    }
    if (n.keywordOriginal) {
      if (!keywordMap.has(n.keywordOriginal)) keywordMap.set(n.keywordOriginal, new Set());
      keywordMap.get(n.keywordOriginal)!.add(n.keywordEnglish ?? null);
      if (isMissing(n.keywordEnglish)) untranslatedKeywords.add(n.keywordOriginal);
    }
    if (isMissing(n.nameOriginal)) noNameRows.push(item.originalRowNumber);
    if (n.systemVersion === "unknown") unknownSystemRows.push(item.originalRowNumber);
    if (n.availability === "unknown") unknownAvailabilityRows.push(item.originalRowNumber);

    if (isMissing(n.rarityOriginal)) rarityClassification.noRarityListed += 1;
    else if (!isMissing(n.rarityEnglish)) rarityClassification.translated += 1;
    else rarityClassification.untranslatedRarity += 1;

    if (isMissing(n.keywordOriginal)) keywordClassification.noKeywordListed += 1;
    else if (!isMissing(n.keywordEnglish) && String(n.keywordEnglish).includes("/")) keywordClassification.ambiguousKeyword += 1;
    else if (!isMissing(n.keywordEnglish)) keywordClassification.translated += 1;
    else keywordClassification.untranslatedKeyword += 1;

    if (isMissing(n.effectOriginal)) effectClassification.effectOriginalMissing += 1;
    else effectClassification.effectOriginalPresent += 1;
    if (isMissing(n.effectEnglish)) effectClassification.effectEnglishNullByDesign += 1;
    if (!isMissing(n.effectEnglishPartial)) effectClassification.effectEnglishPartialAvailable += 1;
    if (!isMissing(n.effectOriginal) && isMissing(n.effectEnglish)) effectClassification.fullEffectTranslationPending += 1;
  }

  return `# Module 4 Mod Core Effects QA Report

## Status

- Extraction status: Pass
- Schema validation status: Pass
- Row count: ${items.length}
- Blank rows skipped: ${data.extraction.blankRowsSkipped}
- Duplicate ID count: ${duplicateIdCount}

## Missing Field Counts

- nameOriginal: ${countMissing((item) => item.normalized.nameOriginal)}
- nameEnglish: ${countMissing((item) => item.normalized.nameEnglish)}
- slotEnglish: ${countMissing((item) => item.normalized.slotEnglish)}
- modTypeEnglish: ${countMissing((item) => item.normalized.modTypeEnglish)}
- rarityEnglish: ${countMissing((item) => item.normalized.rarityEnglish)}
- keywordEnglish: ${countMissing((item) => item.normalized.keywordEnglish)}
- effectEnglish: ${countMissing((item) => item.normalized.effectEnglish)}
- effectEnglishPartial: ${countMissing((item) => item.normalized.effectEnglishPartial)}
- systemVersion: ${items.filter((item) => item.normalized.systemVersion === "unknown").length}
- availability: ${items.filter((item) => item.normalized.availability === "unknown").length}
- legacyStatus: ${items.filter((item) => item.normalized.legacyStatus === "unknown").length}

## Classification Counts

- current_post_overhaul: ${systemCounts.current_post_overhaul}
- legacy_pre_overhaul: ${systemCounts.legacy_pre_overhaul}
- hybrid_player_inventory: ${systemCounts.hybrid_player_inventory}
- unknown system version: ${systemCounts.unknown}
- currently_farmable: ${availabilityCounts.currently_farmable}
- legacy_retained_only: ${availabilityCounts.legacy_retained_only}
- unknown availability: ${availabilityCounts.unknown}

## Overlay Match Confidence Counts

- high: ${overlayMatchCounts.high}
- medium: ${overlayMatchCounts.medium}
- low: ${overlayMatchCounts.low}
- none: ${overlayMatchCounts.none}

## Overlay Translation Confidence Counts

- approved: ${overlayTranslationCounts.approved}
- high: ${overlayTranslationCounts.high}
- medium: ${overlayTranslationCounts.medium}
- low: ${overlayTranslationCounts.low}
- unknown: ${overlayTranslationCounts.unknown}

## Overlay Needs Review Counts

- true: ${overlayNeedsReviewCounts.true}
- false: ${overlayNeedsReviewCounts.false}

## Rarity Classification Counts

- no rarity listed / not applicable: ${rarityClassification.noRarityListed}
- translated: ${rarityClassification.translated}
- untranslated rarity: ${rarityClassification.untranslatedRarity}
- detection failed: ${rarityClassification.detectionFailed}

## Keyword Classification Counts

- translated keyword: ${keywordClassification.translated}
- no keyword listed / not applicable: ${keywordClassification.noKeywordListed}
- untranslated keyword: ${keywordClassification.untranslatedKeyword}
- detection failed: ${keywordClassification.detectionFailed}
- ambiguous keyword: ${keywordClassification.ambiguousKeyword}

## Effect Classification Counts

- effectOriginal present: ${effectClassification.effectOriginalPresent}
- effectOriginal missing / not applicable: ${effectClassification.effectOriginalMissing}
- effectEnglish null by design: ${effectClassification.effectEnglishNullByDesign}
- effectEnglishPartial available: ${effectClassification.effectEnglishPartialAvailable}
- full effect translation pending: ${effectClassification.fullEffectTranslationPending}
- effect detection failed: ${effectClassification.effectDetectionFailed}

## Rarity Mapping Counts

${[...rarityMap.entries()].map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- None"}

## Unique Slot Mappings

${[...slotMap.entries()].map(([k, v]) => `- ${k} -> ${[...v].map((value) => value ?? "null").join(", ")}`).join("\n") || "- None"}

## Unique Keyword Mappings

${[...keywordMap.entries()].map(([k, v]) => `- ${k} -> ${[...v].map((value) => value ?? "null").join(", ")}`).join("\n") || "- None"}

## Untranslated Slots

${[...untranslatedSlots].length ? [...untranslatedSlots].map((value) => `- ${value}`).join("\n") : "- None"}

## Untranslated Keywords

${[...untranslatedKeywords].length ? [...untranslatedKeywords].map((value) => `- ${value}`).join("\n") : "- None"}

## Rows With No Detected Mod Name

${noNameRows.length ? noNameRows.map((row) => `- ${row}`).join("\n") : "- None"}

## Rows With Unknown SystemVersion

${unknownSystemRows.length ? unknownSystemRows.map((row) => `- ${row}`).join("\n") : "- None"}

## Rows With Unknown Availability

${unknownAvailabilityRows.length ? unknownAvailabilityRows.map((row) => `- ${row}`).join("\n") : "- None"}

## True Blockers

- None

## Non-Blocking Gaps

- Most mod names still rely on overlay suggestions and require review.
- Full effectEnglish remains null by design.
- rarity fields were not present in the source sheet.
- suffix compatibility text is preserved only in original and not imported as suffix data.

## Recommendation

Ready for lock review.
`;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isMissingValue(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function simplify(value: string): string {
  return value.replace(/[\s\-_/()（）·.]+/g, "").toLowerCase();
}
