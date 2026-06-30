import type { DeviationItem, ParsedDeviationEffect } from "../schemas/deviationSchema";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";

const nameTranslationMap: Record<string, string> = {
  "迷你奇點": "Zeno-Purifier",
  "遠歸之蝶": "Butterfly's Emissary",
  "快照": "ZapCam",
  "低語孤狼": "Lonewolf's Whisper",
  "願望先生": "Mr. Wish",
  "紅龍": "Pyro Dino",
  "冬靈": "Snowsprite",
  "永恆烈陽": "Invincible Sun",
  "極寒水母": "Polar Jelly",
  "惡臭球根": "Grumpy Bulb",
  "破碎少女": "Shattered Maiden",
  "迷你黃衣": "Mini Feaster",
  "活性凝膠": "Festering Gel",
  "熊醫生": "Dr. Teddy",
  "巫毒娃娃": "Voodoo Doll",
  "量子蝸牛": "Atomic Snail",
  "迪斯可球": "Disco Ball",
  "榮枯種子": "Harveseed",
  "捕夢網": "Dreamcatcher",
  "匠師之手": "Artisan's Touch",
  "薑餅屋": "Gingerbread House",
  "空間魔方": "Space Turner",
  "冰之瓶": "Ice Pot",
  "核子打火機": "Atomic Lighter",
  "門斐": "Strange Door",
  "上界之卵": "Upper World Spawn",
  "球狀閃電": "Orb Lightning",
  "發條青蛙": "Frog the Leaper",
  "派對猴": "Party Monkey",
  "雪景球": "Snow Globe",
  "一碗美味": "Hug-in-a-Bowl",
  "夢域 · 工號37": "Dream Zone: H37",
  "小紙人": "Paper Doll",
  "龐然大菇": "Growshroom",
  "奪命兔": "Lethal Rabbit",
  "魚航員": "Hydronaut Fish",
  "焦油布丁": "Tar Pudding",
  "夢域 · 願望箱": "Dream Zone: Wish Box",
  "願望箱": "Wish Box",
  "蜂團團": "Buzzy Bee",
  "乖乖兔": "Fetch-A-Lot Bunny",
  "木工河狸": "Logging Beaver",
  "雨人": "Rain Man",
  "炎之精": "Flame Essence",
  "胡桃夾子": "Nutcracker",
  "異維大貓": "Extradimensional Cat",
  "聯合體": "The Union",
  "皆斬": "Zeno-Purifier",
  "勇士喬治": "Brave George",
  "喚生靈": "Soul Summoner",
  "凝視的黑貓": "Enchanting Void",
  "氣球狗": "Pup Buddy",
  "藍色音浪 · 青龍": "Chefosaurus Rex - Azure Melody",
  "狂野 · 青龍": "Berserkosaurus Rex",
  "青龍": "Chefosaurus Rex",
  "蝶之夢": "Rebecca",
  "電鰻": "Electric Eel",
  "狐主任": "Director Fox",
  "元素小子": "Digby Boy",
  "搗蛋貓": "Cattiva",
  "黑醫": "Doctor Raven",
  "守夜燈": "Gazocchio",
  "旋疾鼬": "Chillet",
  "桃旋鼬": "Chillet Ignis",
  "杜賓": "Doberman",
  "狼犬": "German Shepherd",
  "拉不拉多": "Labrador",
  "鯨狗": "Pup Buddy",
  "電螈": "Electric Eel",
  "工號37": "The Digby Boy",
  "空之子": "By-the-Wind",
  "輝光 · 空之子": "Radiant One"
};

const combatRelevanceMap: Record<string, "combat" | "territory" | "crafting" | "gathering" | "utility" | "unknown"> = {
  "戰鬥型": "combat",
  "造物型": "utility",
  "領地型": "territory"
};

const typeEnglishMap: Record<string, string> = {
  "戰鬥型": "Combat",
  "造物型": "Creation",
  "領地型": "Territory"
};

function splitIntoActivePassive(text: string | null): { active: string | null; passive: string | null } {
  if (!text) return { active: null, passive: null };
  const colonIdx = text.indexOf("：");
  if (colonIdx < 0) return { active: text, passive: text };
  const firstLine = text.slice(0, colonIdx).trim();
  const rest = text.slice(colonIdx + 1).trim();
  return { active: firstLine || text, passive: rest || text };
}

function extractTraitFromNotes(notesText: string | null): string | null {
  if (!notesText) return null;
  const colonIdx = notesText.indexOf("：");
  if (colonIdx < 0) return null;
  const before = notesText.slice(0, colonIdx).trim();
  if (before.length > 0 && before.length < 30) return before;
  return null;
}

