import type { FurMaterialItem, ExternalReference, MatchConfidence, ParsedStat } from "../schemas/furMaterialSchema";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";

const nameTranslationMap: Record<string, string | null> = {
  "鹿皮": "Deer Hide",
  "高原 鹿皮": "Highland Deer Hide",
  "森林 鹿皮": "Forest Deer Hide",
  "苔原 鹿皮": "Tundra Deer Hide",
  "月兆 鹿皮": "Lunar Deer Hide",
  "夢域 鹿皮": "Dreamfused Deerhide",
  "狼皮": "Wolf Skin",
  "草原 狼皮": "Grassland Wolf Skin",
  "叢林 狼皮": "Jungle Wolf Skin",
  "荒原 狼皮": "Wasteland Wolf Skin",
  "月兆 狼皮": "Lunar Wolf Skin",
  "夢域 狼皮": "Dreamfused Wolf Skin",
  "兔皮": "Rabbit Fur",
  "夢境 兔皮": "Dreamfused Rabbit Hide",
  "幸運 兔皮": "Lucky Rabbit Fur",
  "月兆 兔皮": "Lunar Rabbit Hide",
  "夢域 兔皮": "Dreamy Rabbit Fur",
  "羊毛": "Wool",
  "高山 羊毛": "Mountain Wool",
  "岩壁 羊毛": "Rock Wall Wool",
  "金 羊毛": "Golden Wool",
  "月兆 羊毛": "Lunar Wool",
  "夢域 羊毛": "Dreamfused Wool",
  "狐皮": "Fox Skin",
  "極地 狐皮": "Polar Fox Skin",
  "沙漠 狐皮": "Desert Fox Skin",
  "星臨 狐皮": "Starfall Fox Hide",
  "熊皮": "Bear Skin",
  "浮冰 熊皮": "Floating Ice Bear Skin",
  "雪原 熊皮": "Snowfield Bear Skin",
  "深穴 熊皮": "Cave Bear Skin",
  "鱷魚皮": "Crocodile Hide",
  "沙灘 鱷皮": "Beach Crocodile Skin",
  "海灣 鱷皮": "Coastal Bay Crocodile Skin",
  "星臨 鱷皮": "Starfall Crocodile Skin",
  "牛皮": "Cowhide",
  "群山 牛皮": "Mountain Cowhide",
  "河谷 牛皮": "Valley Cowhide",
  "星臨 牛皮": "Starfall Cowhide",
  "夢域 牛皮": "Dreamfused Cowhide",
  "羽絨": "Down",
  "星臨 羽絨": "Starfall Down",
  "獸皮": "Hide",
  "馴鹿皮": "Reindeer Hide",
  "生皮": "Rawhide",
  "海豹皮": "Sealskin"
};

const aliasesEnglishMap: Record<string, string[]> = {
  "夢域 牛皮": ["Dream Zone Cowhide"]
};

const externalRefNameMap: Record<string, string> = {
  "鹿皮": "materials_ref_30",
  "高原 鹿皮": "materials_ref_20",
  "森林 鹿皮": "materials_ref_18",
  "苔原 鹿皮": "materials_ref_24",
  "狼皮": "materials_ref_36",
  "草原 狼皮": "materials_ref_19",
  "叢林 狼皮": "materials_ref_21",
  "荒原 狼皮": "materials_ref_16",
  "兔皮": "materials_ref_33",
  "幸運 兔皮": "materials_ref_10",
  "夢域 兔皮": "materials_ref_5",
  "狐皮": "materials_ref_31",
  "極地 狐皮": "materials_ref_23",
  "沙漠 狐皮": "materials_ref_17",
  "熊皮": "materials_ref_25",
  "浮冰 熊皮": "materials_ref_7",
  "雪原 熊皮": "materials_ref_14",
  "深穴 熊皮": "materials_ref_3",
  "鱷魚皮": "materials_ref_27",
  "沙灘 鱷皮": "materials_ref_2",
  "海灣 鱷皮": "materials_ref_4",
  "牛皮": "materials_ref_26",
  "群山 牛皮": "materials_ref_11",
  "河谷 牛皮": "materials_ref_15",
  "獸皮": "materials_ref_32",
  "馴鹿皮": "materials_ref_35",
  "生皮": "materials_ref_34",
  "海豹皮": "materials_ref_28"
};

