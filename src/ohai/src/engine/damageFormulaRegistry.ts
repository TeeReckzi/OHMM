import {
  BucketId,
  ConditionType,
  DamageFormulaDefinition,
  DamageFormulaId,
  DamageTrait,
  EnemyType,
  FlagType,
  KeywordMetadata,
  KeywordType,
  StatType,
  type BucketDef,
  type ContextFlag,
  type ContributionCondition,
  type ContributorDef,
  type RollDefinition,
} from "./damageFormulaEngine";

export const KEYWORDS_WITH_FACTOR_FORMULA = [
  KeywordType.PowerSurge,
  KeywordType.Burn,
  KeywordType.FrostVortex,
  KeywordType.UnstableBomber,
  KeywordType.Bounce,
  KeywordType.Shrapnel,
] as const;

export const KEYWORD_METADATA: Record<KeywordType, KeywordMetadata> = {
  [KeywordType.Burn]: {
    type: KeywordType.Burn,
    label: "Burn",
    scalingFactor: 0.12,
    baseStatType: StatType.PsiIntensity,
    baseTriggerChance: 0.18,
    canCrit: false,
    canWeakspot: false,
    defaultTraits: [DamageTrait.Burn, DamageTrait.Status, DamageTrait.Elemental],
  },
  [KeywordType.FrostVortex]: {
    type: KeywordType.FrostVortex,
    label: "Frost Vortex",
    scalingFactor: 0.5,
    baseStatType: StatType.PsiIntensity,
    baseTriggerChance: 0.1,
    canCrit: false,
    canWeakspot: false,
    defaultTraits: [DamageTrait.FrostVortex, DamageTrait.Status, DamageTrait.Elemental],
  },
  [KeywordType.PowerSurge]: {
    type: KeywordType.PowerSurge,
    label: "Power Surge",
    scalingFactor: 1,
    baseStatType: StatType.PsiIntensity,
    baseTriggerChance: 0.15,
    canCrit: false,
    canWeakspot: false,
    defaultTraits: [DamageTrait.PowerSurge, DamageTrait.Elemental],
  },
  [KeywordType.Shrapnel]: {
    type: KeywordType.Shrapnel,
    label: "Shrapnel",
    scalingFactor: 0.6,
    baseStatType: StatType.DamagePerProjectile,
    baseTriggerChance: 0.04,
    canCrit: true,
    canWeakspot: true,
    defaultTraits: [DamageTrait.Shrapnel, DamageTrait.Weapon],
  },
  [KeywordType.UnstableBomber]: {
    type: KeywordType.UnstableBomber,
    label: "Unstable Bomber",
    scalingFactor: 0.7,
    baseStatType: StatType.PsiIntensity,
    baseTriggerChance: 1,
    canCrit: true,
    canWeakspot: false,
    defaultTraits: [DamageTrait.UnstableBomber, DamageTrait.Status, DamageTrait.Elemental, DamageTrait.Explosive],
  },
  [KeywordType.Bounce]: {
    type: KeywordType.Bounce,
    label: "Bounce",
    scalingFactor: 0.6,
    baseStatType: StatType.DamagePerProjectile,
    baseTriggerChance: 0.3,
    canCrit: true,
    canWeakspot: true,
    defaultTraits: [DamageTrait.Bounce, DamageTrait.Weapon],
  },
  [KeywordType.FastGunner]: {
    type: KeywordType.FastGunner,
    label: "Fast Gunner",
    baseTriggerChance: 0.35,
    canCrit: false,
    canWeakspot: false,
    defaultTraits: [DamageTrait.FastGunner, DamageTrait.Weapon],
  },
  [KeywordType.BullsEye]: {
    type: KeywordType.BullsEye,
    label: "The Bull's Eye",
    baseTriggerChance: 0.7,
    canCrit: false,
    canWeakspot: false,
    defaultTraits: [DamageTrait.BullsEye, DamageTrait.Weapon],
  },
  [KeywordType.FortressWarfare]: {
    type: KeywordType.FortressWarfare,
    label: "Fortress Warfare",
    baseTriggerChance: 0,
    canCrit: false,
    canWeakspot: false,
    defaultTraits: [DamageTrait.Weapon],
  },
};

