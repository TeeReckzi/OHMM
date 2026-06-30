export type DamageSourceCategory =
  | "weapon"
  | "elemental"
  | "status"
  | "keyword"
  | "crit"
  | "weakspot"
  | "target"
  | "final"
  | "ultimate";

export type DamageFormulaId =
  | "weapon_attack_damage"
  | "keyword_attack_scaled_damage"
  | "keyword_psi_scaled_damage";

export enum KeywordType {
  Burn = "burn",
  FrostVortex = "frost_vortex",
  PowerSurge = "power_surge",
  Shrapnel = "shrapnel",
  FastGunner = "fast_gunner",
  UnstableBomber = "unstable_bomber",
  BullsEye = "bulls_eye",
  FortressWarfare = "fortress_warfare",
  Bounce = "bounce",
}

export enum DamageTrait {
  Weapon = "weapon",
  Attack = "attack",
  Status = "status",
  Elemental = "elemental",
  Explosive = "explosive",
  Melee = "melee",
  Burn = "burn",
  FrostVortex = "frost_vortex",
  PowerSurge = "power_surge",
  Shrapnel = "shrapnel",
  UnstableBomber = "unstable_bomber",
  Bounce = "bounce",
  FastGunner = "fast_gunner",
  BullsEye = "bulls_eye",
}

export enum EnemyType {
  Normal = "normal",
  Elite = "elite",
  Boss = "boss",
}

export enum ElementType {
  Blaze = "blaze",
  Frost = "frost",
  Shock = "shock",
  Blast = "blast",
}

export enum FlagType {
  InfiniteAmmo = "infinite_ammo",
  CannotDealWeakspotDamage = "cannot_deal_weakspot_damage",
  KeywordCanCrit = "keyword_can_crit",
  KeywordCanWeakspot = "keyword_can_weakspot",
}

export enum StatType {
  DamagePerProjectile = "damage_per_projectile",
  ProjectilesPerShot = "projectiles_per_shot",
  FireRate = "fire_rate",
  CritRatePercent = "crit_rate_percent",
  MagazineCapacity = "magazine_capacity",
  ReloadSpeedPercent = "reload_speed_percent",
  AttackPercent = "attack_percent",
  KeywordCritRatePercent = "keyword_crit_rate_percent",
  KeywordCritDamagePercent = "keyword_crit_damage_percent",
  KeywordTriggerChancePercent = "keyword_trigger_chance_percent",
  KeywordTriggerHitCount = "keyword_trigger_hit_count",
  WeaponDamagePercent = "weapon_damage_percent",
  StatusDamagePercent = "status_damage_percent",
  ElementalDamagePercent = "elemental_damage_percent",
  VulnerabilityPercent = "vulnerability_percent",
  CritDamagePercent = "crit_damage_percent",
  WeakspotDamagePercent = "weakspot_damage_percent",
  WeakspotHitRatePercent = "weakspot_hit_rate_percent",
  DamageBonusNormal = "damage_bonus_normal",
  DamageBonusElite = "damage_bonus_elite",
  DamageBonusBoss = "damage_bonus_boss",
  PsiIntensity = "psi_intensity",
  BurnDamageFactor = "burn_dmg_factor",
  FrostVortexDamageFactor = "frost_vortex_dmg_factor",
  PowerSurgeDamageFactor = "power_surge_dmg_factor",
  ShrapnelDamageFactor = "shrapnel_dmg_factor",
  UnstableBomberDamageFactor = "unstable_bomber_dmg_factor",
  BounceDamageFactor = "bounce_dmg_factor",
  BurnFinalDamage = "burn_final_dmg",
  FrostVortexFinalDamage = "frost_vortex_final_dmg",
  PowerSurgeFinalDamage = "power_surge_final_dmg",
  ShrapnelFinalDamage = "shrapnel_final_dmg",
  UnstableBomberFinalDamage = "unstable_bomber_final_dmg",
  BounceFinalDamage = "bounce_final_dmg",
  FinalDamage = "final_damage",
  MaxBurnStacks = "max_burn_stacks",
  BurnDurationPercent = "burn_duration_percent",
  BurnFrequencyPercent = "burn_frequency_percent",
}