const slotHeaderMap: Record<number, { slotOriginal: string; slotEnglish: string; classificationOriginal: string; classificationEnglish: string }> = {
  1: { slotOriginal: "頭盔", slotEnglish: "Helmet", classificationOriginal: "防禦", classificationEnglish: "Defensive" },
  2: { slotOriginal: "衣服、褲子", slotEnglish: "Top, Pants", classificationOriginal: "抗性", classificationEnglish: "Resist" },
  3: { slotOriginal: "手套", slotEnglish: "Gloves", classificationOriginal: "採集", classificationEnglish: "Gathering" },
  4: { slotOriginal: "鞋子", slotEnglish: "Shoes", classificationOriginal: "移動", classificationEnglish: "Movement" },
  5: { slotOriginal: "面具", slotEnglish: "Mask", classificationOriginal: "攻擊", classificationEnglish: "Offensive" }
};

const endgameEventPrefixes = ["月兆", "夢域", "夢境", "星臨"];

interface StatMatcher {
  chinese: string;
  english: string;
  priority: number;
}

const statMatchers: StatMatcher[] = [
  { chinese: "免傷", english: "DMG Reduction", priority: 1 },
  { chinese: "弱點傷害減免", english: "Weakspot DMG Reduction", priority: 1 },
  { chinese: "非弱點傷害減免", english: "Non-Weakspot DMG Reduction", priority: 1 },
  { chinese: "暴擊傷害減免", english: "Crit DMG Reduction", priority: 1 },
  { chinese: "異常傷害減免", english: "Status DMG Reduction", priority: 1 },
  { chinese: "冰霜元素傷害", english: "Frost Elemental DMG", priority: 1 },
  { chinese: "電離元素傷害", english: "Shock Elemental DMG", priority: 1 },
  { chinese: "弱點傷害", english: "Weakspot DMG", priority: 2 },
  { chinese: "元素傷害", english: "Elemental DMG", priority: 2 },
  { chinese: "異常傷害", english: "Status DMG", priority: 2 },
  { chinese: "槍械傷害", english: "Weapon DMG", priority: 2 },
  { chinese: "近戰傷害", english: "Melee DMG", priority: 2 },
  { chinese: "衝撞傷害", english: "Charge DMG", priority: 2 },
  { chinese: "暴擊傷害", english: "Crit DMG", priority: 2 },
  { chinese: "暴擊率", english: "Crit Rate", priority: 1 },
  { chinese: "最大生命", english: "Max HP", priority: 1 },
  { chinese: "最大耐力", english: "Max Stamina", priority: 1 },
  { chinese: "耐力恢復速度", english: "Stamina Recovery Speed", priority: 1 },
  { chinese: "移動速度", english: "Movement Speed", priority: 1 },
  { chinese: "衝刺速度", english: "Sprint Speed", priority: 1 },
  { chinese: "翻滾速度", english: "Roll Speed", priority: 1 },
  { chinese: "跳躍高度", english: "Jump Height", priority: 1 },
  { chinese: "攀爬速度", english: "Climb Speed", priority: 1 },
  { chinese: "翻越速度", english: "Vault Speed", priority: 1 },
  { chinese: "游泳速度", english: "Swim Speed", priority: 1 },
  { chinese: "滑翔降落速度", english: "Glide Descent Speed", priority: 1 },
  { chinese: "滑翔水平速度", english: "Glide Horizontal Speed", priority: 1 },
  { chinese: "倒地移動速度", english: "Prone Movement Speed", priority: 1 },
  { chinese: "寒冷抗性、霜凍抗性", english: "Cold Resist, Frost Resist", priority: 1 },
  { chinese: "寒冷抗性", english: "Cold Resist", priority: 2 },
  { chinese: "霜凍抗性", english: "Frost Resist", priority: 2 },
  { chinese: "炎熱抗性、燃燒抗性", english: "Heat Resist, Burn Resist", priority: 1 },
  { chinese: "炎熱抗性", english: "Heat Resist", priority: 2 },
  { chinese: "燃燒抗性", english: "Burn Resist", priority: 2 },
  { chinese: "污染抗性", english: "Pollution Resist", priority: 1 },
  { chinese: "負重上限", english: "Max Load", priority: 1 },
  { chinese: "耐力上限", english: "Stamina Cap", priority: 1 },
  { chinese: "生命值", english: "HP", priority: 3 },
  { chinese: "耐力", english: "Stamina", priority: 3 }
];

