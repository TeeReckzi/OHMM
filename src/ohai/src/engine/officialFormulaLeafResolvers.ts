/**
 * Dynamic leaf resolver registry for the official formula engine.
 *
 * Many formula leaves are not static stat keys — they are resolved at runtime
 * via tag-table lookups. This module provides a typed registry of those
 * resolver entries. Resolvers that lack the required context return a
 * missingReason so the UI can surface the gap rather than silently defaulting.
 *
 * Do not silently default unresolved dynamic leaves to 1.
 */

import {
  resolveAttackTypeTag,
  resolveElementTypeTag,
  resolveKeywordTypeTag,
  resolveGunTypeTag,
  resolveSpeciesTypeTag,
  resolveDebuffTypeTag,
  getDamageFormulaBranchToFormulaAttackType,
} from "./officialFormulaTagTables";

export interface DynamicLeafResolverContext {
  formula_attack_type?: number;
  keyword_type?: string | number;
  element_type?: string | number;
  gun_type?: string | number;
  damage_feature_type?: string | number;
  damage_material_type?: string | number;
  armor_type?: string | number;
  attacker_all_debuff_state?: string | number;
  species_type?: string | number;
  target_all_debuff_state?: string | number;
  [key: string]: unknown;
}

export interface DynamicLeafResolution {
  leafName: string;
  /** The stat attribute name this leaf resolved to, if known */
  resolvedAttrName?: string;
  /** Resolved numeric value, if available */
  value?: number;
  /** Why the leaf could not be resolved — absent means success */
  missingReason?: string;
  confidence: "high" | "medium" | "low";
}

export type DynamicLeafResolver = (
  context: DynamicLeafResolverContext
) => DynamicLeafResolution;

export interface DynamicLeafResolverEntry {
  leafName: string;
  /** Context keys this resolver depends on */
  requiredContextKeys: ReadonlyArray<string>;
  resolve: DynamicLeafResolver;
}

// ─── Resolver implementations ─────────────────────────────────────────────────

function missingContext(leafName: string, missingKey: string): DynamicLeafResolution {
  return {
    leafName,
    missingReason: `resolver requires context key "${missingKey}" which was not provided`,
    confidence: "low",
  };
}

function missingTagTable(leafName: string, tableName: string): DynamicLeafResolution {
  return {
    leafName,
    missingReason: `tag table "${tableName}" not yet recovered — cannot resolve ${leafName}`,
    confidence: "low",
  };
}

