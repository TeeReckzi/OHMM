export type RuntimeFormulaTreeName =
  | "damage_formula"
  | "cure_formula"
  | "building_damage_formula"
  | "vehicle_damage_formula"
  | "damage"
  | "building"
  | "vehicle"
  | "healing"
  | "unknown";

export type RuntimeFormulaAttackType =
  | "normal"
  | "melee"
  | "remote"
  | "buff"
  | "skill"
  | "dot"
  | "item"
  | "building"
  | "unknown";

export type RuntimeSubMeleeAttackType =
  | "any"
  | "front"
  | "backstab"
  | "heavy"
  | "light"
  | "combo"
  | "dash"
  | "unknown";

export type RuntimeDamageFeatureType =
  | "none"
  | "no_reset"
  | "cut"
  | "blunt"
  | "any"
  | "keyword"
  | "durative"
  | "direct"
  | "execute"
  | "anomaly"
  | "unknown";

export type RuntimeKeyword =
  | "BLAST"
  | "SCORCH"
  | "VORTEX"
  | "SURGE"
  | "SHRAP"
  | "PROJ"
  | "MARK"
  | "QUICK_DRAW"
  | "ARMED"
  | "NONE"
  | "UNKNOWN";

export type RuntimeKeywordTag = string;

export type RuntimeElementType =
  | "physical"
  | "blaze"
  | "frost"
  | "shock"
  | "blast"
  | "none"
  | "unknown";

export interface RuntimeFinalAttackRateDic {
  /** Generic final damage multiplier bucket, observed as final_attack_rate_dic.rate. */
  rate: number;
  /** Building/structure-specific final multiplier bucket. */
  buildingRate: number;
  /** Formula-attack-type-specific final multiplier bucket. */
  formulaTypeRate: number;
}

export interface RuntimeToughnessMetadata {
  extraToughnessDamageRate: number;
  ignoreWeakPartRate: boolean;
  weaknessToughnessDamageMultiplier?: number;
}

export interface RuntimeDamageSnapshotPolicy {
  /** Durative/high-frequency nodes can reuse the previous damage result instead of fully recalculating every tick. */
  reuseLastDamage: boolean;
  /** Durative damage can accumulate into an existing source instead of replacing it. */
  accumulateDamage: boolean;
  /** Seconds to reuse the previous node damage; zero means indefinitely in observed editor docs. */
  reuseLastTimeSeconds?: number;
}

export interface RuntimeAttackPayload {
  formulaTreeName: RuntimeFormulaTreeName;
  formulaAttackType: RuntimeFormulaAttackType;
  /** Recovered damage_formula branch selector: melee=1, buff/dot=2, skill=3, item=4, remote/normal=8. */
  formulaAttackTypeCode: number;
  subMeleeAttackType: RuntimeSubMeleeAttackType;
  damageFeatureType: RuntimeDamageFeatureType;
  elementType: RuntimeElementType;
  keyword: RuntimeKeyword;
  keywordTag: RuntimeKeywordTag;
  isKeywordDamage: boolean;
  isBuffDamage: boolean;
  useFinalDamageAddRate: boolean;
  useFinalIgnoreDamageRate: boolean;
  pvpDamageRate: number;
  structureAttackRate: number;
  vehicleAttackRate: number;
  distanceDamageRate: number;
  attackLevel: number;
  canJumpWord: boolean;
  forceJumpWord: boolean;
  jumpWordElementType: boolean;
  critAttack: boolean;
  weakAttack: boolean;
  finalAttackRateDic: RuntimeFinalAttackRateDic;
  toughness: RuntimeToughnessMetadata;
  snapshotPolicy?: RuntimeDamageSnapshotPolicy;
  sourceBehavior?: string;
  notes?: string;
}

export const DEFAULT_FINAL_ATTACK_RATE_DIC: RuntimeFinalAttackRateDic = {
  rate: 1,
  buildingRate: 1,
  formulaTypeRate: 1,
};