const combinedResistPatterns: { pattern: RegExp; englishParts: string[] }[] = [
  { pattern: /寒冷抗性、霜凍抗性/g, englishParts: ["Cold Resist", "Frost Resist"] },
  { pattern: /炎熱抗性、燃燒抗性/g, englishParts: ["Heat Resist", "Burn Resist"] }
];

function inferMaterialType(nameOriginal: string): { typeOriginal: string | null; typeEnglish: string | null } {
  if (nameOriginal.includes("羊毛")) return { typeOriginal: "羊毛", typeEnglish: "Wool" };
  if (nameOriginal.includes("羽絨")) return { typeOriginal: "羽絨", typeEnglish: "Down" };
  if (nameOriginal.includes("皮")) return { typeOriginal: "毛皮", typeEnglish: "Fur / Hide" };
  return { typeOriginal: null, typeEnglish: null };
}

function isEndgameEventFur(nameOriginal: string): boolean {
  return endgameEventPrefixes.some((p) => nameOriginal.startsWith(p));
}

function inferSourceAnimal(nameOriginal: string): string | null {
  if (nameOriginal.includes("鹿皮")) return "鹿";
  if (nameOriginal.includes("狼皮")) return "狼";
  if (nameOriginal.includes("兔皮")) return "兔";
  if (nameOriginal.includes("狐皮")) return "狐";
  if (nameOriginal.includes("熊皮")) return "熊";
  if (nameOriginal.includes("鱷")) return "鱷魚";
  if (nameOriginal.includes("牛皮")) return "牛";
  if (nameOriginal.includes("羊毛")) return "羊";
  if (nameOriginal.includes("羽絨")) return "鳥類";
  if (nameOriginal.includes("獸皮")) return "野獸";
  if (nameOriginal.includes("馴鹿皮")) return "馴鹿";
  if (nameOriginal.includes("生皮")) return "野獸";
  if (nameOriginal.includes("海豹皮")) return "海豹";
  return null;
}

function inferAnimalEnglish(animalOriginal: string | null): string | null {
  const map: Record<string, string> = {
    "鹿": "Deer", "狼": "Wolf", "兔": "Rabbit", "狐": "Fox",
    "熊": "Bear", "鱷魚": "Crocodile", "牛": "Cow", "羊": "Sheep",
    "鳥類": "Bird", "野獸": "Beast", "馴鹿": "Reindeer", "海豹": "Seal"
  };
  return animalOriginal ? map[animalOriginal] ?? null : null;
}