export enum BucketId {
  WeaponDamage = "weapon_damage",
  ElementalDamage = "elemental_damage",
  StatusDamage = "status_damage",
  AttackPercent = "attack_percent",
  PsiIncrease = "psi_increase",
  BurnFactor = "burn_factor",
  FrostVortexFactor = "frost_vortex_factor",
  PowerSurgeFactor = "power_surge_factor",
  ShrapnelFactor = "shrapnel_factor",
  UnstableBomberFactor = "unstable_bomber_factor",
  BounceFactor = "bounce_factor",
  BurnFinal = "burn_final",
  FrostVortexFinal = "frost_vortex_final",
  PowerSurgeFinal = "power_surge_final",
  ShrapnelFinal = "shrapnel_final",
  UnstableBomberFinal = "unstable_bomber_final",
  BounceFinal = "bounce_final",
  HitAmplifier = "hit_amplifier",
  TargetNormal = "target_normal",
  TargetElite = "target_elite",
  TargetBoss = "target_boss",
  Vulnerability = "vulnerability",
  FinalDamage = "final_damage",
}

export enum ConditionType {
  Always = "always",
  TraitMatches = "trait_matches",
  KeywordMatches = "keyword_matches",
  ElementMatches = "element_matches",
  TargetTypeMatches = "target_type_matches",
  KeywordCritUnlocked = "keyword_crit_unlocked",
  FlagActive = "flag_active",
  Comparison = "comparison",
  And = "and",
  Or = "or",
  Not = "not",
}

export type ContextFlag =
  | FlagType
  | "wasCrit"
  | "wasWeakspot"
  | "wasBurnCrit"
  | "isShielded"
  | "isFirstHalfOfMag";

export type ComparisonOperator = ">" | "<" | ">=" | "<=" | "==";

export type ContributionCondition =
  | { readonly type: ConditionType.Always }
  | { readonly type: ConditionType.TraitMatches; readonly trait: DamageTrait }
  | { readonly type: ConditionType.KeywordMatches; readonly keyword: KeywordType }
  | { readonly type: ConditionType.ElementMatches; readonly element: ElementType }
  | { readonly type: ConditionType.TargetTypeMatches; readonly targetType: EnemyType }
  | { readonly type: ConditionType.KeywordCritUnlocked; readonly keyword: KeywordType }
  | { readonly type: ConditionType.FlagActive; readonly flag: ContextFlag }
  | { readonly type: ConditionType.Comparison; readonly stat: StatType; readonly operator: ComparisonOperator; readonly value: number }
  | { readonly type: ConditionType.And; readonly conditions: readonly ContributionCondition[] }
  | { readonly type: ConditionType.Or; readonly conditions: readonly ContributionCondition[] }
  | { readonly type: ConditionType.Not; readonly condition: ContributionCondition };

export interface ContributorDef {
  readonly stat: StatType;
  readonly condition: ContributionCondition;
  readonly label?: string;
}

export interface BucketDef {
  readonly id: BucketId;
  readonly label: string;
  readonly source: DamageSourceCategory;
  readonly contributors: readonly ContributorDef[];
}

export interface RollDefinition {
  readonly id: string;
  readonly rateContributors: readonly ContributorDef[];
  readonly resultFlag: ContextFlag;
}

export interface StatContribution {
  readonly source: string;
  readonly value: number;
  readonly note?: string;
}

export interface ResolutionContext {
  readonly traits: ReadonlySet<DamageTrait>;
  readonly keywords: ReadonlySet<KeywordType>;
  readonly elements: ReadonlySet<ElementType>;
  readonly targetType: EnemyType;
  readonly flags: ReadonlyMap<ContextFlag, boolean>;
  readonly unlockedKeywordCrits: ReadonlySet<KeywordType>;
  readonly statValues: ReadonlyMap<StatType, number>;
  readonly statContributions?: ReadonlyMap<StatType, readonly StatContribution[]>;
}

export interface BucketResolution {
  readonly id: BucketId;
  readonly label: string;
  readonly source: DamageSourceCategory;
  readonly sumPercent: number;
  readonly multiplier: number;
  readonly contributors: readonly DamageContributorResult[];
  readonly active: boolean;
}

export interface ResolutionTrace {
  readonly baseDamage: number;
  readonly intrinsicScaling: number;
  readonly scaledBaseDamage: number;
  readonly buckets: readonly BucketResolution[];
  readonly finalDamage: number;
  readonly product: number;
}

