import type { FoodBuffItem, ParsedBuff } from "../schemas/foodBuffSchema";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";

const nameTranslationMap: Record<string, string | null> = {};

const durationPattern = /[：:]\s*(\d+(?:\.\d+)?)/;
const baseEffectPatterns: [RegExp, string][] = [
  [/飽食度\s*\+\s*(\d+)/g, "Satiety"],
  [/飲水度\s*\+\s*(\d+)/g, "Hydration"],
  [/理智值\s*\+\s*(\d+)/g, "Sanity"],
  [/理智值\s*-\s*(\d+)/g, "Sanity"]
];

const buffMatchers: { chinese: string; english: string }[] = [
  { chinese: "槍械傷害", english: "Weapon DMG" },
  { chinese: "近戰傷害", english: "Melee DMG" },
  { chinese: "異常傷害", english: "Status DMG" },
  { chinese: "元素傷害", english: "Elemental DMG" },
  { chinese: "燃燒傷害", english: "Burn DMG" },
  { chinese: "過載傷害", english: "Power Surge DMG" },
  { chinese: "冰霜漩涡傷害", english: "Frost Vortex DMG" },
  { chinese: "彈射傷害", english: "Bounce DMG" },
  { chinese: "碎彈傷害", english: "Shrapnel DMG" },
  { chinese: "不穩定炸藥", english: "Unstable Bomber" },
  { chinese: "速射", english: "Fast Gunner" },
  { chinese: "弱點傷害", english: "Weakspot DMG" },
  { chinese: "暴擊傷害", english: "Crit DMG" },
  { chinese: "暴擊率", english: "Crit Rate" },
  { chinese: "換彈速度", english: "Reload Speed" },
  { chinese: "射擊速度", english: "Fire Rate" },
  { chinese: "彈匣容量", english: "Magazine Capacity" },
  { chinese: "移動速度", english: "Movement Speed" },
  { chinese: "衝刺速度", english: "Sprint Speed" },
  { chinese: "最大生命", english: "Max HP" },
  { chinese: "生命值", english: "HP" },
  { chinese: "耐力上限", english: "Max Stamina" },
  { chinese: "耐力恢復", english: "Stamina Recovery" },
  { chinese: "耐力恢復速度", english: "Stamina Recovery Speed" },
  { chinese: "耐力消耗", english: "Stamina Cost" },
  { chinese: "理智值", english: "Sanity" },
  { chinese: "飲水度", english: "Hydration" },
  { chinese: "飽食度", english: "Satiety" },
  { chinese: "能量", english: "Energy" },
  { chinese: "寒冷抗性", english: "Cold Resist" },
  { chinese: "霜凍抗性", english: "Frost Resist" },
  { chinese: "炎熱抗性", english: "Heat Resist" },
  { chinese: "燃燒抗性", english: "Burn Resist" },
  { chinese: "污染抗性", english: "Pollution Resist" },
  { chinese: "免傷", english: "DMG Reduction" },
  { chinese: "玩家傷害減免", english: "Player DMG Reduction" },
  { chinese: "採集", english: "Gathering Yield" },
  { chinese: "伐木", english: "Logging Yield" },
  { chinese: "採礦", english: "Mining Yield" },
  { chinese: "釣魚", english: "Fishing Yield" },
  { chinese: "異變", english: "Deviant" },
  { chinese: "偏差", english: "Deviation" },
  { chinese: "獵人標記", english: "Hunter's Mark" },
  { chinese: "重裝陣地", english: "Heavy Fortress" },
  { chinese: "精英", english: "Elite" },
  { chinese: "首領", english: "Boss" },
  { chinese: "穩健射擊", english: "Steady Shot" },
  { chinese: "沸騰", english: "Boiling" },
  { chinese: "月之低語", english: "Moon Whisper" },
  { chinese: "月之預兆", english: "Moon Omen" },
  { chinese: "星塵", english: "Stardust" },
  { chinese: "星塵源質", english: "Stardust Source" },
  { chinese: "引力晶石", english: "Gravity Crystal" },
  { chinese: "理智", english: "Sanity" }
];

