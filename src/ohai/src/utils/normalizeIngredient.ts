import type { IngredientItem } from "../schemas/ingredientSchema";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";

const nameTranslationMap: Record<string, string> = {
  "桔梗": "Platycodon",
  "血菖蒲": "Blood Iris",
  "紫錐菊": "Echinacea",
  "金銀花": "Honeysuckle",
  "鼠尾草": "Sage",
  "黃蓮花": "Yellow Lotus",
  "番紅花": "Saffron",
  "蘆薈": "Aloe",
  "菖蒲梗": "Calamus Stem",
  "紫錐梗": "Echinacea Stem",
  "金銀梗": "Honeysuckle Stem",
  "鼠尾梗": "Sage Stem",
  "蓮花梗": "Lotus Stem",
  "紅花梗": "Saffron Stem",
  "桔梗薈": "Platycodon Aloe",
  "紫錐蒲": "Echinacea Iris",
  "金銀蒲": "Honeysuckle Iris",
  "鼠尾蒲": "Sage Iris",
  "菖蒲蓮": "Calamus Lotus",
  "血蘆薈": "Blood Aloe",
  "鼠尾蓮花": "Sage Lotus",
  "普通肉": "Normal Meat",
  "精品肉": "Premium Meat",
  "熊肉": "Bear Meat",
  "精品熊肉": "Premium Bear Meat",
  "豬肉": "Pork",
  "精品豬肉": "Premium Pork",
  "兔肉": "Rabbit Meat",
  "精品兔肉": "Premium Rabbit Meat",
  "鱷魚肉": "Gator Meat",
  "精品鱷魚肉": "Premium Gator Meat",
  "鱷龜肉": "Snapping Turtle Meat",
  "精品鱷龜肉": "Premium Snapping Turtle Meat",
  "牛肉": "Beef",
  "精品牛肉": "Premium Beef",
  "霜降牛肉": "Marbled Beef",
  "鹿肉": "Venison",
  "精品鹿肉": "Premium Venison",
  "羊肉": "Mutton",
  "精品羊肉": "Premium Mutton",
  "鯉魚": "Carp",
  "鮭魚": "Salmon",
  "羅非魚": "Tilapia",
  "鯰魚": "Catfish",
  "狗魚": "Pike",
  "鱸魚": "Bass",
  "河豚": "Pufferfish",
  "比目魚": "Flounder",
  "金槍魚": "Tuna",
  "帶魚": "Ribbon Fish",
  "鮁魚": "Mackerel",
  "多寶魚": "Turbot",
  "鱒魚": "Trout",
  "鱈魚": "Cod",
  "秋刀魚": "Saury",
  "小龍蝦": "Crayfish",
  "螃蟹": "Crab",
  "蛤蜊": "Clam",
  "貝類": "Shellfish",
  "鮑魚": "Abalone",
  "海參": "Sea Cucumber",
  "龍蝦": "Lobster",
  "生蠔": "Oyster",
  "魚子醬": "Caviar",
  "鹽": "Salt",
  "糖": "Sugar",
  "胡椒": "Pepper",
  "變異胡椒": "Mutated Pepper",
  "蜂蜜": "Honey",
  "香料": "Spice",
  "黃油": "Butter",
  "奶油": "Cream",
  "起司": "Cheese",
  "星塵起司": "Stardust Cheese",
  "花生": "Peanut",
  "花生醬": "Peanut Butter",
  "辣椒": "Chili Pepper",
  "普通蛋": "Normal Egg",
  "精品蛋": "Premium Egg",
  "星塵蛋": "Stardust Egg",
  "普通奶": "Normal Milk",
  "精品奶": "Premium Milk",
  "星塵奶": "Stardust Milk",
  "羊奶": "Goat Milk",
  "純水": "Pure Water",
  "髒水": "Dirty Water",
  "海水": "Seawater",
  "冰塊": "Ice",
  "冰山水": "Glacial Water",
  "蘋果": "Apple",
  "香蕉": "Banana",
  "葡萄": "Grape",
  "椰子": "Coconut",
  "橘子": "Orange",
  "寒冰瓜": "Icemelon",
  "火刺果": "Firethorn Fruit",
  "紅色漿果": "Red Berry",
  "藍莓": "Blueberry",
  "草莓": "Strawberry",
  "小麥": "Wheat",
  "玉米": "Corn",
  "南瓜": "Pumpkin",
  "馬鈴薯": "Potato",
  "番茄": "Tomato",
  "洋蔥": "Onion",
  "黃瓜": "Cucumber",
  "高麗菜": "Cabbage",
  "甜菜": "Beet",
  "蘑菇": "Mushroom",
  "羊肚菌": "Morel",
  "草藥": "Herb",
  "變異草藥": "Mutated Herb",
  "變異玉米": "Mutated Corn",
  "變異南瓜": "Mutated Pumpkin",
  "變異馬鈴薯": "Mutated Potato",
  "變異番茄": "Mutated Tomato",
  "變異洋蔥": "Mutated Onion",
  "變異黃瓜": "Mutated Cucumber",
  "變異高麗菜": "Mutated Cabbage",
  "變異甜菜": "Mutated Beet",
  "變異蘑菇": "Mutated Mushroom",
  "變異小麥": "Mutated Wheat",
  "變異羊肚菌": "Mutated Morel",
  "變異蘆薈": "Mutated Aloe",
  "變異番紅花": "Mutated Saffron",
  "變異鼠尾草": "Mutated Sage",
  "變異金銀花": "Mutated Honeysuckle",
  "變異紫錐菊": "Mutated Echinacea",
  "變異血菖蒲": "Mutated Blood Iris",
  "極地椒": "Polar Pepper",
  "雪茸": "Snow Fungus",
  "大成功增益": "Critical Success Bonus",
  "罐頭": "Canned Food",
  "仙人掌": "Cactus",
  "生肉": "Raw Meat",
  "龜肉": "Turtle Meat",
  "禽肉": "Poultry",
  "獸肉": "Game Meat",
  "精品龜肉": "Premium Turtle Meat",
  "精品禽肉": "Premium Poultry",
  "精品獸肉": "Premium Game Meat",
  "玉米油": "Corn Oil",
  "岩鹽": "Rock Salt",
  "星塵岩鹽": "Stardust Rock Salt",
  "醃黃瓜": "Pickled Cucumber",
  "松子": "Pine Nut",
  "橡果": "Acorn",
  "松露": "Truffle",
  "夢幻松露": "Dream Truffle",
  "龜蛋": "Turtle Egg",
  "鱷魚蛋": "Gator Egg",
  "鷹鷺蛋": "Heron Egg",
  "鳥蛋": "Bird Egg",
  "魚子": "Fish Roe",
  "甘露蜂蜜": "Nectar Honey",
  "鹿奶": "Deer Milk",
  "牛奶": "Cow Milk",
  "精品羊奶": "Premium Goat Milk",
  "精品鹿奶": "Premium Deer Milk",
  "精品牛奶": "Premium Cow Milk",
  "星塵羊奶": "Stardust Goat Milk",
  "星塵鹿奶": "Stardust Deer Milk",
  "星塵牛奶": "Stardust Cow Milk",
  "汙染水源": "Contaminated Water",
  "白開水": "Boiled Water",
  "汙染漿果": "Contaminated Berry",
  "汙染小麥": "Contaminated Wheat",
  "海草": "Seaweed",
  "陽薑": "Sun Ginger",
  "薄荷": "Mint",
  "變異陽薑": "Mutated Sun Ginger",
  "變異火刺果": "Mutated Firethorn Fruit",
  "變異極地椒": "Mutated Polar Pepper",
  "變異薄荷": "Mutated Mint",
  "變異雪茸": "Mutated Snow Fungus",
  "變異寒冰瓜": "Mutated Icemelon",
  "鋼錠": "Steel Ingot",
  "鋁錠": "Aluminum Ingot",
  "槍械強化": "Weapon Enhancement",
  "暴傷強化": "Crit DMG Enhancement",
  "弱點強化": "Weakspot Enhancement",
  "異常強化": "Status Enhancement",
  "生命強化": "HP Enhancement",
  "負重強化": "Weight Enhancement",
  "耐力強化": "Stamina Enhancement",
  "減少傷害強化": "DMG Reduction Enhancement",
  "元素強化": "Elemental Enhancement",
  "負面強化": "Debuff Enhancement",
  "首領壓制": "Boss Suppression",
  "異常槍械": "Status Weapon"
};

