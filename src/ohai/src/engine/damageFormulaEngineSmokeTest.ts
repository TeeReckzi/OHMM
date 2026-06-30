import {
  BucketId,
  DamageTrait,
  EnemyType,
  FlagType,
  KeywordType,
  StatType,
  evaluateDamageFormula,
  resolveScenarioScan,
} from "./damageFormulaEngine";
import {
  chooseKeywordDamageFormulaId,
  getDamageFormulaDefinition,
  getKeywordMetadata,
} from "./damageFormulaRegistry";

let PASS = 0;
let FAIL = 0;

function assertEq(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) < 0.000001) PASS++;
  else {
    FAIL++;
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  }
}

function assert(condition: boolean, label: string) {
  if (condition) PASS++;
  else {
    FAIL++;
    console.error(`FAIL ${label}`);
  }
}

const powerSurge113 = evaluateDamageFormula(
  getDamageFormulaDefinition("keyword_psi_scaled_damage"),
  {
    keyword: KeywordType.PowerSurge,
    keywordIntrinsicScaling: 0.5,
    psiIntensity: 267,
    stats: {
      [StatType.PowerSurgeDamageFactor]: -15,
    },
  },
);
assertEq(powerSurge113.baseDamage, 133.5, "113 Test base uses Psi Intensity times intrinsic scaling");
assertEq(powerSurge113.damage, 113.475, "113 Test applies Factor/Coefficient in one additive bucket");
assert(
  powerSurge113.buckets.some((bucket) => bucket.id === BucketId.PowerSurgeFactor && bucket.sumPercent === -15 && bucket.value === 0.85),
  "Power Surge factor bucket carries the combined factor/coefficient sum",
);

const elemental = evaluateDamageFormula(
  getDamageFormulaDefinition(chooseKeywordDamageFormulaId({ isElemental: true })),
  {
    keyword: KeywordType.PowerSurge,
    keywordIntrinsicScaling: 0.35,
    psiIntensity: 200,
    bonuses: {
      elementalDMG: 0.2,
      keywordDMGFactor: 0.1,
      keywordFinalDMG: 0.15,
      finalDMG: 0.05,
    },
  },
);
assertEq(elemental.baseDamage, 70, "elemental keyword scales from Psi Intensity");
assertEq(elemental.damage, 70 * 1.2 * 1.1 * 1.15 * 1.05, "elemental keyword applies canonical bucket product");

const nonElemental = evaluateDamageFormula(
  getDamageFormulaDefinition(chooseKeywordDamageFormulaId({ isElemental: false })),
  {
    keyword: KeywordType.Shrapnel,
    keywordIntrinsicScaling: 0.5,
    attackDMG: 120,
    psiIntensity: 999,
  },
);
assertEq(nonElemental.baseDamage, 60, "non-elemental keyword scales from Attack DMG");

const burnCrit = evaluateDamageFormula(
  getDamageFormulaDefinition("keyword_psi_scaled_damage"),
  {
    keyword: KeywordType.Burn,
    keywordIntrinsicScaling: 1,
    psiIntensity: 100,
    flags: {
      [FlagType.KeywordCanCrit]: true,
      wasBurnCrit: true,
    },
    stats: {
      [StatType.ElementalDamagePercent]: 30,
      [StatType.StatusDamagePercent]: 40,
      [StatType.KeywordCritDamagePercent]: 50,
    },
  },
);
assertEq(burnCrit.damage, 100 * 1.3 * 1.4 * 1.5, "Burn keyword crit uses elemental, status, and keyword crit buckets");

const critWeakspot = evaluateDamageFormula(
  getDamageFormulaDefinition("weapon_attack_damage"),
  {
    attackDMG: 100,
    flags: { wasCrit: true, wasWeakspot: true },
    stats: {
      [StatType.CritDamagePercent]: 50,
      [StatType.WeakspotDamagePercent]: 60,
    },
  },
);
assertEq(critWeakspot.damage, 210, "Crit DMG and Weakspot DMG are additive in Hit Amplifier");

const fatefulStrikeNoWeakspot = evaluateDamageFormula(
  getDamageFormulaDefinition("weapon_attack_damage"),
  {
    attackDMG: 100,
    flags: {
      wasWeakspot: true,
      [FlagType.CannotDealWeakspotDamage]: true,
    },
    stats: {
      [StatType.WeakspotDamagePercent]: 60,
    },
  },
);
assertEq(fatefulStrikeNoWeakspot.damage, 100, "CannotDealWeakspotDamage suppresses weakspot amplifier");

const scenario = resolveScenarioScan(
  getDamageFormulaDefinition("weapon_attack_damage"),
  {
    attackDMG: 100,
    stats: {
      [StatType.CritRatePercent]: 50,
      [StatType.WeakspotHitRatePercent]: 25,
      [StatType.CritDamagePercent]: 50,
      [StatType.WeakspotDamagePercent]: 60,
    },
  },
);
assertEq(scenario.expectedDamage, 100 * (1 + 0.5 * 0.5 + 0.25 * 0.6), "scenario scan weights additive hit amplifier outcomes");

assertEq(getKeywordMetadata(KeywordType.Burn).scalingFactor ?? 0, 0.12, "Burn metadata repopulated from archive");
assertEq(getKeywordMetadata(KeywordType.PowerSurge).scalingFactor ?? 0, 1, "Power Surge metadata repopulated from archive");
assert(
  getKeywordMetadata(KeywordType.Shrapnel).defaultTraits.includes(DamageTrait.Weapon),
  "Shrapnel metadata carries non-elemental weapon trait",
);
assert(
  elemental.buckets.some((bucket) => bucket.id === BucketId.TargetNormal && bucket.value === 1),
  "inactive target buckets resolve to neutral multiplier",
);
assert(
  evaluateDamageFormula(getDamageFormulaDefinition("weapon_attack_damage"), {
    attackDMG: 100,
    targetType: EnemyType.Boss,
    bonuses: { enemyTypeDMG: 0.2 },
  }).buckets.some((bucket) => bucket.id === BucketId.TargetBoss && bucket.value === 1.2),
  "enemy type bonus maps into the matching target bucket",
);

console.log(`Damage Formula Engine Smoke Test: ${PASS}/${PASS + FAIL} passed`);
if (FAIL > 0) process.exit(1);