export interface KeywordMetadata {
  readonly type: KeywordType;
  readonly label: string;
  readonly scalingFactor?: number;
  readonly baseStatType?: StatType;
  readonly baseTriggerChance: number;
  readonly canCrit: boolean;
  readonly canWeakspot: boolean;
  readonly defaultTraits: readonly DamageTrait[];
}

export type NumericExpression =
  | { kind: "literal"; value: number }
  | { kind: "input"; path: string; defaultValue?: number }
  | { kind: "add"; terms: readonly NumericExpression[] }
  | { kind: "multiply"; factors: readonly NumericExpression[] }
  | { kind: "max"; terms: readonly NumericExpression[] }
  | { kind: "select"; cases: readonly NumericSelectCase[]; default: NumericExpression };

export interface NumericSelectCase {
  when: ConditionExpression;
  value: NumericExpression;
}

export type ConditionExpression =
  | { kind: "always" }
  | { kind: "eq"; path: string; value: string | number | boolean }
  | { kind: "in"; path: string; values: readonly (string | number | boolean)[] }
  | { kind: "gt" | "gte" | "lt" | "lte"; path: string; value: number }
  | { kind: "truthy"; path: string }
  | { kind: "all"; conditions: readonly ConditionExpression[] }
  | { kind: "any"; conditions: readonly ConditionExpression[] }
  | { kind: "not"; condition: ConditionExpression };

export interface DamageContributorDefinition {
  id: string;
  label: string;
  source: DamageSourceCategory;
  expression: NumericExpression;
  condition?: ConditionExpression;
}

export type DamageBucketAggregation = "product" | "sum_as_multiplier";

export interface DamageBucketDefinition {
  id: string;
  label: string;
  source: DamageSourceCategory;
  aggregation: DamageBucketAggregation;
  contributors: readonly DamageContributorDefinition[];
  condition?: ConditionExpression;
}

export interface DamageFormulaDefinition {
  id: DamageFormulaId;
  label: string;
  baseDamage: NumericExpression;
  buckets?: readonly DamageBucketDefinition[];
  resolutionBuckets?: readonly BucketDef[];
  defaultTraits?: readonly DamageTrait[];
  defaultKeyword?: KeywordType;
}

export interface DamageFormulaContext {
  [key: string]: unknown;
}

export interface DamageContributorResult {
  bucketId: string;
  contributorId: string;
  label: string;
  source: DamageSourceCategory;
  value: number;
  active: boolean;
}

export interface DamageBucketResult {
  id: string;
  label: string;
  source: DamageSourceCategory;
  aggregation: DamageBucketAggregation;
  value: number;
  sumPercent?: number;
  contributors: DamageContributorResult[];
  active: boolean;
}

export interface DamageFormulaEvaluation {
  formulaId: DamageFormulaId;
  label: string;
  baseDamage: number;
  damage: number;
  buckets: DamageBucketResult[];
  product: number;
  resolutionTrace?: ResolutionTrace;
}

export interface ScenarioScanResult {
  noCritNoWeakspot: DamageFormulaEvaluation;
  critNoWeakspot: DamageFormulaEvaluation;
  noCritWeakspot: DamageFormulaEvaluation;
  critWeakspot: DamageFormulaEvaluation;
  expectedDamage: number;
}

export function evaluateDamageFormula(
  formula: DamageFormulaDefinition,
  context: DamageFormulaContext,
): DamageFormulaEvaluation {
  const baseDamage = evaluateNumericExpression(formula.baseDamage, context);

  if (formula.resolutionBuckets) {
    const resolutionContext = buildResolutionContextFromFormulaContext(context, formula);
    const resolved = resolveUniversalBuckets(baseDamage, formula.resolutionBuckets, resolutionContext);
    return {
      formulaId: formula.id,
      label: formula.label,
      baseDamage: resolved.scaledBaseDamage,
      damage: resolved.finalDamage,
      buckets: resolved.buckets.map(toDamageBucketResult),
      product: resolved.product,
      resolutionTrace: resolved,
    };
  }

  const buckets = (formula.buckets ?? []).map((bucket) => evaluateLegacyBucket(bucket, context));
  const product = buckets
    .filter((bucket) => bucket.active)
    .reduce((acc, bucket) => acc * bucket.value, 1);

  return {
    formulaId: formula.id,
    label: formula.label,
    baseDamage,
    damage: baseDamage * product,
    buckets,
    product,
  };
}