function extractTraitValue(notesText: string | null): string | null {
  if (!notesText) return null;
  const colonIdx = notesText.indexOf("：");
  if (colonIdx < 0 || colonIdx >= notesText.length - 1) return null;
  return notesText.slice(colonIdx + 1).trim();
}

const effectMatchers: { chinese: string; english: string }[] = [
  { chinese: "槍械傷害", english: "Weapon DMG" },
  { chinese: "近戰傷害", english: "Melee DMG" },
  { chinese: "異常傷害", english: "Status DMG" },
  { chinese: "元素傷害", english: "Elemental DMG" },
  { chinese: "燃燒", english: "Burn" },
  { chinese: "灼燒", english: "Burn" },
  { chinese: "寒霜", english: "Frost" },
  { chinese: "冰霜", english: "Frost" },
  { chinese: "電離", english: "Shock" },
  { chinese: "過載", english: "Power Surge" },
  { chinese: "彈射", english: "Bounce" },
  { chinese: "碎彈", english: "Shrapnel" },
  { chinese: "爆擊傷害", english: "Crit DMG" },
  { chinese: "暴擊傷害", english: "Crit DMG" },
  { chinese: "暴擊率", english: "Crit Rate" },
  { chinese: "弱點傷害", english: "Weakspot DMG" },
  { chinese: "移動速度", english: "Movement Speed" },
  { chinese: "衝刺速度", english: "Sprint Speed" },
  { chinese: "換彈", english: "Reload" },
  { chinese: "冷卻時間", english: "Cooldown" },
  { chinese: "冷卻", english: "Cooldown" },
  { chinese: "持續時間", english: "Duration" },
  { chinese: "生命值", english: "HP" },
  { chinese: "最大生命", english: "Max HP" },
  { chinese: "耐力", english: "Stamina" },
  { chinese: "護盾", english: "Shield" },
  { chinese: "治療", english: "Healing" },
  { chinese: "恢復", english: "Recovery" },
  { chinese: "理智", english: "Sanity" },
  { chinese: "獵人標記", english: "Hunter's Mark" }
];

export function parseDeviationEffects(text: string | null): ParsedDeviationEffect[] {
  if (!text) return [];
  const effects: ParsedDeviationEffect[] = [];
  const valueRegex = /(\d+(?:\.\d+)?)\s*(%|公尺|秒|點|公尺\/秒)?/g;

  for (const matcher of effectMatchers) {
    const escaped = matcher.chinese.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const afterMatch = text.slice(m.index + m[0].length);
      const valueMatch = afterMatch.match(valueRegex);
      if (valueMatch) {
        const val = parseFloat(valueMatch[0]);
        const unit = valueMatch[0].includes("%") ? "%" : valueMatch[0].includes("公尺") ? "m" : valueMatch[0].includes("秒") ? "s" : valueMatch[0].includes("點") ? "pts" : null;
        effects.push({
          effectEnglish: matcher.english,
          value: val,
          unit,
          condition: null,
          rawText: text
        });
      }
    }
  }

  return deduplicateEffects(effects);
}