function formatDuration(durationText: string | null): { durationOriginal: string | null; durationSeconds: number | null } {
  if (!durationText || durationText === "無" || durationText.trim() === "") {
    return { durationOriginal: durationText, durationSeconds: null };
  }

  const match = durationText.match(durationPattern);
  if (match) {
    const minutes = parseFloat(match[1]);
    return { durationOriginal: durationText, durationSeconds: Math.round(minutes * 60) };
  }

  const numeric = parseFloat(durationText);
  if (!isNaN(numeric)) {
    return { durationOriginal: durationText, durationSeconds: Math.round(numeric * 60) };
  }

  return { durationOriginal: durationText, durationSeconds: null };
}

export function parseBaseEffect(baseText: string | null): { parsed: { stat: string; value: number; unit: string }[]; english: string | null } {
  if (!baseText) return { parsed: [], english: null };

  const parsed: { stat: string; value: number; unit: string }[] = [];
  let result = baseText;

  for (const [pattern, stat] of baseEffectPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(result)) !== null) {
      const val = parseInt(m[1], 10);
      parsed.push({ stat, value: val, unit: "" });
      result = result.replace(m[0], `${stat} +${val}`);
    }
  }

  const translated = partialTranslate(baseText);
  return { parsed, english: translated };
}

export function parseEffectPower(powerText: string | null): { original: string | null; english: string | null } {
  if (!powerText || powerText === "無") return { original: powerText, english: null };
  const translated = powerText
    .replace(/青龍/g, "Azure Dragon")
    .replace(/玄武/g, "Black Tortoise")
    .replace(/白虎/g, "White Tiger")
    .replace(/朱雀/g, "Vermilion Bird")
    .replace(/星塵融合灶台/g, "Stardust Fusion Stove");
  return { original: powerText, english: translated !== powerText ? translated : null };
}

export function parseIngredients(ingredientsText: string | null): { original: string | null; english: string | null } {
  if (!ingredientsText) return { original: null, english: null };
  const english = partialTranslate(ingredientsText);
  return { original: ingredientsText, english: english !== ingredientsText ? english : null };
}

export function classifyRestriction(effectText: string | null): { original: string | null; english: string | null } {
  if (!effectText) return { original: null, english: null };

  const restrictions: { keyword: string; original: string; english: string }[] = [
    { keyword: "PvP", original: "PvP", english: "PvP" },
    { keyword: "PvE", original: "PvE", english: "PvE" },
    { keyword: "棱鏡", original: "棱鏡", english: "Prismverse" },
    { keyword: "夢域", original: "夢域", english: "Dream Zone" },
    { keyword: "星臨", original: "星臨", english: "Starfall" },
    { keyword: "月兆", original: "月兆", english: "Lunar Oracle" },
    { keyword: "雪國", original: "雪國", english: "Way of Winter" },
    { keyword: "溫度", original: "溫度", english: "Temperature" },
    { keyword: "寒冷", original: "寒冷", english: "Cold" },
    { keyword: "炎熱", original: "炎熱", english: "Heat" },
    { keyword: "Raid", original: "Raid", english: "Raid" }
  ];

  const detected: string[] = [];
  for (const r of restrictions) {
    if (effectText.includes(r.keyword)) {
      detected.push(r.english);
    }
  }

  if (detected.length === 0) return { original: null, english: null };
  return { original: detected.join(", "), english: detected.join(", ") };
}

export function parseBuffsFromText(text: string | null): ParsedBuff[] {
  if (!text || text === "無") return [];

  const buffs: ParsedBuff[] = [];
  const valueRegex = /(\d+(?:\.\d+)?)\s*(%)/g;

  for (const matcher of buffMatchers) {
    const escaped = matcher.chinese.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matchStart = m.index;
      const afterMatch = text.slice(matchStart + m[0].length);

      const valueMatch = afterMatch.match(valueRegex);
      if (valueMatch) {
        const val = parseFloat(valueMatch[0]);
        const unit = valueMatch[0].includes("%") ? "%" : "";
        const beforeStat = text.slice(0, matchStart).trim();
        const condition = extractCondition(beforeStat);

        buffs.push({
          buffEnglish: matcher.english,
          value: val,
          unit,
          condition,
          rawText: text
        });
      }
    }
  }

  return deduplicateBuffs(buffs);
}

