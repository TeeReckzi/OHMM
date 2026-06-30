import fs from "node:fs";
import path from "node:path";
import { listSheetNames, openWorkbook } from "./workbook";

export type OverlayCandidateInput = {
  sourceSheetOriginal: string;
  originalRowNumber: number;
  originalName?: string | null;
  originalValue?: string | null;
  columnHint?: string | null;
};

export type OverlayCandidateResult = {
  candidateEnglish: string | null;
  confidence: "high" | "medium" | "low" | "none";
  needsReview: boolean;
  reason: string;
};

const sheetAliasDictionary: Record<string, string[]> = {
  "武器": ["Weapons"],
  "防具": ["Armor", "Armour"],
  "套裝": ["Sets", "Set"],
  "武器防具星級": ["Weapon/Armor Stars", "Weapon and Armor Star Rating"],
  "模組來源": ["Mod Sources", "Module Source"],
  "模組核心效果": ["Mod Core Effects", "Module Core Effects"],
  "模組詞條效果": ["Mod Suffix Effects", "Module Entry Effect", "Module Suffix Effects"],
  "料理": ["Food", "Cuisine"],
  "食材": ["Ingredients"],
  "搖籃": ["Cradle"],
  "關鍵詞": ["Keywords"],
  "異常物": ["Deviations", "Abnormal Object"],
};

export async function summarizeTranslationOverlay(rootDir: string): Promise<{
  originalSheetCount: number;
  translatedSheetCount: number;
  exactMatches: string[];
  aliasMatches: Array<{ original: string; translated: string }>;
  candidateMatches: Array<{ original: string; translated: string; reason: string }>;
  unmatchedOriginalSheets: string[];
  unmatchedTranslatedSheets: string[];
  renamedCandidates: Array<{ original: string; translated: string }>;
}> {
  const sourcePath = path.join(rootDir, "data", "raw", "七日世界.xlsx");
  const overlayPath = path.join(rootDir, "data", "raw", "translation-overlays", "oncehumandatatables.xlsx");

  const sourceWorkbook = await openWorkbook(sourcePath);
  const overlayWorkbook = await openWorkbook(overlayPath);
  const sourceSheets = listSheetNames(sourceWorkbook);
  const overlaySheets = listSheetNames(overlayWorkbook);

  const exactMatches = sourceSheets.filter((sheet) => overlaySheets.includes(sheet));
  const aliasMatches: Array<{ original: string; translated: string }> = [];
  const candidateMatches: Array<{ original: string; translated: string; reason: string }> = [];

  for (const original of sourceSheets) {
    const aliasList = sheetAliasDictionary[original] ?? [];
    for (const alias of aliasList) {
      const translated = overlaySheets.find((sheet) => simplify(sheet) === simplify(alias) || simplify(sheet) === simplify(original));
      if (translated) {
        aliasMatches.push({ original, translated });
        break;
      }
    }
  }

  for (const original of sourceSheets) {
    if (exactMatches.includes(original) || aliasMatches.some((match) => match.original === original)) continue;
    const simplifiedOriginal = simplify(original);
    const translated = overlaySheets.find((sheet) => {
      const simplifiedTranslated = simplify(sheet);
      return simplifiedOriginal && simplifiedTranslated && (simplifiedTranslated.includes(simplifiedOriginal) || simplifiedOriginal.includes(simplifiedTranslated));
    });
    if (translated) {
      candidateMatches.push({ original, translated, reason: "Matched by conservative normalized comparison; review required." });
    }
  }

  const matchedTranslatedSet = new Set([
    ...exactMatches,
    ...aliasMatches.map((match) => match.original),
    ...candidateMatches.map((match) => match.original)
  ]);
  const matchedOverlaySet = new Set([
    ...sourceSheets.filter((sheet) => overlaySheets.includes(sheet)),
    ...aliasMatches.map((match) => match.translated),
    ...candidateMatches.map((match) => match.translated)
  ]);

  const unmatchedOriginalSheets = sourceSheets.filter((sheet) => !matchedTranslatedSet.has(sheet));
  const unmatchedTranslatedSheets = overlaySheets.filter((sheet) => !matchedOverlaySet.has(sheet));
  const renamedCandidates = detectRenamedSheets(unmatchedOriginalSheets, unmatchedTranslatedSheets);

  return {
    originalSheetCount: sourceSheets.length,
    translatedSheetCount: overlaySheets.length,
    exactMatches,
    aliasMatches,
    candidateMatches,
    unmatchedOriginalSheets,
    unmatchedTranslatedSheets,
    renamedCandidates
  };
}