export function resolveUniversalBuckets(
  baseDamage: number,
  buckets: readonly BucketDef[],
  context: ResolutionContext,
  intrinsicScaling = 1,
): ResolutionTrace {
  const scaledBaseDamage = baseDamage * intrinsicScaling;
  let damage = scaledBaseDamage;
  let product = 1;
  const resolvedBuckets: BucketResolution[] = [];

  for (const bucket of buckets) {
    const contributors = bucket.contributors.map((contributor) => {
      const active = evaluateContributionCondition(contributor.condition, context);
      const value = active ? context.statValues.get(contributor.stat) ?? 0 : 0;
      return {
        bucketId: bucket.id,
        contributorId: contributor.stat,
        label: contributor.label ?? contributor.stat,
        source: bucket.source,
        value,
        active,
      };
    });
    const sumPercent = contributors.reduce((sum, contributor) => sum + (contributor.active ? contributor.value : 0), 0);
    const multiplier = 1 + sumPercent / 100;
    const active = contributors.some((contributor) => contributor.active && contributor.value !== 0);

    product *= multiplier;
    damage *= multiplier;
    resolvedBuckets.push({
      id: bucket.id,
      label: bucket.label,
      source: bucket.source,
      sumPercent,
      multiplier,
      contributors,
      active,
    });
  }

  return {
    baseDamage,
    intrinsicScaling,
    scaledBaseDamage,
    buckets: resolvedBuckets,
    finalDamage: damage,
    product,
  };
}

export function evaluateContributionCondition(
  condition: ContributionCondition,
  context: ResolutionContext,
): boolean {
  switch (condition.type) {
    case ConditionType.Always:
      return true;
    case ConditionType.TraitMatches:
      return context.traits.has(condition.trait);
    case ConditionType.KeywordMatches:
      return context.keywords.has(condition.keyword);
    case ConditionType.ElementMatches:
      return context.elements.has(condition.element);
    case ConditionType.TargetTypeMatches:
      return context.targetType === condition.targetType;
    case ConditionType.KeywordCritUnlocked:
      return context.unlockedKeywordCrits.has(condition.keyword);
    case ConditionType.FlagActive:
      return context.flags.get(condition.flag) ?? false;
    case ConditionType.Comparison: {
      const statValue = context.statValues.get(condition.stat) ?? 0;
      switch (condition.operator) {
        case ">":
          return statValue > condition.value;
        case "<":
          return statValue < condition.value;
        case ">=":
          return statValue >= condition.value;
        case "<=":
          return statValue <= condition.value;
        case "==":
          return statValue === condition.value;
      }
    }
    case ConditionType.And:
      return condition.conditions.every((entry) => evaluateContributionCondition(entry, context));
    case ConditionType.Or:
      return condition.conditions.some((entry) => evaluateContributionCondition(entry, context));
    case ConditionType.Not:
      return !evaluateContributionCondition(condition.condition, context);
  }
}

export function evaluateRollRate(
  contributors: readonly ContributorDef[],
  context: ResolutionContext,
): number {
  const sumPercent = contributors.reduce((sum, contributor) => {
    if (!evaluateContributionCondition(contributor.condition, context)) return sum;
    return sum + (context.statValues.get(contributor.stat) ?? 0);
  }, 0);
  return Math.max(0, Math.min(sumPercent / 100, 1));
}

export function resolveScenarioScan(
  formula: DamageFormulaDefinition,
  context: DamageFormulaContext,
): ScenarioScanResult {
  const noCritNoWeakspot = evaluateDamageFormula(formula, {
    ...context,
    flags: { ...recordValue(context.flags), wasCrit: false, wasWeakspot: false, wasBurnCrit: false },
  });
  const critNoWeakspot = evaluateDamageFormula(formula, {
    ...context,
    flags: { ...recordValue(context.flags), wasCrit: true, wasWeakspot: false, wasBurnCrit: true },
  });
  const noCritWeakspot = evaluateDamageFormula(formula, {
    ...context,
    flags: { ...recordValue(context.flags), wasCrit: false, wasWeakspot: true, wasBurnCrit: false },
  });
  const critWeakspot = evaluateDamageFormula(formula, {
    ...context,
    flags: { ...recordValue(context.flags), wasCrit: true, wasWeakspot: true, wasBurnCrit: true },
  });

  const resolutionContext = buildResolutionContextFromFormulaContext(context, formula);
  const critRate = formula.resolutionBuckets ? evaluateRollRate([{ stat: StatType.CritRatePercent, condition: { type: ConditionType.Always } }], resolutionContext) : 0;
  const weakspotRate = resolutionContext.flags.get(FlagType.CannotDealWeakspotDamage)
    ? 0
    : evaluateRollRate([{ stat: StatType.WeakspotHitRatePercent, condition: { type: ConditionType.Always } }], resolutionContext);

  const expectedDamage =
    noCritNoWeakspot.damage * (1 - critRate) * (1 - weakspotRate) +
    critNoWeakspot.damage * critRate * (1 - weakspotRate) +
    noCritWeakspot.damage * (1 - critRate) * weakspotRate +
    critWeakspot.damage * critRate * weakspotRate;

  return {
    noCritNoWeakspot,
    critNoWeakspot,
    noCritWeakspot,
    critWeakspot,
    expectedDamage,
  };
}