export function normalizeFurRow(
  nameOriginal: string,
  effectTexts: (string | null)[],
  originalRowNumber: number,
  externalRefIndex: { id: string; englishName: string; generatedSlug: string; sourceSlug: string | null; sourceUrlBase: string | null; canonicalSourceUrl: string | null }[]
): FurMaterialItem[] {
  const items: FurMaterialItem[] = [];

  const nameEnglish: string | null = nameTranslationMap[nameOriginal] ?? null;
  const materialType = inferMaterialType(nameOriginal);
  const sourceAnimal = inferSourceAnimal(nameOriginal);
  const matchedExtRef = externalRefMapContains(nameOriginal, externalRefIndex);
  const isEndgame = isEndgameEventFur(nameOriginal);

  const furBaseReviewReasons: string[] = [];
  if (!nameEnglish) furBaseReviewReasons.push("missing_english_name");
  if (!matchedExtRef) furBaseReviewReasons.push("unmatched_external_reference");
  if (isEndgame) furBaseReviewReasons.push("ambiguous_endgame_event_fur");
  if (sourceAnimal && !matchedExtRef) furBaseReviewReasons.push("inferred_source_droppedBy");
  if (!matchedExtRef) furBaseReviewReasons.push("sourceSlug_missing");

  for (let slotCol = 1; slotCol <= 5; slotCol++) {
    const slotInfo = slotHeaderMap[slotCol];
    const effectOriginal = effectTexts[slotCol] ?? null;
    const effectEnglishPartial = effectOriginal ? partialTranslate(effectOriginal) : null;

    const id = `fur-${slugify(nameOriginal)}-${slotInfo.slotEnglish.toLowerCase().replace(/[\s,]+/g, "-")}`;

    const parsedStats: ParsedStat[] = effectOriginal ? parseStatsFromText(effectOriginal) : [];
    const reviewReasons = [...furBaseReviewReasons];

    if (effectOriginal && effectOriginal !== "無" && !effectEnglishPartial) {
      reviewReasons.push("effect_translation_pending");
    }
    if (effectOriginal && effectOriginal !== "無" && parsedStats.length === 0) {
      reviewReasons.push("parsedStats_incomplete");
    }
    reviewReasons.push("quality_missing_from_source");

    const aliasesEnglish = aliasesEnglishMap[nameOriginal] ?? [];
    const blockingReasons = reviewReasons.filter(
      (r) => r !== "quality_missing_from_source" && r !== "parsedStats_incomplete" && r !== "sourceSlug_missing" && r !== "inferred_source_droppedBy" && r !== "unmatched_external_reference" && r !== "ambiguous_endgame_event_fur"
    );
    const needsReview = blockingReasons.length > 0;
    const notes = buildNotes(reviewReasons, nameOriginal);

    items.push({
      sourceId: SOURCE_ID,
      sourceSheetOriginal: "毛皮",
      sourceSheetEnglish: "Fur / Armor Crafting Materials",
      importedAt: new Date().toISOString(),
      confidence: "B_pending_verification",
      locked: false,
      originalRowNumber,
      original: {
        nameOriginal,
        targetSlot: slotInfo.slotOriginal,
        effectOriginal
      },
      externalReference: buildExternalReference(nameOriginal, matchedExtRef, externalRefIndex),
      normalized: {
        id,
        nameOriginal,
        nameEnglish,
        aliasesEnglish,
        materialTypeOriginal: materialType.typeOriginal,
        materialTypeEnglish: materialType.typeEnglish,
        qualityOriginal: null,
        qualityEnglish: null,
        qualityTier: null,
        targetGearSlotOriginal: slotInfo.slotOriginal,
        targetGearSlotEnglish: slotInfo.slotEnglish,
        buffClassificationOriginal: slotInfo.classificationOriginal,
        buffClassificationEnglish: slotInfo.classificationEnglish,
        effectOriginal,
        effectEnglish: null,
        effectEnglishPartial,
        sourceOriginal: sourceAnimal ? `${sourceAnimal}皮` : null,
        sourceEnglish: sourceAnimal ? `${inferAnimalEnglish(sourceAnimal)} Hide/Skin` : null,
        droppedByOriginal: sourceAnimal,
        droppedByEnglish: inferAnimalEnglish(sourceAnimal),
        parsedStats,
        needsReview,
        reviewReasons,
        notes
      }
    });
  }

  return items;
}

function buildNotes(reasons: string[], nameOriginal: string): string[] {
  const notes: string[] = [];
  if (reasons.includes("missing_english_name")) notes.push(`Name translation not available for "${nameOriginal}"`);
  if (reasons.includes("unmatched_external_reference")) notes.push(`No external reference match for "${nameOriginal}"`);
  if (reasons.includes("ambiguous_endgame_event_fur")) notes.push(`Endgame/event fur variant — name needs owner approval: "${nameOriginal}"`);
  if (reasons.includes("inferred_source_droppedBy")) notes.push("Source and droppedBy are inferred from fur name, not explicit columns");
  if (reasons.includes("sourceSlug_missing")) notes.push("sourceSlug is null — canonicalSourceUrl cannot be generated");
  if (reasons.includes("effect_translation_pending")) notes.push("Effect text could not be partially translated");
  if (reasons.includes("parsedStats_incomplete")) notes.push("No structured stats parsed from effect text");
  if (reasons.includes("quality_missing_from_source")) notes.push("Quality data not present in source sheet — set to null");
  return notes;
}