export function findOverlayCandidate(params: OverlayCandidateInput): OverlayCandidateResult {
  const name = normalize(params.originalName);
  const value = normalize(params.originalValue);
  const columnHint = normalize(params.columnHint);

  if (name && columnHint) {
    return {
      candidateEnglish: tryTranslateByHint(name, columnHint),
      confidence: tryTranslateByHint(name, columnHint) ? "medium" : "none",
      needsReview: !tryTranslateByHint(name, columnHint),
      reason: tryTranslateByHint(name, columnHint) ? "Matched by name and column hint." : "No safe overlay candidate found for the supplied name and column hint."
    };
  }

  if (name) {
    const translated = tryTranslateByName(name);
    return translated
      ? { candidateEnglish: translated, confidence: "medium", needsReview: false, reason: "Matched by exact known name." }
      : { candidateEnglish: null, confidence: "none", needsReview: true, reason: "No safe name-based overlay candidate found." };
  }

  if (value) {
    const translated = tryTranslateByValue(value);
    return translated
      ? { candidateEnglish: translated, confidence: "low", needsReview: true, reason: "Fuzzy value-based overlay candidate only; manual review required." }
      : { candidateEnglish: null, confidence: "none", needsReview: true, reason: "No safe value-based overlay candidate found." };
  }

  return { candidateEnglish: null, confidence: "none", needsReview: true, reason: "No matchable source text provided." };
}

function detectRenamedSheets(originalSheets: string[], translatedSheets: string[]): Array<{ original: string; translated: string }> {
  const candidates: Array<{ original: string; translated: string }> = [];
  for (const original of originalSheets) {
    const simplifiedOriginal = simplify(original);
    for (const translated of translatedSheets) {
      const simplifiedTranslated = simplify(translated);
      if (simplifiedOriginal && simplifiedTranslated && (simplifiedOriginal.includes(simplifiedTranslated) || simplifiedTranslated.includes(simplifiedOriginal))) {
        candidates.push({ original, translated });
      }
    }
  }
  return candidates;
}

function tryTranslateByHint(name: string, columnHint: string): string | null {
  if (/weapon/i.test(columnHint) && /AUG-電子雲/i.test(name)) return "AUG - Electron Cloud";
  if (/armor/i.test(columnHint) && /磁矩上衣/i.test(name)) return "Magnetic Moment Top";
  if (/armor/i.test(columnHint) && /滑步長褲/i.test(name)) return "Glide Pants";
  return null;
}

function tryTranslateByName(name: string): string | null {
  const known: Record<string, string> = {
    "AUG-電子雲": "AUG - Electron Cloud",
    "復合弓-無處可逃": "Compound Bow - Nowhere to Run",
    "磁矩上衣": "Magnetic Moment Top",
    "滑步長褲": "Glide Pants"
  };
  return known[name] ?? null;
}

function tryTranslateByValue(value: string): string | null {
  if (/電湧|灼燒|冰霜漩渦|彈射|碎彈|快槍手|不穩定爆彈|獵人標記|公牛眼/.test(value)) return value;
  return null;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function simplify(value: string): string {
  return value.replace(/[\s\-_/()（）·.]+/g, "").toLowerCase();
}