const always = { type: ConditionType.Always } as const;
const trait = (value: DamageTrait): ContributionCondition => ({ type: ConditionType.TraitMatches, trait: value });
const kw = (value: KeywordType): ContributionCondition => ({ type: ConditionType.KeywordMatches, keyword: value });
const target = (value: EnemyType): ContributionCondition => ({ type: ConditionType.TargetTypeMatches, targetType: value });
const flag = (value: ContextFlag): ContributionCondition => ({ type: ConditionType.FlagActive, flag: value });
const not = (condition: ContributionCondition): ContributionCondition => ({ type: ConditionType.Not, condition });
const and = (...conditions: ContributionCondition[]): ContributionCondition => ({ type: ConditionType.And, conditions });
const or = (...conditions: ContributionCondition[]): ContributionCondition => ({ type: ConditionType.Or, conditions });

export const UNIVERSAL_DAMAGE_BUCKETS: readonly BucketDef[] = [
  {
    id: BucketId.WeaponDamage,
    label: "Weapon DMG Bonus",
    source: "weapon",
    contributors: [{ stat: StatType.WeaponDamagePercent, label: "Weapon DMG Bonus", condition: trait(DamageTrait.Weapon) }],
  },
  {
    id: BucketId.ElementalDamage,
    label: "Elemental DMG Bonus",
    source: "elemental",
    contributors: [{ stat: StatType.ElementalDamagePercent, label: "Elemental DMG Bonus", condition: trait(DamageTrait.Elemental) }],
  },
  {
    id: BucketId.StatusDamage,
    label: "Status DMG Bonus",
    source: "status",
    contributors: [{ stat: StatType.StatusDamagePercent, label: "Status DMG Bonus", condition: trait(DamageTrait.Status) }],
  },
  {
    id: BucketId.AttackPercent,
    label: "Attack Percent",
    source: "weapon",
    contributors: [{ stat: StatType.AttackPercent, label: "Attack Percent", condition: trait(DamageTrait.Attack) }],
  },
  {
    id: BucketId.HitAmplifier,
    label: "Hit Amplifier",
    source: "crit",
    contributors: [
      { stat: StatType.CritDamagePercent, label: "Crit DMG", condition: flag("wasCrit") },
      {
        stat: StatType.WeakspotDamagePercent,
        label: "Weakspot DMG",
        condition: and(flag("wasWeakspot"), not(flag(FlagType.CannotDealWeakspotDamage))),
      },
      {
        stat: StatType.KeywordCritDamagePercent,
        label: "Keyword Crit DMG",
        condition: and(
          or(flag("wasBurnCrit"), and(flag("wasCrit"), flag(FlagType.KeywordCanCrit))),
          or(kw(KeywordType.Burn), kw(KeywordType.PowerSurge), kw(KeywordType.FrostVortex), kw(KeywordType.UnstableBomber)),
        ),
      },
    ],
  },
  {
    id: BucketId.TargetNormal,
    label: "Normal Enemy DMG Bonus",
    source: "target",
    contributors: [{ stat: StatType.DamageBonusNormal, label: "Normal Enemy DMG Bonus", condition: target(EnemyType.Normal) }],
  },
  {
    id: BucketId.TargetElite,
    label: "Elite Enemy DMG Bonus",
    source: "target",
    contributors: [{ stat: StatType.DamageBonusElite, label: "Elite Enemy DMG Bonus", condition: target(EnemyType.Elite) }],
  },
  {
    id: BucketId.TargetBoss,
    label: "Boss / Great Ones DMG Bonus",
    source: "target",
    contributors: [{ stat: StatType.DamageBonusBoss, label: "Boss / Great Ones DMG Bonus", condition: target(EnemyType.Boss) }],
  },
  {
    id: BucketId.Vulnerability,
    label: "Vulnerability",
    source: "target",
    contributors: [{ stat: StatType.VulnerabilityPercent, label: "Vulnerability", condition: always }],
  },
  {
    id: BucketId.BurnFactor,
    label: "Burn DMG Factor",
    source: "keyword",
    contributors: [{ stat: StatType.BurnDamageFactor, label: "Burn DMG Factor / Coefficient", condition: kw(KeywordType.Burn) }],
  },
  {
    id: BucketId.FrostVortexFactor,
    label: "Frost Vortex DMG Factor",
    source: "keyword",
    contributors: [{ stat: StatType.FrostVortexDamageFactor, label: "Frost Vortex DMG Factor / Coefficient", condition: kw(KeywordType.FrostVortex) }],
  },
  {
    id: BucketId.PowerSurgeFactor,
    label: "Power Surge DMG Factor",
    source: "keyword",
    contributors: [{ stat: StatType.PowerSurgeDamageFactor, label: "Power Surge DMG Factor / Coefficient", condition: kw(KeywordType.PowerSurge) }],
  },
  {
    id: BucketId.ShrapnelFactor,
    label: "Shrapnel DMG Factor",
    source: "keyword",
    contributors: [{ stat: StatType.ShrapnelDamageFactor, label: "Shrapnel DMG Factor / Coefficient", condition: kw(KeywordType.Shrapnel) }],
  },
  {
    id: BucketId.UnstableBomberFactor,
    label: "Unstable Bomber DMG Factor",
    source: "keyword",
    contributors: [{ stat: StatType.UnstableBomberDamageFactor, label: "Unstable Bomber DMG Factor / Coefficient", condition: kw(KeywordType.UnstableBomber) }],
  },
  {
    id: BucketId.BounceFactor,
    label: "Bounce DMG Factor",
    source: "keyword",
    contributors: [{ stat: StatType.BounceDamageFactor, label: "Bounce DMG Factor / Coefficient", condition: kw(KeywordType.Bounce) }],
  },
  {
    id: BucketId.BurnFinal,
    label: "Burn Final DMG",
    source: "keyword",
    contributors: [{ stat: StatType.BurnFinalDamage, label: "Burn Final DMG", condition: kw(KeywordType.Burn) }],
  },
  {
    id: BucketId.FrostVortexFinal,
    label: "Frost Vortex Final DMG",
    source: "keyword",
    contributors: [{ stat: StatType.FrostVortexFinalDamage, label: "Frost Vortex Final DMG", condition: kw(KeywordType.FrostVortex) }],
  },
  {
    id: BucketId.PowerSurgeFinal,
    label: "Power Surge Final DMG",
    source: "keyword",
    contributors: [{ stat: StatType.PowerSurgeFinalDamage, label: "Power Surge Final DMG", condition: kw(KeywordType.PowerSurge) }],
  },
  {
    id: BucketId.ShrapnelFinal,
    label: "Shrapnel Final DMG",
    source: "keyword",
    contributors: [{ stat: StatType.ShrapnelFinalDamage, label: "Shrapnel Final DMG", condition: kw(KeywordType.Shrapnel) }],
  },
  {
    id: BucketId.UnstableBomberFinal,
    label: "Unstable Bomber Final DMG",
    source: "keyword",
    contributors: [{ stat: StatType.UnstableBomberFinalDamage, label: "Unstable Bomber Final DMG", condition: kw(KeywordType.UnstableBomber) }],
  },
  {
    id: BucketId.BounceFinal,
    label: "Bounce Final DMG",
    source: "keyword",
    contributors: [{ stat: StatType.BounceFinalDamage, label: "Bounce Final DMG", condition: kw(KeywordType.Bounce) }],
  },
  {
    id: BucketId.FinalDamage,
    label: "Final DMG Bonus",
    source: "final",
    contributors: [{ stat: StatType.FinalDamage, label: "Final / Ultimate DMG Bonus", condition: always }],
  },
];