const typeCategoryEnglishMap: Record<string, string> = {
  "草藥": "Herb",
  "肉": "Meat",
  "魚": "Fish",
  "調料": "Seasoning",
  "蛋": "Egg",
  "奶": "Dairy",
  "水": "Water",
  "水果": "Fruit",
  "蔬菜": "Vegetable",
  "罐頭": "Canned",
  "大成功增益": "Critical Success Bonus"
};

export function normalizeIngredientRow(
  rowData: {
    categoryOriginal: string;
    nameOriginal: string;
    effectOriginal: string | null;
    effectPowerOriginal: string | null;
    effectDurationOriginal: string | null;
    notesOriginal: string | null;
    baseSatiety: number | null;
    baseHydration: number | null;
    baseSanity: number | null;
    durabilityHours: number | null;
    originalRowNumber: number;
  }
): IngredientItem {
  const nameEnglish: string | null = nameTranslationMap[rowData.nameOriginal] ?? null;
  const categoryEnglish = typeCategoryEnglishMap[rowData.categoryOriginal] || rowData.categoryOriginal;

  const isDeviated = rowData.nameOriginal.includes("變異");
  const isGrafted = rowData.nameOriginal.includes("嫁接");
  const isContaminated = rowData.nameOriginal.includes("污染");

  const cat = rowData.categoryOriginal;
  const isMeat = cat === "肉";
  const isFish = cat === "魚";
  const isDairy = cat === "奶";
  const isEgg = cat === "蛋";
  const isSeasoning = cat === "調料";
  const isHerb = cat === "草藥";
  const isCrop = cat === "蔬菜" || cat === "水果" || cat === "草藥";
  const isFoodItem = !isWaterLike(rowData.nameOriginal);
  const isDrinkItem = false;

  const effectEnglishPartial = rowData.effectOriginal ? partialTranslate(rowData.effectOriginal) : null;

  const reviewReasons: string[] = [];
  if (!nameEnglish) reviewReasons.push("missing_english_name");

  const blockingReasons = reviewReasons.filter(() => true);
  const needsReview = blockingReasons.length > 0;

  const id = `ingredient-${slugify(rowData.nameOriginal)}-${slugify(rowData.categoryOriginal)}-${rowData.originalRowNumber}`;

  const notes: string[] = [];
  if (!nameEnglish) notes.push(`Name translation not available for "${rowData.nameOriginal}"`);
  if (rowData.notesOriginal) notes.push(String(rowData.notesOriginal));

  return {
    sourceId: SOURCE_ID,
    sourceSheetOriginal: "食材",
    sourceSheetEnglish: "Ingredients",
    importedAt: new Date().toISOString(),
    confidence: "B_pending_verification",
    locked: false,
    originalRowNumber: rowData.originalRowNumber,
    original: {
      categoryOriginal: rowData.categoryOriginal,
      nameOriginal: rowData.nameOriginal,
      effectOriginal: rowData.effectOriginal,
      effectPowerOriginal: rowData.effectPowerOriginal,
      effectDurationOriginal: rowData.effectDurationOriginal,
      notesOriginal: rowData.notesOriginal,
      baseSatiety: rowData.baseSatiety,
      baseHydration: rowData.baseHydration,
      baseSanity: rowData.baseSanity,
      durabilityHours: rowData.durabilityHours
    },
    externalReference: {
      matched: nameEnglish !== null,
      matchConfidence: nameEnglish ? "high" : "none",
      candidateEnglishName: nameEnglish,
      iconUrl: null,
      needsReview: !nameEnglish
    },
    normalized: {
      id,
      nameOriginal: rowData.nameOriginal,
      nameEnglish,
      ingredientTypeOriginal: rowData.categoryOriginal,
      ingredientTypeEnglish: categoryEnglish,
      categoryOriginal: rowData.categoryOriginal,
      categoryEnglish,
      effectOriginal: rowData.effectOriginal,
      effectEnglishPartial,
      effectPowerOriginal: rowData.effectPowerOriginal,
      effectDurationOriginal: rowData.effectDurationOriginal,
      baseSatiety: rowData.baseSatiety,
      baseHydration: rowData.baseHydration,
      baseSanity: rowData.baseSanity,
      durabilityHours: rowData.durabilityHours,
      isFoodItem,
      isDrinkItem,
      isCrop,
      isMeat,
      isFish,
      isDairy,
      isEgg,
      isSeasoning,
      isHerb,
      isDeviated,
      isContaminated,
      isGrafted,
      needsReview,
      reviewReasons,
      notes
    }
  };
}

