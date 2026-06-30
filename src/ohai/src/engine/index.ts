export * from "./types";
export * from "./runtimeAttackTypes";
export {
  getMechanicBehavior,
  listMechanicBehaviors,
  getOverridesForMechanic,
  getOverridesForGear,
  applyGearOverridesToMechanic,
} from "./mechanicRegistry";
export { registerInitialOverrides, getInitialOverrides } from "./overrides";
export { getFormulaTemplate, listFormulaTemplates } from "./formulaTemplates";

export {
  computeExpectedCritMultiplier,
  computeExpectedWeakspotMultiplier,
  computeCombinedCritWeakspotMultiplier,
} from "./formulaTypes";
export type {
  FormulaInput,
  FormulaResult,
  FormulaMultiplierBreakdown,
  FormulaFamily,
  FormulaEffectiveBehaviorSnapshot,
} from "./formulaTypes";
export { buildFormulaInput } from "./formulaContext";
export { calculateExpectedDamage } from "./formulaApplicator";
export { formatFormulaExplanation } from "./formulaExplainer";

export type { ProcSource, ProcSourceType } from "./procTypes";
export { registerProcSource, getInternalRegistry } from "./procRegistry";
export {
  getProcSource,
  listProcSources,
  getProcSourcesForSource,
  getProcSourcesGeneratingMechanic,
} from "./procResolver";

export type {
  ObservedHit,
  ObservedHitSource,
  DamageCaseFlags,
  ObservedDamageCase,
  ValidationClassification,
  ValidationThresholds,
  ValidationResult,
} from "./formulaTestTypes";
export {
  classifyError,
  computeAverage,
  computeMedian,
  suggestMissingBucket,
  DEFAULT_THRESHOLDS,
} from "./formulaTestTypes";
export { getObservedDamageCases, getObservedCase } from "./formulaObservedCases";
export { validateCase, validateAllCases, formatValidationReport } from "./formulaTestHarness";

export type { ObservationSourceType, RawObservation, ClassificationHint, NormalizedObservation, ObservationGroup, NormalizationConfig, NormalizationAudit, DedupeAuditEntry } from "./observationTypes";
export { DEFAULT_NORMALIZATION_CONFIG } from "./observationTypes";
export { normalizeObservation, normalizeObservations, normalizedToObservedHits, buildObservationGroup } from "./observationNormalizer";
export { parseOcrExport, parseOcrExportLine, parseManualJson, parseStructuredJson } from "./observationParser";
export { dedupeObservations } from "./observationDeduper";

export type { ModifierSourceType, ModifierBehavior, ModifierConditional, ModifierSource, ModifierBreakdownEntry, AggregatedStats, DuplicateReport, AggregationReport } from "./modifierTypes";
export { registerModifierSource, getModifierSource, listModifierSources, getModifierSourcesByType } from "./modifierRegistry";
export { aggregateModifiers, formatBreakdown, formatAggregationReport } from "./modifierAggregation";
export { aggregatedStatsToPartialRecord, resolveDamageForMechanic, resolveDamageForObservedCase } from "./modifierResolver";
export { calculateOfficialPhysicalDamage } from "./officialFormulaBridge";
export { initFormulaCache, isFormulaCacheReady, getFormulaInitPromise } from "./supabaseFormulaService";
export type {
  DamageSourceCategory,
  DamageFormulaId,
  NumericExpression,
  NumericSelectCase,
  ConditionExpression,
  DamageContributorDefinition,
  DamageBucketAggregation,
  DamageBucketDefinition,
  DamageFormulaDefinition,
  DamageFormulaContext,
  DamageContributorResult,
  DamageBucketResult,
  DamageFormulaEvaluation,
  ContextFlag,
  ComparisonOperator,
  ContributionCondition,
  ContributorDef,
  BucketDef,
  RollDefinition,
  StatContribution,
  ResolutionContext,
  BucketResolution,
  ResolutionTrace,
  KeywordMetadata,
  ScenarioScanResult,
} from "./damageFormulaEngine";
export {
  KeywordType,
  DamageTrait,
  EnemyType,
  ElementType,
  FlagType,
  StatType,
  BucketId,
  ConditionType,
  evaluateDamageFormula,
  evaluateNumericExpression,
  evaluateCondition,
  resolveUniversalBuckets,
  evaluateContributionCondition,
  evaluateRollRate,
  resolveScenarioScan,
  buildResolutionContextFromFormulaContext,
  statValuesFromFormulaContext,
} from "./damageFormulaEngine";
export {
  KEYWORDS_WITH_FACTOR_FORMULA,
  KEYWORD_METADATA,
  UNIVERSAL_DAMAGE_BUCKETS,
  CRIT_RATE_CONTRIBUTORS,
  WEAKSPOT_RATE_CONTRIBUTORS,
  KEYWORD_CRIT_RATE_CONTRIBUTORS,
  ROLL_REGISTRY,
  DAMAGE_FORMULA_REGISTRY,
  getKeywordMetadata,
  canKeywordCrit,
  canKeywordWeakspot,
  getDamageFormulaDefinition,
  chooseKeywordDamageFormulaId,
} from "./damageFormulaRegistry";
