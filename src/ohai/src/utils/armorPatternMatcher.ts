const ARMOR_EXACT_MAP: Record<string, string> = {
  "滑步長褲": "Glide Pants",
  "磁矩上衣": "Magnetic Moment Top",
};

const ARMOR_SERIES_MAP: Record<string, string> = {
  "黑石": "Blackstone",
  "孤狼": "Lonewolf",
  "叛客": "Renegade",
  "堡壘": "Fortress",
  "突襲": "Raid",
  "重裝": "Heavy Duty",
  "獵鷹": "Falcon",
  "引力潮汐": "Gravity Tide",
  "暗骸共鳴": "Dark Resonance",
  "末土危潮": "Treacherous Tides",
  "庇護者": "Shelterer",
  "拯救者": "Savior",
  "斥侯": "Scout",
  "爆破": "Blast",
  "特勤": "Tactical",
  "雪豹": "Snow Panther",
  "樸實": "Rustic",
  "飆風": "Stormweaver",
  "被研究者": "Test Subject",
  "老練獵手": "Old Huntsman",
  "寒霜戰術": "Frost Tactical",
  "硬質戰術": "Heavy Duty",
  "幹練皮衣": "Sleek Leather",
  "防毒": "Gas Mask",
  "防毒兜帽": "Gas Mask Hood",
  "防毒頭罩": "Gas Mask Hood",
  "漂流者": "Drifter",
  "老練": "Veteran",
  "鎏金": "Gilded",
  "火紋": "Fire Rune",
  "雪域迷彩": "Snow Camo",
  "元老": "Doyen",
  "隱密行者": "Covert Walker",
  "黃油漆": "Yellow Painted",
  "蜉蝣": "Mayfly",
  "超載電光": "Overload Spark",
  "磁矩": "Magnetic Moment",
  "散播者": "Spreader",
  "碎雪": "Snowdrift",
  "貝雷帽": "Beret",
  "戰術步履": "Tactical Combat",
  "牛仔靴": "Cowboy Boots",
  "皮革靴": "Leather Boots",
  "熱狗短褲": "Hot Dog Shorts",
  "血痕追跡": "Bloodstained Tracker",
  "踏地皮靴": "Pivot Step Leather",
  "迴轉踏步": "Pivot Step",
  "綠洲面罩": "Oasis Mask",
  "荒漠塵埃": "Desert Dust",
  "薩滿禿鷲": "Shaman Vulture",
  "精準射擊": "Precise Shot",
  "魔術扳機": "Magic Trigger",
  "爆裂前線": "Explosive Front",
  "利刃": "Sharp Blade",
  "刺舞": "Thorn Dance",
  "牢籠": "Cage",
};

const ARMOR_SLOT_MAP: Record<string, string> = {
  "上衣": "Top",
  "外套": "Jacket",
  "夾克": "Jacket",
  "罩衫": "Shirt",
  "馬甲": "Vest",
  "下衣": "Bottom",
  "長褲": "Pants",
  "外褲": "Pants",
  "褲子": "Pants",
  "短褲": "Shorts",
  "手套": "Gloves",
  "覆掌": "Gloves",
  "面罩": "Mask",
  "面具": "Mask",
  "面飾": "Facewear",
  "兜帽": "Hood",
  "頭罩": "Hood",
  "頭盔": "Helmet",
  "帽子": "Hat",
  "帽": "Hat",
  "鞋": "Shoes",
  "鞋子": "Shoes",
  "皮靴": "Boots",
  "靴": "Boots",
  "靴子": "Boots",
  "護目鏡": "Goggles",
  "斗篷": "Cloak",
};

export function matchArmorByPattern(chineseName: string | null | undefined): string | null {
  if (!chineseName) return null;

  if (ARMOR_EXACT_MAP[chineseName]) {
    return ARMOR_EXACT_MAP[chineseName];
  }

  for (const [chineseSeries, englishSeries] of Object.entries(ARMOR_SERIES_MAP)) {
    if (chineseName.includes(chineseSeries)) {
      for (const [chineseSlot, englishSlot] of Object.entries(ARMOR_SLOT_MAP)) {
        if (chineseName.includes(chineseSlot)) {
          return `${englishSeries} ${englishSlot}`;
        }
      }
      return englishSeries;
    }
  }

  return null;
}

export function getArmorSeriesCount(): number {
  return Object.keys(ARMOR_SERIES_MAP).length;
}

export function getArmorSlotCount(): number {
  return Object.keys(ARMOR_SLOT_MAP).length;
}