function isWaterLike(name: string): boolean {
  const waters = ["純水", "髒水", "海水", "冰塊", "冰山水"];
  return waters.includes(name);
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
    [/衝刺速度/g, "Sprint Speed"],
    [/翻滾速度/g, "Roll Speed"],
    [/滑翔水平速度/g, "Glide Speed"],
    [/游泳速度/g, "Swim Speed"],
    [/移動速度/g, "Movement Speed"],
    [/耐力上限/g, "Max Stamina"],
    [/暴擊傷害/g, "Crit DMG"],
    [/冰霜漩渦/g, "Frost Vortex"],
    [/灼燒傷害/g, "Burn DMG"],
    [/碎彈傷害/g, "Shrapnel DMG"],
    [/弱點傷害/g, "Weakspot DMG"],
    [/元素傷害/g, "Elemental DMG"],
    [/近戰傷害/g, "Melee DMG"],
    [/槍械傷害/g, "Weapon DMG"],
    [/對/g, "Against"],
    [/處於/g, "While"],
    [/狀態/g, "State"],
    [/異常/g, "Status"],
    [/效果/g, "Effect"],
    [/目標/g, "Target"],
    [/自身/g, "Self"],
    [/提升/g, "Increase"],
    [/提高/g, "Increase"],
    [/增加/g, "Increase"],
    [/減少/g, "Decrease"],
    [/降低/g, "Reduce"],
    [/傷害/g, "DMG"],
    [/傷害/g, "DMG"],
    [/抗性/g, "Resist"],
    [/寒冷/g, "Cold"],
    [/炎熱/g, "Heat"],
    [/經驗值/g, "EXP"],
    [/戰鬥/g, "Combat"],
    [/體型/g, "Body Size"],
    [/變胖/g, "Become Fat"],
    [/變異/g, "Mutated"],
    [/普通/g, "Normal"],
    [/精品/g, "Premium"],
    [/星塵/g, "Stardust"],
    [/雪茸/g, "Snow Fungus"],
    [/極地/g, "Polar"]
  ];
  for (const [pattern, replacement] of translations) {
    result = result.replace(pattern, replacement);
  }
  return result !== text ? result : null;
}

export { partialTranslate };