export function buildResolutionContextFromFormulaContext(
  context: DamageFormulaContext,
  formula?: Pick<DamageFormulaDefinition, "defaultKeyword" | "defaultTraits">,
): ResolutionContext {
  const keyword = normalizeKeyword(readPath(context, "keyword")) ?? formula?.defaultKeyword;
  const traits = new Set<DamageTrait>(formula?.defaultTraits ?? []);
  const explicitTraits = readArray(context.traits).map(normalizeDamageTrait).filter(isPresent);
  for (const trait of explicitTraits) traits.add(trait);

  if (keyword) {
    const derived = KEYWORD_TRAIT_MAP[keyword] ?? [];
    for (const trait of derived) traits.add(trait);
  }

  const keywords = new Set<KeywordType>();
  if (keyword) keywords.add(keyword);
  for (const entry of readArray(context.keywords).map(normalizeKeyword).filter(isPresent)) {
    keywords.add(entry);
    for (const trait of KEYWORD_TRAIT_MAP[entry] ?? []) traits.add(trait);
  }

  const flags = new Map<ContextFlag, boolean>();
  const rawFlags = recordValue(context.flags);
  for (const [key, value] of Object.entries(rawFlags)) {
    flags.set(key as ContextFlag, Boolean(value));
  }

  const unlockedKeywordCrits = new Set<KeywordType>();
  for (const entry of readArray(context.unlockedKeywordCrits).map(normalizeKeyword).filter(isPresent)) {
    unlockedKeywordCrits.add(entry);
  }
  for (const entry of keywords) {
    if (flags.get(FlagType.KeywordCanCrit)) unlockedKeywordCrits.add(entry);
  }

  return {
    traits,
    keywords,
    elements: new Set(readArray(context.elements).map(normalizeElement).filter(isPresent)),
    targetType: normalizeEnemyType(readPath(context, "targetType")) ?? EnemyType.Normal,
    flags,
    unlockedKeywordCrits,
    statValues: statValuesFromFormulaContext(context, keyword),
  };
}

export function statValuesFromFormulaContext(
  context: DamageFormulaContext,
  keyword?: KeywordType,
): ReadonlyMap<StatType, number> {
  const statValues = new Map<StatType, number>();
  const rawStats = recordValue(context.stats);
  for (const [key, value] of Object.entries(rawStats)) {
    const stat = normalizeStatType(key);
    if (stat && typeof value === "number") statValues.set(stat, value);
  }

  putPercent(statValues, StatType.WeaponDamagePercent, readNumberPath(context, "bonuses.weaponDMG"));
  putPercent(statValues, StatType.ElementalDamagePercent, readNumberPath(context, "bonuses.elementalDMG"));
  putPercent(statValues, StatType.StatusDamagePercent, readNumberPath(context, "bonuses.statusDMG"));
  putPercent(statValues, StatType.AttackPercent, readNumberPath(context, "bonuses.attackPercent") + readNumberPath(context, "attackPercent"));
  putPercent(statValues, StatType.VulnerabilityPercent, readNumberPath(context, "bonuses.vulnerability"));
  putPercent(statValues, StatType.FinalDamage, readNumberPath(context, "bonuses.finalDMG") + readNumberPath(context, "bonuses.ultimateDMG"));
  putPercent(statValues, StatType.CritRatePercent, readNumberPath(context, "crit.rate"));
  putPercent(statValues, StatType.WeakspotHitRatePercent, readNumberPath(context, "weakspot.hitRate"));
  putPercent(statValues, StatType.WeakspotDamagePercent, readNumberPath(context, "bonuses.weakspotDMG"));

  const critDamage = readNumberPath(context, "crit.damage");
  if (critDamage > 0) {
    putWholePercent(statValues, StatType.CritDamagePercent, critDamage > 2 ? critDamage : (critDamage - 1) * 100);
  }

  const targetBonus = readNumberPath(context, "bonuses.enemyTypeDMG");
  const targetType = normalizeEnemyType(readPath(context, "targetType")) ?? EnemyType.Normal;
  if (targetBonus !== 0) {
    if (targetType === EnemyType.Elite) putPercent(statValues, StatType.DamageBonusElite, targetBonus);
    else if (targetType === EnemyType.Boss) putPercent(statValues, StatType.DamageBonusBoss, targetBonus);
    else putPercent(statValues, StatType.DamageBonusNormal, targetBonus);
  }

  if (keyword) {
    putKeywordPercent(statValues, keyword, "factor", readNumberPath(context, "bonuses.keywordDMGFactor"));
    putKeywordPercent(statValues, keyword, "final", readNumberPath(context, "bonuses.keywordFinalDMG"));
  }

  return statValues;
}