const RESOLVERS: DynamicLeafResolverEntry[] = [
  {
    leafName: "keyword_proc_dam_add_rate",
    requiredContextKeys: ["keyword_type"],
    resolve(ctx) {
      if (ctx.keyword_type === undefined) return missingContext("keyword_proc_dam_add_rate", "keyword_type");
      const resolution = resolveKeywordTypeTag("keyword_proc_dam_add_rate", ctx.keyword_type);
      if (resolution.resolved) {
        return {
          leafName: "keyword_proc_dam_add_rate",
          resolvedAttrName: resolution.attrName,
          value: 0,
          confidence: resolution.confidence,
          missingReason: resolution.confidence === "low"
            ? `keyword tag table resolved to "${resolution.attrName}" but suffix confidence is LOW — keyword_tag_data not recovered from extracted data`
            : `resolved to "${resolution.attrName}" but numeric value not yet sourced from V2+ record payload — placeholder 0 used`,
        };
      }
      return {
        leafName: "keyword_proc_dam_add_rate",
        value: 0,
        missingReason: resolution.missingReason ?? `keyword_type "${String(ctx.keyword_type)}" not in tag table`,
        confidence: "low",
      };
    },
  },
  {
    leafName: "gun_type_dam_add_rate",
    requiredContextKeys: ["gun_type"],
    resolve(ctx) {
      if (ctx.gun_type === undefined) return missingContext("gun_type_dam_add_rate", "gun_type");
      const resolution = resolveGunTypeTag("gun_type_dam_add_rate", ctx.gun_type);
      if (resolution.resolved) {
        return {
          leafName: "gun_type_dam_add_rate",
          resolvedAttrName: resolution.attrName,
          confidence: resolution.confidence,
        };
      }
      return {
        leafName: "gun_type_dam_add_rate",
        missingReason: resolution.missingReason ?? `gun_type "${String(ctx.gun_type)}" not in tag table — gun_type_data not recovered`,
        confidence: "low",
      };
    },
  },
  {
    leafName: "element_type_dam_add_rate",
    requiredContextKeys: ["element_type"],
    resolve(ctx) {
      if (ctx.element_type === undefined) return missingContext("element_type_dam_add_rate", "element_type");
      const resolution = resolveElementTypeTag("element_type_dam_add_rate", ctx.element_type);
      if (resolution.resolved) {
        return {
          leafName: "element_type_dam_add_rate",
          resolvedAttrName: resolution.attrName,
          confidence: resolution.confidence,
        };
      }
      return {
        leafName: "element_type_dam_add_rate",
        missingReason: resolution.missingReason ?? `element_type "${String(ctx.element_type)}" not in tag table`,
        confidence: "low",
      };
    },
  },
  {
    leafName: "attack_type_dam_add_rate",
    requiredContextKeys: ["formula_attack_type"],
    resolve(ctx) {
      if (ctx.formula_attack_type === undefined) return missingContext("attack_type_dam_add_rate", "formula_attack_type");
      const enumType = getDamageFormulaBranchToFormulaAttackType(ctx.formula_attack_type) ?? ctx.formula_attack_type;
      const resolution = resolveAttackTypeTag("attack_type_dam_add_rate", enumType);
      if (resolution.resolved) {
        return {
          leafName: "attack_type_dam_add_rate",
          resolvedAttrName: resolution.attrName,
          confidence: resolution.confidence,
        };
      }
      return {
        leafName: "attack_type_dam_add_rate",
        missingReason: resolution.missingReason ?? `formula_attack_type ${ctx.formula_attack_type} not in tag table`,
        confidence: "low",
      };
    },
  },
  {
    leafName: "element_type_index_struct_type_dam_rate",
    requiredContextKeys: ["element_type", "damage_material_type"],
    resolve(ctx) {
      if (ctx.element_type === undefined) return missingContext("element_type_index_struct_type_dam_rate", "element_type");
      if (ctx.damage_material_type === undefined) return missingContext("element_type_index_struct_type_dam_rate", "damage_material_type");
      return missingTagTable("element_type_index_struct_type_dam_rate", "get_element_type_index_struct_type_dam_rate");
    },
  },
  {
    leafName: "element_type_index_armor_type_dam_rate",
    requiredContextKeys: ["element_type", "armor_type"],
    resolve(ctx) {
      if (ctx.element_type === undefined) return missingContext("element_type_index_armor_type_dam_rate", "element_type");
      if (ctx.armor_type === undefined) return missingContext("element_type_index_armor_type_dam_rate", "armor_type");
      return missingTagTable("element_type_index_armor_type_dam_rate", "get_element_type_index_armor_type_dam_rate");
    },
  },
  {
    leafName: "pvp_adjust_factor",
    requiredContextKeys: [],
    resolve(_ctx) {
      // Static default known from recovery — but actual game value depends on mode
      return {
        leafName: "pvp_adjust_factor",
        resolvedAttrName: "pvp_adjust_factor",
        value: 1,
        confidence: "medium",
        missingReason: "pvp_adjust_factor actual value depends on PvP mode — default 1 used; override required for PvP",
      };
    },
  },
  {
    leafName: "special_regulate_factor",
    requiredContextKeys: [],
    resolve(_ctx) {
      return {
        leafName: "special_regulate_factor",
        resolvedAttrName: "special_regulate_factor",
        value: 1,
        confidence: "medium",
        missingReason: "special_regulate_factor tag table not yet recovered — default 1 used",
      };
    },
  },
  {
    leafName: "defined_fixed_crit",
    requiredContextKeys: [],
    resolve(_ctx) {
      return {
        leafName: "defined_fixed_crit",
        missingReason: "defined_fixed_crit tag table not yet recovered",
        confidence: "low",
      };
    },
  },
  {
    leafName: "species_dam_add_rate",
    requiredContextKeys: ["species_type"],
    resolve(ctx) {
      const directOverride = ctx["species_dam_add_rate"];
      if (typeof directOverride === "number") {
        return {
          leafName: "species_dam_add_rate",
          value: directOverride,
          confidence: "low",
          missingReason: "species_dam_add_rate direct override used; numeric value not yet sourced from V2+ record payload",
        };
      }
      if (ctx.species_type === undefined) {
        return {
          leafName: "species_dam_add_rate",
          value: 0,
          confidence: "low",
          missingReason: "species_type not provided — resolver requires context key to build species_dam_add_rate_{suffix} attribute name",
        };
      }
      const resolution = resolveSpeciesTypeTag("species_dam_add_rate", ctx.species_type);
      if (resolution.resolved) {
        return {
          leafName: "species_dam_add_rate",
          resolvedAttrName: resolution.attrName,
          value: 0,
          confidence: "high",
          missingReason: `resolved to "${resolution.attrName}" but numeric value not yet sourced from V2+ record payload — placeholder 0 used`,
        };
      }
      return {
        leafName: "species_dam_add_rate",
        value: 0,
        confidence: "low",
        missingReason: resolution.missingReason ?? `species_type "${String(ctx.species_type)}" not in SPECIES_TYPE_TAG_TABLE`,
      };
    },
  },
  {
    leafName: "human_dam_add_rate",
    requiredContextKeys: [],
    resolve(ctx) {
      const directOverride = ctx["human_dam_add_rate"];
      if (typeof directOverride === "number") {
        return {
          leafName: "human_dam_add_rate",
          value: directOverride,
          confidence: "low",
          missingReason: "human_dam_add_rate direct override used; no evidence this leaf exists in game source — may be community name for species_dam_add_rate vs HUMAN_UNIT_SOUL_TUPLE",
        };
      }
      return {
        leafName: "human_dam_add_rate",
        value: 0,
        confidence: "low",
        missingReason: "human_dam_add_rate NOT FOUND in decompiled game source — likely community name for species_dam_add_rate against HUMAN_UNIT_SOUL_TUPLE; use species_dam_add_rate with species_type context instead",
      };
    },
  },
  {
    leafName: "debuff_type_dam_add_rate",
    requiredContextKeys: ["target_all_debuff_state"],
    resolve(ctx) {
      const directOverride = ctx["debuff_type_dam_add_rate"];
      if (typeof directOverride === "number") {
        return {
          leafName: "debuff_type_dam_add_rate",
          value: directOverride,
          confidence: "low",
          missingReason: "debuff_type_dam_add_rate direct override used; numeric value not yet sourced from V2+ record payload",
        };
      }
      if (ctx.target_all_debuff_state === undefined) {
        return {
          leafName: "debuff_type_dam_add_rate",
          value: 0,
          confidence: "low",
          missingReason: "target_all_debuff_state not provided — resolver requires debuff tags to build debuff_type_dam_add_rate_{suffix} attribute names",
        };
      }
      const debuffTags = Array.isArray(ctx.target_all_debuff_state)
        ? ctx.target_all_debuff_state
        : [ctx.target_all_debuff_state];
      const resolvedAttrs: string[] = [];
      const unresolvedTags: string[] = [];
      for (const tag of debuffTags) {
        const resolution = resolveDebuffTypeTag("debuff_type_dam_add_rate", tag);
        if (resolution.resolved && resolution.attrName) {
          resolvedAttrs.push(resolution.attrName);
        } else {
          unresolvedTags.push(String(tag));
        }
      }
      if (resolvedAttrs.length > 0) {
        return {
          leafName: "debuff_type_dam_add_rate",
          resolvedAttrName: resolvedAttrs.join(","),
          value: 0,
          confidence: "high",
          missingReason: `resolved to [${resolvedAttrs.join(", ")}] but numeric values not yet sourced from V2+ record payload — placeholder 0 used`,
        };
      }
      return {
        leafName: "debuff_type_dam_add_rate",
        value: 0,
        confidence: "low",
        missingReason: unresolvedTags.length > 0
          ? `debuff tags [${unresolvedTags.join(", ")}] not in DEBUFF_TYPE_TAG_TABLE`
          : "no debuff tags could be resolved",
      };
    },
  },
];