function deduplicateEffects(effects: ParsedDeviationEffect[]): ParsedDeviationEffect[] {
  const seen = new Set<string>();
  return effects.filter((e) => {
    const key = `${e.effectEnglish}:${e.value}:${e.unit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeDeviationRow(
  rowData: {
    nameOriginal: string;
    abilityOriginal: string | null;
    notesOriginal: string | null;
    sourceOriginal: string | null;
    categoryOriginal: string;
    scenarioEternalDream: string | null;
    scenarioSkyTouch: string | null;
    scenarioBranchPath: string | null;
    scenarioWayOfWinter: string | null;
  },
  originalRowNumber: number
): DeviationItem {
  const nameEnglish: string | null = nameTranslationMap[rowData.nameOriginal] ?? null;

  const hasVariantSep = rowData.nameOriginal.includes(" · ");
  let baseName, variantName;
  if (hasVariantSep) {
    const parts = rowData.nameOriginal.split(" · ");
    baseName = parts[1] || null;
    variantName = parts[0] || null;
  } else {
    baseName = null;
    variantName = null;
  }

  const isVariant = hasVariantSep;

  const devTypeEnglish = typeEnglishMap[rowData.categoryOriginal] || rowData.categoryOriginal;
  const combatRelevance = combatRelevanceMap[rowData.categoryOriginal] || "unknown";

  const { active, passive } = splitIntoActivePassive(rowData.abilityOriginal);
  const activeEnglishPartial = active ? partialTranslate(active) : null;
  const passiveEnglishPartial = passive ? partialTranslate(passive) : null;

  const traitName = extractTraitFromNotes(rowData.notesOriginal);
  const traitValue = extractTraitValue(rowData.notesOriginal);

  const allEffects = [rowData.abilityOriginal, rowData.notesOriginal].filter(Boolean).join(" ");
  const parsedEffects = parseDeviationEffects(allEffects || null);

  const scenarioSources: string[] = [];
  if (rowData.scenarioEternalDream) scenarioSources.push(rowData.scenarioEternalDream);
  if (rowData.scenarioSkyTouch) scenarioSources.push(rowData.scenarioSkyTouch);
  if (rowData.scenarioBranchPath) scenarioSources.push(rowData.scenarioBranchPath);
  if (rowData.scenarioWayOfWinter) scenarioSources.push(rowData.scenarioWayOfWinter);

  let sourceEnglish: string | null = null;
  if (rowData.sourceOriginal) {
    sourceEnglish = rowData.sourceOriginal
      .replace(/收容箱/g, "Containment Box")
      .replace(/收容設施/g, "Containment Facility")
      .replace(/裂隙空間/g, "Rift Space")
      .replace(/研究台/g, "Research Station")
      .replace(/製造/g, "Craft")
      .replace(/商人/g, "Merchant")
      .replace(/釣魚/g, "Fishing")
      .replace(/種植/g, "Farming")
      .replace(/挑戰商店/g, "Challenge Shop")
      .replace(/污染區/g, "Pollution Zone")
      .replace(/擊敗/g, "Defeat")
      .replace(/永眠者/g, "Eternal Slumber")
      .replace(/防守工坊/g, "Defense Workshop");
    if (sourceEnglish === rowData.sourceOriginal) sourceEnglish = null;
  }

  const reviewReasons: string[] = [];
  if (!nameEnglish) reviewReasons.push("missing_english_name");
  if (rowData.abilityOriginal && parsedEffects.length === 0 && rowData.sourceOriginal !== null) reviewReasons.push("no_effects_parsed");
  if (!rowData.abilityOriginal && !rowData.sourceOriginal) reviewReasons.push("minimal_data");

  const blockingReasons = reviewReasons.filter((r) => r !== "no_effects_parsed");
  const needsReview = blockingReasons.length > 0;

  const id = `deviation-${slugify(rowData.nameOriginal)}`;

  const notes: string[] = [];
  if (!nameEnglish) notes.push(`Name translation not available for "${rowData.nameOriginal}"`);
  if (reviewReasons.includes("no_effects_parsed")) notes.push("No structured effects parsed from ability text");

  const externalMatched = nameEnglish !== null;
  const externalEntry = !nameEnglish ? null : nameEnglish;

  return {
    sourceId: SOURCE_ID,
    sourceSheetOriginal: "異常物",
    sourceSheetEnglish: "Deviations",
    importedAt: new Date().toISOString(),
    confidence: "B_pending_verification",
    locked: false,
    originalRowNumber,
    original: {
      nameOriginal: rowData.nameOriginal,
      abilityOriginal: rowData.abilityOriginal,
      notesOriginal: rowData.notesOriginal,
      sourceOriginal: rowData.sourceOriginal,
      categoryOriginal: rowData.categoryOriginal,
      scenarioEternalDream: rowData.scenarioEternalDream,
      scenarioSkyTouch: rowData.scenarioSkyTouch,
      scenarioBranchPath: rowData.scenarioBranchPath,
      scenarioWayOfWinter: rowData.scenarioWayOfWinter
    },
    externalReference: {
      matched: externalMatched,
      matchConfidence: externalMatched ? "high" : "none",
      candidateEnglishName: externalEntry,
      candidateBaseName: null,
      candidateVariantName: null,
      iconUrl: null,
      needsReview: !externalMatched
    },
    normalized: {
      id,
      nameOriginal: rowData.nameOriginal,
      nameEnglish,
      baseNameEnglish: baseName ? (nameTranslationMap[baseName] ?? null) : null,
      variantNameEnglish: variantName ?? null,
      isVariant,
      deviationTypeOriginal: rowData.categoryOriginal,
      deviationTypeEnglish: devTypeEnglish,
      roleOriginal: rowData.abilityOriginal ? splitIntoActivePassive(rowData.abilityOriginal).active : null,
      roleEnglish: null,
      categoryOriginal: rowData.categoryOriginal,
      categoryEnglish: devTypeEnglish,
      combatRelevance,
      pveRelevance: null,
      pvpRelevance: null,
      activeEffectOriginal: active,
      activeEffectEnglish: null,
      activeEffectEnglishPartial: activeEnglishPartial,
      passiveEffectOriginal: passive,
      passiveEffectEnglish: null,
      passiveEffectEnglishPartial: passiveEnglishPartial,
      traitOriginal: traitName,
      traitEnglish: traitName ? partialTranslate(traitName) : null,
      sourceOriginal: rowData.sourceOriginal,
      sourceEnglish,
      scenarioRestrictionOriginal: scenarioSources.length > 0 ? scenarioSources.join("; ") : null,
      scenarioRestrictionEnglish: null,
      parsedEffects,
      needsReview,
      reviewReasons,
      notes
    }
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s·]+/g, "-")
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
    [/灼燒/g, "Burn"],
    [/寒霜元素異常傷害/g, "Frost Elemental Status DMG"],
    [/寒霜/g, "Frost"],
    [/冰霜/g, "Frost"],
    [/電離元素異常傷害/g, "Shock Elemental Status DMG"],
    [/電離/g, "Shock"],
    [/過載/g, "Power Surge"],
    [/彈射/g, "Bounce"],
    [/碎彈/g, "Shrapnel"],
    [/暴擊傷害/g, "Crit DMG"],
    [/暴擊率/g, "Crit Rate"],
    [/弱點傷害/g, "Weakspot DMG"],
    [/移動速度/g, "Movement Speed"],
    [/衝刺速度/g, "Sprint Speed"],
    [/換彈/g, "Reload"],
    [/冷卻時間/g, "Cooldown"],
    [/冷卻/g, "Cooldown"],
    [/持續時間/g, "Duration"],
    [/生命值/g, "HP"],
    [/最大生命/g, "Max HP"],
    [/耐力/g, "Stamina"],
    [/護盾/g, "Shield"],
    [/治療/g, "Heal"],
    [/恢復/g, "Recover"],
    [/理智值/g, "Sanity"],
    [/理智/g, "Sanity"],
    [/獵人標記/g, "Hunter's Mark"],
    [/異能評級/g, "Ability Rating"],
    [/活躍度/g, "Activity"],
    [/超感強度/g, "ESP Strength"],
    [/超越者/g, "Metahuman"],
    [/目標/g, "Target"],
    [/敵人/g, "Enemy"],
    [/怪物/g, "Monster"],
    [/友方/g, "Ally"],
    [/玩家/g, "Player"],
    [/召喚/g, "Summon"],
    [/釋放/g, "Release"],
    [/使用/g, "Use"],
    [/獲得/g, "Gain"],
    [/提升/g, "Increase"],
    [/提高/g, "Increase"],
    [/增加/g, "Increase"],
    [/減少/g, "Decrease"],
    [/降低/g, "Reduce"],
    [/造成/g, "Deal"],
    [/傷害/g, "DMG"],
    [/效果/g, "Effect"],
    [/範圍/g, "Range"],
    [/持續/g, "Duration"],
    [/敵人/g, "Enemy"],
    [/附近/g, "Nearby"],
    [/自身/g, "Self"],
    [/觸發/g, "Trigger"],
    [/強化/g, "Enhance"],
    [/星塵/g, "Stardust"],
    [/收容箱/g, "Containment Box"],
    [/收容設施/g, "Containment Facility"],
    [/裂隙空間/g, "Rift Space"],
    [/商人/g, "Merchant"],
    [/釣魚/g, "Fishing"],
    [/研究台/g, "Research Station"],
    [/製作/g, "Craft"],
    [/種植/g, "Farming"],
    [/擊敗/g, "Defeat"],
    [/永眠者/g, "Eternal Slumber"],
    [/防守工坊/g, "Defense Workshop"],
    [/挑戰商店/g, "Challenge Shop"],
    [/污染區/g, "Pollution Zone"],
    [/夢域/g, "Dream Zone"],
    [/青龍/g, "Azure Dragon"],
    [/胡桃夾子/g, "Nutcracker"],
    [/薑餅屋/g, "Gingerbread"],
    [/雪景球/g, "Snow Globe"],
    [/異維/g, "Extradimensional"],
    [/異色/g, "Rare Color"],
    [/白板/g, "Base"],
    [/聯動/g, "Collab"],
    [/活動/g, "Event"],
    [/明日之後/g, "LifeAfter"],
    [/幻獸帕魯/g, "Palworld"]
  ];
  for (const [pattern, replacement] of translations) {
    result = result.replace(pattern, replacement);
  }
  return result !== text ? result : null;
}

export { partialTranslate };