export function evaluateNumericExpression(
  expression: NumericExpression,
  context: DamageFormulaContext,
): number {
  switch (expression.kind) {
    case "literal":
      return expression.value;
    case "input": {
      const value = readPath(context, expression.path);
      return typeof value === "number" ? value : expression.defaultValue ?? 0;
    }
    case "add":
      return expression.terms.reduce((sum, term) => sum + evaluateNumericExpression(term, context), 0);
    case "multiply":
      return expression.factors.reduce((product, factor) => product * evaluateNumericExpression(factor, context), 1);
    case "max":
      return Math.max(...expression.terms.map((term) => evaluateNumericExpression(term, context)));
    case "select": {
      const match = expression.cases.find((entry) => evaluateCondition(entry.when, context));
      return evaluateNumericExpression(match?.value ?? expression.default, context);
    }
  }
}

export function evaluateCondition(
  condition: ConditionExpression | undefined,
  context: DamageFormulaContext,
): boolean {
  if (!condition) return true;

  switch (condition.kind) {
    case "always":
      return true;
    case "eq":
      return readPath(context, condition.path) === condition.value;
    case "in":
      return condition.values.includes(readPath(context, condition.path) as string | number | boolean);
    case "gt":
      return readNumberPath(context, condition.path) > condition.value;
    case "gte":
      return readNumberPath(context, condition.path) >= condition.value;
    case "lt":
      return readNumberPath(context, condition.path) < condition.value;
    case "lte":
      return readNumberPath(context, condition.path) <= condition.value;
    case "truthy":
      return Boolean(readPath(context, condition.path));
    case "all":
      return condition.conditions.every((entry) => evaluateCondition(entry, context));
    case "any":
      return condition.conditions.some((entry) => evaluateCondition(entry, context));
    case "not":
      return !evaluateCondition(condition.condition, context);
  }
}

export const KEYWORD_TRAIT_MAP: Record<KeywordType, readonly DamageTrait[]> = {
  [KeywordType.Burn]: [DamageTrait.Burn, DamageTrait.Status, DamageTrait.Elemental],
  [KeywordType.FrostVortex]: [DamageTrait.FrostVortex, DamageTrait.Status, DamageTrait.Elemental],
  [KeywordType.PowerSurge]: [DamageTrait.PowerSurge, DamageTrait.Elemental],
  [KeywordType.Shrapnel]: [DamageTrait.Shrapnel, DamageTrait.Weapon],
  [KeywordType.UnstableBomber]: [DamageTrait.UnstableBomber, DamageTrait.Status, DamageTrait.Elemental, DamageTrait.Explosive],
  [KeywordType.Bounce]: [DamageTrait.Bounce, DamageTrait.Weapon],
  [KeywordType.FastGunner]: [DamageTrait.FastGunner, DamageTrait.Weapon],
  [KeywordType.BullsEye]: [DamageTrait.BullsEye, DamageTrait.Weapon],
  [KeywordType.FortressWarfare]: [DamageTrait.Weapon],
};