// Build lookup map
const RESOLVER_MAP = new Map<string, DynamicLeafResolverEntry>(
  RESOLVERS.map((r) => [r.leafName, r])
);

export function getDynamicLeafResolver(leafName: string): DynamicLeafResolverEntry | undefined {
  return RESOLVER_MAP.get(leafName);
}

export function resolveDynamicLeaf(
  leafName: string,
  context: DynamicLeafResolverContext
): DynamicLeafResolution {
  const entry = RESOLVER_MAP.get(leafName);
  if (!entry) {
    return {
      leafName,
      missingReason: `no dynamic resolver registered for "${leafName}"`,
      confidence: "low",
    };
  }
  return entry.resolve(context);
}

export function getAllDynamicLeafNames(): string[] {
  return RESOLVERS.map((r) => r.leafName);
}

/**
 * Resolve multiple leaves at once. Returns only the unresolved entries
 * (those with missingReason) so callers can surface gaps to the UI.
 */
export function getUnresolvedDynamicLeaves(
  leafNames: string[],
  context: DynamicLeafResolverContext,
  overrides: Record<string, number> = {}
): DynamicLeafResolution[] {
  const unresolved: DynamicLeafResolution[] = [];
  for (const name of leafNames) {
    if (name in overrides) continue;
    const resolution = resolveDynamicLeaf(name, context);
    if (resolution.missingReason) {
      unresolved.push(resolution);
    }
  }
  return unresolved;
}