export function parseStatsFromText(text: string): ParsedStat[] {
  const stats: ParsedStat[] = [];
  if (!text || text === "無") return stats;

  const valueRegex = /([+-])\s*(\d+(?:\.\d+)?)\s*(%)?/g;
  const valueMatches: { full: string; sign: string; num: number; unit: string | null; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = valueRegex.exec(text)) !== null) {
    valueMatches.push({
      full: m[0],
      sign: m[1],
      num: parseFloat(m[2]),
      unit: m[3] || null,
      index: m.index
    });
  }

  if (valueMatches.length === 0) return stats;

  for (const vMatch of valueMatches) {
    const beforeVal = text.slice(0, vMatch.index);
    const value = vMatch.sign === "-" ? -vMatch.num : vMatch.num;
    const unit = vMatch.unit || null;

    const combinedHit = tryParseCombinedResist(beforeVal, value, unit);
    if (combinedHit) {
      stats.push(...combinedHit);
      continue;
    }

    let bestMatch: { stat: StatMatcher; statIndex: number; statEnd: number } | null = null;
    for (const sm of statMatchers) {
      const escaped = sm.chinese.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "g");
      let smMatch: RegExpExecArray | null;
      while ((smMatch = re.exec(beforeVal)) !== null) {
        if (!bestMatch || smMatch.index > bestMatch.statIndex) {
          bestMatch = { stat: sm, statIndex: smMatch.index, statEnd: smMatch.index + sm.chinese.length };
        }
      }
    }

    if (bestMatch) {
      const conditionText = extractCondition(text, bestMatch.statIndex, bestMatch.statEnd);
      const condition = conditionText ? translateCondition(conditionText) : null;

      if (bestMatch.stat.english === "Cold Resist, Frost Resist") {
        stats.push({ statEnglish: "Cold Resist", value, unit, condition, rawText: text });
        stats.push({ statEnglish: "Frost Resist", value, unit, condition, rawText: text });
      } else if (bestMatch.stat.english === "Heat Resist, Burn Resist") {
        stats.push({ statEnglish: "Heat Resist", value, unit, condition, rawText: text });
        stats.push({ statEnglish: "Burn Resist", value, unit, condition, rawText: text });
      } else {
        stats.push({ statEnglish: bestMatch.stat.english, value, unit, condition, rawText: text });
      }
    }
  }

  return deduplicateStats(stats);
}

function tryParseCombinedResist(beforeVal: string, value: number, unit: string | null): ParsedStat[] | null {
  for (const cp of combinedResistPatterns) {
    if (cp.pattern.test(beforeVal)) {
      return cp.englishParts.map((en) => ({
        statEnglish: en,
        value,
        unit,
        condition: null,
        rawText: beforeVal + (value >= 0 ? "+" : "") + value + (unit || "")
      }));
    }
    cp.pattern.lastIndex = 0;
  }
  return null;
}

function extractCondition(fullText: string, statStart: number, statEnd: number): string | null {
  const beforeStat = fullText.slice(0, statStart).trim();
  const lastComma = beforeStat.lastIndexOf("，");
  if (lastComma >= 0) {
    const cond = beforeStat.slice(lastComma + 1).trim();
    return cond || null;
  }
  return null;
}

function translateCondition(cond: string): string {
  const map: Record<string, string> = {
    "衝刺狀態下": "While Sprinting",
    "移動狀態下": "While Moving",
    "開鏡狀態下": "While ADS",
    "蹲伏狀態下": "While Crouching",
    "非戰鬥狀態下": "Out of Combat",
    "戰鬥狀態下": "In Combat",
    "位於空中": "While Airborne",
    "在空中": "While Airborne",
    "翻滾狀態下": "While Rolling",
    "隱身狀態下": "While Stealthed",
    "游泳狀態下": "While Swimming",
    "生命值<30%": "HP < 30%",
    "耐力>90": "Stamina > 90",
    "耐力>80": "Stamina > 80",
    "耐力<60": "Stamina < 60",
    "耐力=100": "Stamina = 100",
    "耐力>=100": "Stamina >= 100",
    "耐力>=120": "Stamina >= 120",
    "飽食度=100": "Satiety = 100",
    "飽食度>60": "Satiety > 60",
    "飽食度<60": "Satiety < 60",
    "飲水度=100": "Hydration = 100",
    "組隊人數>1": "Party Size > 1",
    "在夢域中": "In Dreamspace",
    "生命值每降低10%": "Per 10% HP Lost",
    "暴擊後": "After Crit",
    "脫戰狀態下": "Out of Combat",
    "耐力<30時": "Stamina < 30",
    "耐力>80時": "Stamina > 80",
    "10℃以下": "Below 10°C",
    "-10C以下": "Below -10°C",
    "10C以下": "Below 10°C",
    "任何領地內": "In Any Territory",
    "持有魚竿時": "While Holding Fishing Rod"
  };
  return map[cond] || cond;
}