function extractCondition(textBeforeStat: string): string | null {
  const lastComma = textBeforeStat.lastIndexOf("，");
  if (lastComma >= 0) {
    const cond = textBeforeStat.slice(lastComma + 1).trim();
    if (cond && cond.length < 60) return cond;
  }
  if (textBeforeStat.length < 60 && textBeforeStat.length > 0) return textBeforeStat;
  return null;
}

function deduplicateBuffs(buffs: ParsedBuff[]): ParsedBuff[] {
  const seen = new Set<string>();
  return buffs.filter((b) => {
    const key = `${b.buffEnglish}:${b.value}:${b.unit}:${b.condition || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeFoodRow(
  rowData: {
    typeOriginal: string;
    nameOriginal: string;
    effectOriginal: string | null;
    effectPowerOriginal: string | null;
    durationOriginal: string | null;
    ingredientEffectOriginal: string | null;
    ingredientsOriginal: string | null;
    baseEffectOriginal: string | null;
    durabilityHours: number | null;
    craftTimeSeconds: number | null;
    merchantBatteryCost: number | null;
    recipeUnlockOriginal: string | null;
  },
  originalRowNumber: number
): FoodBuffItem {
  const nameEnglish: string | null = nameTranslationMap[rowData.nameOriginal] ?? null;
  const foodTypeEnglish = rowData.typeOriginal === "食物" ? "Food" : rowData.typeOriginal === "飲品" ? "Drink" : rowData.typeOriginal;

  const { durationOriginal, durationSeconds } = formatDuration(rowData.durationOriginal);
  const effectEnglishPartial = rowData.effectOriginal ? partialTranslate(rowData.effectOriginal) : null;
  const ingredientEffectEnglishPartial = rowData.ingredientEffectOriginal ? partialTranslate(rowData.ingredientEffectOriginal) : null;
  const baseEffectParsed = parseBaseEffect(rowData.baseEffectOriginal);
  const effectPower = parseEffectPower(rowData.effectPowerOriginal);
  const ingredients = parseIngredients(rowData.ingredientsOriginal);

  const restriction = classifyRestriction(
    [rowData.effectOriginal, rowData.ingredientEffectOriginal].filter(Boolean).join(" ")
  );

  const parsedBuffs = parseBuffsFromText(rowData.effectOriginal);

  const reviewReasons: string[] = [];
  if (!nameEnglish) reviewReasons.push("missing_english_name");
  if (rowData.effectOriginal && rowData.effectOriginal !== "無" && !effectEnglishPartial) reviewReasons.push("effect_translation_pending");
  if (rowData.effectOriginal && rowData.effectOriginal !== "無" && parsedBuffs.length === 0) reviewReasons.push("parsedBuffs_incomplete");
  if (!durationSeconds && rowData.durationOriginal && rowData.durationOriginal !== "無") reviewReasons.push("duration_not_parsed");
  if (!rowData.nameOriginal) reviewReasons.push("missing_name");

  const blockingReasons = reviewReasons.filter(
    (r) => r !== "parsedBuffs_incomplete" && r !== "duration_not_parsed"
  );
  const needsReview = blockingReasons.length > 0;

  const id = `food-${slugify(rowData.nameOriginal)}`;

  const notes: string[] = [];
  if (!nameEnglish) notes.push(`Name translation not available for "${rowData.nameOriginal}"`);
  if (reviewReasons.includes("effect_translation_pending")) notes.push("Effect text could not be partially translated");
  if (reviewReasons.includes("parsedBuffs_incomplete")) notes.push("No structured buffs parsed from effect text");
  if (reviewReasons.includes("duration_not_parsed")) notes.push("Duration text could not be parsed to seconds");

  return {
    sourceId: SOURCE_ID,
    sourceSheetOriginal: "料理",
    sourceSheetEnglish: "Cooking / Food Buffs",
    importedAt: new Date().toISOString(),
    confidence: "B_pending_verification",
    locked: false,
    originalRowNumber,
    original: {
      typeOriginal: rowData.typeOriginal,
      nameOriginal: rowData.nameOriginal,
      effectOriginal: rowData.effectOriginal,
      effectPowerOriginal: rowData.effectPowerOriginal,
      durationOriginal: rowData.durationOriginal,
      ingredientEffectOriginal: rowData.ingredientEffectOriginal,
      ingredientsOriginal: rowData.ingredientsOriginal,
      baseEffectOriginal: rowData.baseEffectOriginal,
      durabilityHours: rowData.durabilityHours,
      craftTimeSeconds: rowData.craftTimeSeconds,
      merchantBatteryCost: rowData.merchantBatteryCost,
      recipeUnlockOriginal: rowData.recipeUnlockOriginal
    },
    normalized: {
      id,
      nameOriginal: rowData.nameOriginal,
      nameEnglish,
      foodTypeOriginal: rowData.typeOriginal,
      foodTypeEnglish,
      effectOriginal: rowData.effectOriginal,
      effectEnglish: null,
      effectEnglishPartial,
      effectPowerOriginal: rowData.effectPowerOriginal,
      effectPowerEnglish: effectPower.english,
      durationOriginal,
      durationSeconds,
      ingredientEffectOriginal: rowData.ingredientEffectOriginal,
      ingredientEffectEnglishPartial: ingredientEffectEnglishPartial,
      ingredientsOriginal: rowData.ingredientsOriginal,
      ingredientsEnglish: ingredients.english,
      baseEffectOriginal: rowData.baseEffectOriginal,
      baseEffectEnglish: baseEffectParsed.english,
      recipeUnlockOriginal: rowData.recipeUnlockOriginal,
      recipeUnlockEnglish: rowData.recipeUnlockOriginal ? partialTranslate(rowData.recipeUnlockOriginal) : null,
      durabilityHours: rowData.durabilityHours,
      craftTimeSeconds: rowData.craftTimeSeconds,
      merchantBatteryCost: rowData.merchantBatteryCost,
      scenarioRestrictionOriginal: restriction.original,
      scenarioRestrictionEnglish: restriction.english,
      parsedBuffs,
      needsReview,
      reviewReasons,
      notes
    }
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
    [/槍械傷害/g, "Weapon DMG"],
    [/近戰傷害/g, "Melee DMG"],
    [/異常傷害/g, "Status DMG"],
    [/元素傷害/g, "Elemental DMG"],
    [/燃燒傷害/g, "Burn DMG"],
    [/過載傷害/g, "Power Surge DMG"],
    [/冰霜漩涡傷害/g, "Frost Vortex DMG"],
    [/彈射傷害/g, "Bounce DMG"],
    [/碎彈傷害/g, "Shrapnel DMG"],
    [/不穩定炸藥/g, "Unstable Bomber"],
    [/速射/g, "Fast Gunner"],
    [/弱點傷害/g, "Weakspot DMG"],
    [/暴擊傷害/g, "Crit DMG"],
    [/暴擊率/g, "Crit Rate"],
    [/換彈速度/g, "Reload Speed"],
    [/射擊速度/g, "Fire Rate"],
    [/彈匣容量/g, "Magazine Capacity"],
    [/移動速度/g, "Movement Speed"],
    [/衝刺速度/g, "Sprint Speed"],
    [/最大生命/g, "Max HP"],
    [/生命值/g, "HP"],
    [/耐力上限/g, "Max Stamina"],
    [/耐力恢復/g, "Stamina Recovery"],
    [/耐力消耗/g, "Stamina Cost"],
    [/理智值/g, "Sanity"],
    [/飲水度/g, "Hydration"],
    [/飽食度/g, "Satiety"],
    [/能量/g, "Energy"],
    [/寒冷抗性/g, "Cold Resist"],
    [/霜凍抗性/g, "Frost Resist"],
    [/炎熱抗性/g, "Heat Resist"],
    [/燃燒抗性/g, "Burn Resist"],
    [/污染抗性/g, "Pollution Resist"],
    [/免傷/g, "DMG Reduction"],
    [/玩家傷害減免/g, "Player DMG Reduction"],
    [/採集/g, "Gathering"],
    [/伐木/g, "Logging"],
    [/採礦/g, "Mining"],
    [/釣魚/g, "Fishing"],
    [/異變/g, "Deviant"],
    [/偏差/g, "Deviation"],
    [/獵人標記/g, "Hunter's Mark"],
    [/重裝陣地/g, "Heavy Fortress"],
    [/精英/g, "Elite"],
    [/首領/g, "Boss"],
    [/穩健射擊/g, "Steady Shot"],
    [/沸騰/g, "Boiling"],
    [/月之低語/g, "Moon Whisper"],
    [/月之預兆/g, "Moon Omen"],
    [/星塵融合灶台/g, "Stardust Fusion Stove"],
    [/星塵/g, "Stardust"],
    [/星塵源質/g, "Stardust Source"],
    [/引力晶石/g, "Gravity Crystal"],
    [/理智/g, "Sanity"],
    [/轉盤/g, "Spin the Wheel"],
    [/隨機/g, "Random"],
    [/體型/g, "Body Size"],
    [/變胖/g, "Become Fat"],
    [/變瘦/g, "Become Thin"],
    [/刺眼的光芒/g, "Blinding Light"],
    [/暈眩/g, "Stun"],
    [/無法/g, "Cannot"],
    [/對/g, "Against"],
    [/處於/g, "While"],
    [/狀態/g, "State"],
    [/時/g, ""],
    [/獲得/g, "Gain"],
    [/提升/g, "Increase"],
    [/提高/g, "Increase"],
    [/增加/g, "Increase"],
    [/減少/g, "Decrease"],
    [/降低/g, "Reduce"],
    [/效果/g, "Effect"],
    [/持續時間/g, "Duration"],
    [/傷害/g, "DMG"],
    [/抵抗/g, "Resist"],
    [/抗性/g, "Resist"],
    [/產量/g, "Yield"],
    [/機率/g, "Chance"],
    [/冷卻/g, "Cooldown"],
    [/護盾/g, "Shield"],
    [/免疫/g, "Immune"],
    [/最後一擊/g, "Final Hit"],
    [/資源/g, "Resource"],
    [/加成/g, "Bonus"],
    [/翻倍/g, "Doubled"],
    [/額外/g, "Extra"],
    [/上限/g, "Cap"],
    [/每秒/g, "Per Second"],
    [/波動/g, "Fluctuate"],
    [/比率/g, "Ratio"],
    [/發生變化/g, "Changes"],
    [/純水/g, "Pure Water"],
    [/髒水/g, "Dirty Water"],
    [/汙染水源/g, "Contaminated Water"],
    [/冰塊/g, "Ice"],
    [/海水/g, "Seawater"],
    [/玉米油/g, "Corn Oil"],
    [/鋼錠/g, "Steel Ingot"],
    [/玻璃/g, "Glass"],
    [/鹽/g, "Salt"],
    [/糖/g, "Sugar"],
    [/胡椒/g, "Pepper"],
    [/香料/g, "Spice"],
    [/奶油/g, "Cream"],
    [/起司/g, "Cheese"],
    [/星塵起司/g, "Stardust Cheese"],
    [/醃黃瓜/g, "Pickled Cucumber"],
    [/變異/g, "Mutated"],
    [/普通/g, "Normal"],
    [/精品/g, "Premium"],
    [/魚子醬/g, "Caviar"],
    [/馬鈴薯/g, "Potato"],
    [/番茄/g, "Tomato"],
    [/高麗菜/g, "Cabbage"],
    [/洋蔥/g, "Onion"],
    [/黃瓜/g, "Cucumber"],
    [/玉米/g, "Corn"],
    [/小麥/g, "Wheat"],
    [/南瓜/g, "Pumpkin"],
    [/甜菜/g, "Beet"],
    [/蘑菇/g, "Mushroom"],
    [/羊肚菌/g, "Morel"],
    [/香蕉/g, "Banana"],
    [/藍莓/g, "Blueberry"],
    [/紅色漿果/g, "Red Berry"],
    [/草莓/g, "Strawberry"],
    [/仙人掌/g, "Cactus"],
    [/雪茸/g, "Snow Fungus"],
    [/桔梗/g, "Platycodon"],
    [/血菖蒲/g, "Blood Iris"],
    [/紫錐菊/g, "Echinacea"],
    [/金銀花/g, "Honeysuckle"],
    [/鼠尾草/g, "Sage"],
    [/黃蓮花/g, "Yellow Lotus"]
  ];
  for (const [pattern, replacement] of translations) {
    result = result.replace(pattern, replacement);
  }
  return result !== text ? result : null;
}