export function normalizeRuntimeFormulaTreeName(treeName: RuntimeFormulaTreeName): RuntimeFormulaTreeName {
  switch (treeName) {
    case "damage":
      return "damage_formula";
    case "building":
      return "building_damage_formula";
    case "vehicle":
      return "vehicle_damage_formula";
    case "healing":
      return "cure_formula";
    default:
      return treeName;
  }
}

export function mapRuntimeFormulaAttackTypeCode(formulaAttackType: RuntimeFormulaAttackType): number {
  switch (formulaAttackType) {
    case "melee":
      return 1;
    case "buff":
    case "dot":
      return 2;
    case "skill":
      return 3;
    case "item":
      return 4;
    case "normal":
    case "remote":
      return 8;
    case "building":
      return 7;
    case "unknown":
    default:
      return 0;
  }
}

export function createRuntimeAttackPayload(
  overrides: Partial<RuntimeAttackPayload> = {}
): RuntimeAttackPayload {
  const {
    finalAttackRateDic: overrideFARDic,
    toughness: overrideToughness,
    formulaTreeName: overrideFormulaTreeName,
    formulaAttackType: overrideFormulaAttackType,
    formulaAttackTypeCode: overrideFormulaAttackTypeCode,
    ...restOverrides
  } = overrides;

  const formulaAttackType = overrideFormulaAttackType ?? "skill";

  return {
    formulaTreeName: normalizeRuntimeFormulaTreeName(overrideFormulaTreeName ?? "damage_formula"),
    formulaAttackType,
    formulaAttackTypeCode: overrideFormulaAttackTypeCode ?? mapRuntimeFormulaAttackTypeCode(formulaAttackType),
    subMeleeAttackType: "any",
    damageFeatureType: "none",
    elementType: "unknown",
    keyword: "NONE",
    keywordTag: "",
    isKeywordDamage: false,
    isBuffDamage: false,
    useFinalDamageAddRate: true,
    useFinalIgnoreDamageRate: true,
    pvpDamageRate: 1,
    structureAttackRate: 1,
    vehicleAttackRate: 1,
    distanceDamageRate: 1,
    attackLevel: 1,
    canJumpWord: true,
    forceJumpWord: false,
    jumpWordElementType: false,
    critAttack: false,
    weakAttack: false,
    ...restOverrides,
    finalAttackRateDic: {
      ...DEFAULT_FINAL_ATTACK_RATE_DIC,
      ...(overrideFARDic ?? {}),
    },
    toughness: {
      extraToughnessDamageRate: 1,
      ignoreWeakPartRate: false,
      ...(overrideToughness ?? {}),
    },
  };
}

export function computeRuntimeFinalMultiplier(payload: RuntimeAttackPayload): number {
  const finalRates = payload.finalAttackRateDic;
  const addRate = payload.useFinalDamageAddRate ? finalRates.rate : 1;
  const formulaRate = payload.useFinalDamageAddRate ? finalRates.formulaTypeRate : 1;
  const structureRate = payload.structureAttackRate;
  const vehicleRate = payload.vehicleAttackRate;
  const pvpRate = payload.pvpDamageRate;
  const distanceRate = payload.distanceDamageRate;

  return addRate * formulaRate * structureRate * vehicleRate * pvpRate * distanceRate;
}

export function runtimeKeywordForMechanic(mechanicId: string): RuntimeKeyword {
  const key = mechanicId.toLowerCase();
  if (key.includes("burn") || key.includes("scorch")) return "SCORCH";
  if (key.includes("frost") || key.includes("vortex")) return "VORTEX";
  if (key.includes("surge") || key.includes("power")) return "SURGE";
  if (key.includes("shrap")) return "SHRAP";
  if (key.includes("blast") || key.includes("bomb")) return "BLAST";
  if (key.includes("mark")) return "MARK";
  if (key.includes("proj") || key.includes("projectile")) return "PROJ";
  return "NONE";
}