export const CRIT_RATE_CONTRIBUTORS: readonly ContributorDef[] = [
  { stat: StatType.CritRatePercent, label: "Crit Rate", condition: always },
];

export const WEAKSPOT_RATE_CONTRIBUTORS: readonly ContributorDef[] = [
  { stat: StatType.WeakspotHitRatePercent, label: "Weakspot Hit Rate", condition: not(flag(FlagType.CannotDealWeakspotDamage)) },
];

export const KEYWORD_CRIT_RATE_CONTRIBUTORS: readonly ContributorDef[] = [
  { stat: StatType.CritRatePercent, label: "Base Crit Rate", condition: flag(FlagType.KeywordCanCrit) },
  {
    stat: StatType.KeywordCritRatePercent,
    label: "Keyword Crit Rate",
    condition: and(
      flag(FlagType.KeywordCanCrit),
      or(kw(KeywordType.Burn), kw(KeywordType.PowerSurge), kw(KeywordType.FrostVortex), kw(KeywordType.UnstableBomber)),
    ),
  },
];

export const ROLL_REGISTRY: readonly RollDefinition[] = [
  { id: "crit", rateContributors: CRIT_RATE_CONTRIBUTORS, resultFlag: "wasCrit" },
  { id: "weakspot", rateContributors: WEAKSPOT_RATE_CONTRIBUTORS, resultFlag: "wasWeakspot" },
  { id: "keyword-crit", rateContributors: KEYWORD_CRIT_RATE_CONTRIBUTORS, resultFlag: "wasBurnCrit" },
];