function deduplicateStats(stats: ParsedStat[]): ParsedStat[] {
  const seenKeys = new Set<string>();
  return stats.filter((s) => {
    const key = `${s.statEnglish}:${s.value}:${s.unit}:${s.condition || ""}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

function externalRefMapContains(
  nameOriginal: string,
  extRefs: { id: string; englishName: string; generatedSlug: string }[]
): boolean {
  const refId = externalRefNameMap[nameOriginal];
  if (!refId) return false;
  return extRefs.some((r) => r.id === refId);
}

function buildExternalReference(
  nameOriginal: string,
  matched: boolean,
  extRefs: { id: string; englishName: string; generatedSlug: string; sourceSlug: string | null; sourceUrlBase: string | null; canonicalSourceUrl: string | null }[]
): ExternalReference {
  const refId = externalRefNameMap[nameOriginal];
  const ref = refId ? extRefs.find((r) => r.id === refId) : undefined;

  if (!ref || !matched) {
    return {
      matched: false,
      matchConfidence: "none" as MatchConfidence,
      candidateEnglishName: null,
      sourceSlug: null,
      generatedSlug: null,
      canonicalSourceUrl: null,
      needsReview: true
    };
  }

  const sourceSlug = ref.sourceSlug ?? null;
  const generatedSlug = ref.generatedSlug ?? null;
  const sourceUrlBase = ref.sourceUrlBase ?? null;
  let canonicalSourceUrl: string | null = null;
  if (sourceSlug && sourceUrlBase) {
    canonicalSourceUrl = `${sourceUrlBase.replace(/\/+$/, "")}/${sourceSlug}`;
  }

  return {
    matched: true,
    matchConfidence: "high" as MatchConfidence,
    candidateEnglishName: ref.englishName ?? null,
    sourceSlug,
    generatedSlug,
    canonicalSourceUrl,
    needsReview: false
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function partialTranslate(text: string): string | null {
  if (!text) return null;
  let result = text;
  const translations: [RegExp, string][] = [
    [/免傷/g, "DMG Reduction"],
    [/弱點傷害/g, "Weakspot DMG"],
    [/元素傷害/g, "Elemental DMG"],
    [/異常傷害/g, "Status DMG"],
    [/槍械傷害/g, "Weapon DMG"],
    [/暴擊傷害/g, "Crit DMG"],
    [/暴擊率/g, "Crit Rate"],
    [/近戰傷害/g, "Melee DMG"],
    [/衝撞傷害/g, "Charge DMG"],
    [/冰霜元素傷害/g, "Frost Elemental DMG"],
    [/電離元素傷害/g, "Shock Elemental DMG"],
    [/弱點傷害減免/g, "Weakspot DMG Reduction"],
    [/非弱點傷害減免/g, "Non-Weakspot DMG Reduction"],
    [/暴擊傷害減免/g, "Crit DMG Reduction"],
    [/異常傷害減免/g, "Status DMG Reduction"],
    [/最大生命/g, "Max HP"],
    [/生命值/g, "HP"],
    [/最大耐力/g, "Max Stamina"],
    [/耐力上限/g, "Stamina Cap"],
    [/耐力/g, "Stamina"],
    [/移動速度/g, "Movement Speed"],
    [/衝刺速度/g, "Sprint Speed"],
    [/翻滾速度/g, "Roll Speed"],
    [/跳躍高度/g, "Jump Height"],
    [/寒冷抗性、霜凍抗性/g, "Cold Resist, Frost Resist"],
    [/寒冷抗性/g, "Cold Resist"],
    [/霜凍抗性/g, "Frost Resist"],
    [/炎熱抗性、燃燒抗性/g, "Heat Resist, Burn Resist"],
    [/炎熱抗性/g, "Heat Resist"],
    [/燃燒抗性/g, "Burn Resist"],
    [/污染抗性/g, "Pollution Resist"],
    [/負重上限/g, "Max Load"],
    [/伐木、採礦/g, "Woodcutting, Mining"],
    [/禽肉、免肉/g, "Poultry, Rabbit Meat"],
    [/鹿肉、牛肉、羊肉、豬肉/g, "Venison, Beef, Lamb, Pork"],
    [/藥草種子/g, "Herb Seeds"],
    [/藥草/g, "Herbs"],
    [/蛋類/g, "Eggs"],
    [/穀物/g, "Grains"],
    [/漿果/g, "Berries"],
    [/菌類/g, "Mushrooms"],
    [/羽毛/g, "Feathers"],
    [/金礦/g, "Gold Ore"],
    [/月之低語/g, "Moon Whisper"],
    [/引力晶石/g, "Gravity Crystal"],
    [/清醒之沙/g, "Sand of Clarity"],
    [/被敵人察覺速度降低/g, "Enemy Detection Speed -"],
    [/游泳速度/g, "Swim Speed"],
    [/機率/g, "Chance"],
    [/冷卻/g, "Cooldown"],
    [/護盾/g, "Shield"],
    [/免疫/g, "Immune"],
    [/生命值<30%/g, "HP < 30%"],
    [/耐力>90/g, "Stamina > 90"],
    [/耐力>80/g, "Stamina > 80"],
    [/耐力<60/g, "Stamina < 60"],
    [/耐力=100/g, "Stamina = 100"],
    [/耐力>=100/g, "Stamina >= 100"],
    [/耐力>=120/g, "Stamina >= 120"],
    [/飽食度=100/g, "Satiety = 100"],
    [/飽食度>60/g, "Satiety > 60"],
    [/飽食度<60/g, "Satiety < 60"],
    [/飲水度=100/g, "Hydration = 100"],
    [/飲水度消耗/g, "Hydration Consumption"],
    [/衝刺狀態/g, "While Sprinting"],
    [/移動狀態/g, "While Moving"],
    [/開鏡狀態/g, "While ADS"],
    [/蹲伏狀態/g, "While Crouching"],
    [/非戰鬥狀態/g, "Out of Combat"],
    [/戰鬥狀態/g, "In Combat"],
    [/位於空中/g, "While Airborne"],
    [/在空中/g, "While Airborne"],
    [/翻滾狀態/g, "While Rolling"],
    [/隱身狀態/g, "While Stealthed"],
    [/游泳狀態/g, "While Swimming"],
    [/組隊人數/g, "Party Size"],
    [/倒地移動速度/g, "Prone Movement Speed"],
    [/攀爬速度/g, "Climb Speed"],
    [/滑翔降落速度/g, "Glide Descent Speed"],
    [/滑翔水平速度/g, "Glide Horizontal Speed"],
    [/有極低機率/g, "Very Low Chance"],
    [/效果加倍/g, "Effect Doubled"],
    [/在夢域中/g, "In Dreamspace"],
    [/生命值每降低/g, "Per HP Lost"],
    [/翻越速度/g, "Vault Speed"],
    [/腰射移動速度/g, "Hipfire Move Speed"],
    [/開鏡移動速度/g, "ADS Move Speed"],
    [/二段跳/g, "Double Jump"],
    [/濡濕/g, "Soaked/Wet"],
    [/脫戰狀態/g, "Out of Combat"],
    [/失溫症/g, "Hypothermia"],
    [/10℃以下/g, "Below 10°C"],
    [/-10C以下/g, "Below -10°C"],
    [/10C以下/g, "Below 10°C"],
    [/T5/g, ""]
  ];
  for (const [pattern, replacement] of translations) {
    result = result.replace(pattern, replacement);
  }
  return result !== text ? result : null;
}