function evaluateLegacyBucket(
  bucket: DamageBucketDefinition,
  context: DamageFormulaContext,
): DamageBucketResult {
  const bucketActive = evaluateCondition(bucket.condition, context);
  const contributors = bucket.contributors.map((contributor) => {
    const active = bucketActive && evaluateCondition(contributor.condition, context);
    return {
      bucketId: bucket.id,
      contributorId: contributor.id,
      label: contributor.label,
      source: contributor.source,
      value: active ? evaluateNumericExpression(contributor.expression, context) : 0,
      active,
    };
  });
  const activeContributors = contributors.filter((contributor) => contributor.active);
  const value = bucketActive
    ? aggregateBucket(bucket.aggregation, activeContributors.map((contributor) => contributor.value))
    : 1;

  return {
    id: bucket.id,
    label: bucket.label,
    source: bucket.source,
    aggregation: bucket.aggregation,
    value,
    contributors,
    active: bucketActive,
  };
}

function toDamageBucketResult(bucket: BucketResolution): DamageBucketResult {
  return {
    id: bucket.id,
    label: bucket.label,
    source: bucket.source,
    aggregation: "sum_as_multiplier",
    value: bucket.multiplier,
    sumPercent: bucket.sumPercent,
    contributors: [...bucket.contributors],
    active: bucket.active,
  };
}

function aggregateBucket(aggregation: DamageBucketAggregation, values: readonly number[]): number {
  if (values.length === 0) return 1;
  if (aggregation === "sum_as_multiplier") {
    return 1 + values.reduce((sum, value) => sum + value, 0);
  }
  return values.reduce((product, value) => product * value, 1);
}

function putKeywordPercent(
  statValues: Map<StatType, number>,
  keyword: KeywordType,
  bucket: "factor" | "final",
  decimalValue: number,
): void {
  if (decimalValue === 0) return;
  const stat = KEYWORD_BUCKET_STAT[keyword]?.[bucket];
  if (stat) putPercent(statValues, stat, decimalValue);
}

const KEYWORD_BUCKET_STAT: Record<KeywordType, Partial<Record<"factor" | "final", StatType>>> = {
  [KeywordType.Burn]: { factor: StatType.BurnDamageFactor, final: StatType.BurnFinalDamage },
  [KeywordType.FrostVortex]: { factor: StatType.FrostVortexDamageFactor, final: StatType.FrostVortexFinalDamage },
  [KeywordType.PowerSurge]: { factor: StatType.PowerSurgeDamageFactor, final: StatType.PowerSurgeFinalDamage },
  [KeywordType.Shrapnel]: { factor: StatType.ShrapnelDamageFactor, final: StatType.ShrapnelFinalDamage },
  [KeywordType.UnstableBomber]: { factor: StatType.UnstableBomberDamageFactor, final: StatType.UnstableBomberFinalDamage },
  [KeywordType.Bounce]: { factor: StatType.BounceDamageFactor, final: StatType.BounceFinalDamage },
  [KeywordType.FastGunner]: {},
  [KeywordType.BullsEye]: {},
  [KeywordType.FortressWarfare]: {},
};

function putPercent(statValues: Map<StatType, number>, stat: StatType, decimalValue: number): void {
  if (decimalValue === 0) return;
  putWholePercent(statValues, stat, decimalValue * 100);
}

function putWholePercent(statValues: Map<StatType, number>, stat: StatType, value: number): void {
  statValues.set(stat, (statValues.get(stat) ?? 0) + value);
}

function normalizeKeyword(value: unknown): KeywordType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (Object.values(KeywordType) as string[]).includes(normalized) ? normalized as KeywordType : undefined;
}

function normalizeDamageTrait(value: unknown): DamageTrait | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (Object.values(DamageTrait) as string[]).includes(normalized) ? normalized as DamageTrait : undefined;
}

function normalizeEnemyType(value: unknown): EnemyType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/great_ones|great ones|bosses/g, "boss");
  if (normalized === "elite") return EnemyType.Elite;
  if (normalized === "boss") return EnemyType.Boss;
  if (normalized === "normal") return EnemyType.Normal;
  return undefined;
}

function normalizeElement(value: unknown): ElementType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return (Object.values(ElementType) as string[]).includes(normalized) ? normalized as ElementType : undefined;
}

function normalizeStatType(value: string): StatType | undefined {
  return (Object.values(StatType) as string[]).includes(value) ? value as StatType : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function recordValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readNumberPath(context: DamageFormulaContext, path: string): number {
  const value = readPath(context, path);
  return typeof value === "number" ? value : 0;
}

function readPath(context: DamageFormulaContext, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, context);
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}