export const DAMAGE_FORMULA_REGISTRY: readonly DamageFormulaDefinition[] = [
  {
    id: "weapon_attack_damage",
    label: "Weapon Attack Damage",
    baseDamage: { kind: "input", path: "attackDMG", defaultValue: 0 },
    resolutionBuckets: UNIVERSAL_DAMAGE_BUCKETS,
    defaultTraits: [DamageTrait.Attack, DamageTrait.Weapon],
  },
  {
    id: "keyword_attack_scaled_damage",
    label: "Keyword Damage - Attack Scaling",
    baseDamage: {
      kind: "multiply",
      factors: [
        { kind: "input", path: "keywordIntrinsicScaling", defaultValue: 0 },
        { kind: "input", path: "attackDMG", defaultValue: 0 },
      ],
    },
    resolutionBuckets: UNIVERSAL_DAMAGE_BUCKETS,
  },
  {
    id: "keyword_psi_scaled_damage",
    label: "Keyword Damage - Psi Intensity Scaling",
    baseDamage: {
      kind: "multiply",
      factors: [
        { kind: "input", path: "keywordIntrinsicScaling", defaultValue: 0 },
        { kind: "input", path: "psiIntensity", defaultValue: 0 },
      ],
    },
    resolutionBuckets: UNIVERSAL_DAMAGE_BUCKETS,
  },
];

export function getKeywordMetadata(type: KeywordType): KeywordMetadata {
  return KEYWORD_METADATA[type];
}

export function canKeywordCrit(type: KeywordType, hasFlag: (flag: FlagType) => boolean): boolean {
  return KEYWORD_METADATA[type].canCrit || hasFlag(FlagType.KeywordCanCrit);
}

export function canKeywordWeakspot(type: KeywordType, hasFlag: (flag: FlagType) => boolean): boolean {
  return KEYWORD_METADATA[type].canWeakspot || hasFlag(FlagType.KeywordCanWeakspot);
}

export function getDamageFormulaDefinition(id: DamageFormulaId): DamageFormulaDefinition {
  const definition = DAMAGE_FORMULA_REGISTRY.find((entry) => entry.id === id);
  if (!definition) throw new Error(`Unknown damage formula: ${id}`);
  return definition;
}

export function chooseKeywordDamageFormulaId(input: {
  isElemental?: boolean;
}): DamageFormulaId {
  return input.isElemental ? "keyword_psi_scaled_damage" : "keyword_attack_scaled_damage";
}
