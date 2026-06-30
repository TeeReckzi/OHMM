import fs from "node:fs";
import path from "node:path";
import { modTerminologyRegistrySchema, formatZodError } from "../schemas/modTerminologySchema";
import type { ModTerminologyEntry, ModTerminologyRegistry } from "../schemas/modTerminologySchema";

const ROOT_DIR = path.resolve(__dirname, "..", "..");

function entry(
  id: string,
  termType: ModTerminologyEntry["termType"],
  sourceOriginalTerms: string[],
  approvedEnglish: string | null,
  aliasesEnglish: string[],
  badTranslations: string[],
  category: string | null,
  status: ModTerminologyEntry["status"],
  confidence: ModTerminologyEntry["confidence"],
  sourceReferences: string[],
  notes: string[]
): ModTerminologyEntry {
  return { id, termType, sourceOriginalTerms, approvedEnglish, aliasesEnglish, badTranslations, category, status, confidence, sourceReferences, notes };
}

const statEntries: ModTerminologyEntry[] = [
  entry("stat-crit-rate", "stat", ["暴擊率", "暴击率", "Crit Rate"], "Crit Rate", ["Critical Rate"], ["Crit Rate +X%"], "damage_stat", "approved", "A", ["translationDictionary", "external_weapon_reference"], []),
  entry("stat-crit-dmg", "stat", ["暴擊傷害", "暴击伤害", "Crit DMG", "Crit Damage"], "Crit DMG", ["Critical Damage"], ["Violent Injury"], "damage_stat", "approved", "A", ["translationDictionary", "external_weapon_reference"], []),
  entry("stat-weakspot-dmg", "stat", ["弱點傷害", "弱点伤害", "Weakspot DMG", "Weak Spot DMG"], "Weakspot DMG", ["Weak Spot Damage"], ["Weakness Damage"], "damage_stat", "approved", "A", ["translationDictionary", "external_weapon_reference"], []),
  entry("stat-weapon-dmg", "stat", ["武器傷害", "武器伤害"], "Weapon DMG", ["Weapon Damage"], [], "damage_stat", "approved", "A", ["translationDictionary", "external_material_reference"], []),
  entry("stat-status-dmg", "stat", ["異常傷害", "异常伤害"], "Status DMG", ["Status Damage", "Anomaly DMG"], ["Abnormal Damage"], "damage_stat", "approved", "A", ["translationDictionary", "external_material_reference"], []),
  entry("stat-elemental-dmg", "stat", ["元素傷害", "元素伤害"], "Elemental DMG", ["Elemental Damage"], [], "damage_stat", "approved", "A", ["translationDictionary", "external_material_reference"], []),
  entry("stat-melee-dmg", "stat", ["近戰傷害", "近战伤害"], "Melee DMG", ["Melee Damage"], [], "damage_stat", "approved", "A", ["translationDictionary", "external_material_reference"], []),
  entry("stat-psi-intensity", "stat", ["Psi Intensity"], "Psi Intensity", [], [], "defense_stat", "approved", "A", ["external_armor_reference"], []),
  entry("stat-super-anomaly-strength", "stat", ["Super Anomaly Strength"], "Super Anomaly Strength", [], [], "damage_stat", "approved", "B", [], ["Unverified against original Chinese source."]),
  entry("stat-reload-speed", "stat", ["換彈速度", "换弹速度", "Reload Speed"], "Reload Speed", [], [], "weapon_stat", "approved", "A", ["translationDictionary"], []),
  entry("stat-reload-efficiency", "stat", ["Reload Efficiency"], "Reload Efficiency", [], [], "weapon_stat", "approved", "B", [], ["Unverified against original Chinese source."]),
  entry("stat-magazine-capacity", "stat", ["彈匣容量", "弹匣容量", "Magazine Capacity"], "Magazine Capacity", ["Mag Size"], [], "weapon_stat", "approved", "A", ["translationDictionary"], []),
  entry("stat-fire-rate", "stat", ["射速", "Fire Rate"], "Fire Rate", ["Rate of Fire"], [], "weapon_stat", "approved", "A", ["translationDictionary", "external_weapon_reference"], []),
  entry("stat-dmg-reduction", "stat", ["傷害減免", "伤害减免", "DMG Reduction"], "DMG Reduction", ["Damage Reduction"], [], "defense_stat", "approved", "A", ["translationDictionary", "external_material_reference"], []),
  entry("stat-player-dmg-reduction", "stat", ["Player DMG Reduction"], "Player DMG Reduction", ["PvP DMG Reduction"], [], "defense_stat", "approved", "B", [], ["Unverified against original Chinese source."]),
  entry("stat-max-hp", "stat", ["最大生命值", "Max HP"], "Max HP", ["Maximum HP"], [], "defense_stat", "approved", "A", ["translationDictionary", "external_armor_reference"], []),
  entry("stat-hp", "stat", ["生命值", "HP"], "HP", ["Health"], [], "defense_stat", "approved", "A", ["external_armor_reference"], []),
  entry("stat-max-stamina", "stat", ["最大耐力", "Max Stamina"], "Max Stamina", ["Maximum Stamina"], [], "survival_stat", "approved", "A", ["translationDictionary", "external_material_reference"], []),
  entry("stat-movement-speed", "stat", ["移動速度", "移动速度", "Movement Speed"], "Movement Speed", [], [], "survival_stat", "approved", "A", ["translationDictionary", "external_material_reference"], [])
];

const suffixStatEntries: ModTerminologyEntry[] = [
  entry("stat-blaze-dmg", "stat", ["熾能屬性傷害", "熾能属性伤害"], "Blaze DMG", ["Blaze Damage"], ["Blaze Attribute Damage", "Scorching Energy Attribute Damage"], "elemental_damage_stat", "approved", "B", ["project_canonical_element_mapping"], ["Project canonical element label. Blaze corresponds to the Burn keyword/status family."]),
  entry("stat-shock-dmg", "stat", ["電離屬性傷害", "电离属性伤害"], "Shock DMG", ["Shock Damage"], ["Ionization DMG", "Ionization Damage", "Ionization Attribute Damage", "電離屬性Damage"], "elemental_damage_stat", "approved", "B", ["project_canonical_element_mapping"], ["Project canonical element label. Shock corresponds to the Power Surge keyword/status family. Do not use literal translation Ionization DMG."]),
  entry("stat-frost-dmg", "stat", ["寒霜屬性傷害", "寒霜属性伤害"], "Frost DMG", ["Frost Damage"], ["Frost Attribute Damage"], "elemental_damage_stat", "approved", "B", ["project_canonical_element_mapping"], ["Project canonical element label. Frost corresponds to the Frost Vortex keyword/status family."]),
  entry("stat-blast-dmg", "stat", ["爆炸傷害", "爆炸伤害"], "Blast DMG", ["Blast Damage"], ["Explosion DMG", "Explosion Damage"], "elemental_damage_stat", "approved", "B", ["project_canonical_element_mapping"], ["Project canonical element label. Blast corresponds to the Unstable Bomber keyword/status family. Do not use literal translation Explosion DMG."])
];

const effectPhraseEntries: ModTerminologyEntry[] = [
  entry("effect-all-monster-dmg-up", "effect_phrase", ["對所有怪物傷害提升"], "All Monster DMG Up", [], [], "effect_descriptor", "approved", "B", ["original_workbook"], ["Generic damage buff effect phrase appearing across multiple keyword suffix columns in block 2."]),
  entry("effect-crit-dmg-vs-marked", "effect_phrase", ["對獵人印記目標暴擊傷害"], "Crit DMG vs Marked Target", [], [], "effect_descriptor", "approved", "B", ["original_workbook"], ["Crit DMG effect conditional on Bullseye/The Bull's Eye mark. 印記 is a variant of 標記."]),
  entry("effect-weakspot-dmg-vs-marked", "effect_phrase", ["對獵人標記目標弱點傷害", "對獵人印記目標弱點傷害"], "Weakspot DMG vs Marked Target", [], [], "effect_descriptor", "approved", "B", ["original_workbook"], ["Weakspot DMG effect conditional on Bullseye/The Bull's Eye mark. Both 標記 and 印記 variants exist in source."])
];

const keywordEntries: ModTerminologyEntry[] = [
  entry("keyword-burn", "keyword", ["灼燒", "灼烧", "燃燒", "燃烧", "Burn"], "Burn", [], [], "elemental_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-power-surge", "keyword", ["電湧", "电涌", "Power Surge"], "Power Surge", [], ["Electric Surge"], "elemental_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-frost-vortex", "keyword", ["冰霜漩渦", "冰霜旋涡", "Frost Vortex"], "Frost Vortex", [], [], "elemental_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-bounce", "keyword", ["彈射", "弹射", "Bounce"], "Bounce", ["Ricochet"], [], "weapon_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-shrapnel", "keyword", ["碎彈", "碎弹", "Shrapnel"], "Shrapnel", [], [], "weapon_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-fast-gunner", "keyword", ["快槍手", "快枪手", "Fast Gunner"], "Fast Gunner", [], [], "weapon_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-unstable-bomber", "keyword", ["不穩定爆彈", "不稳定爆弹", "不穩定炸彈", "Unstable Bomber"], "Unstable Bomber", [], [], "weapon_keyword", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("keyword-fortress-warfare", "keyword", ["堡壘戰爭", "堡垒战术", "重裝陣地", "Fortress Warfare"], "Fortress Warfare", [], ["Fortress War", "Fortress Battle"], "build_keyword", "approved", "B", ["translationDictionary"], ["Confidence B: original Chinese term is ambiguous."]),
  entry("keyword-the-bulls-eye", "keyword", ["獵人標記", "猎人标记", "公牛眼", "The Bull's Eye", "Bullseye"], "The Bull's Eye", ["Bullseye", "Hunter's Mark"], ["Mark"], "build_keyword", "approved", "B", ["translationDictionary"], ["Bullseye and The Bull's Eye are used interchangeably; original Chinese 獵人標記 means Hunter's Mark."]),
  entry("keyword-bullseye-alias", "keyword", ["公牛眼", "Bullseye"], "Bullseye", ["The Bull's Eye", "Hunter's Mark"], ["Mark"], "build_keyword", "approved", "A", ["translationDictionary"], ["Alias for The Bull's Eye. Official English may use Bullseye."])
];

const generalSuffixEntries: ModTerminologyEntry[] = [
  entry("suffix-violent", "suffix_name", ["暴烈", "Violent"], "Violent", [], [], "general_suffix", "approved", "B", ["original_workbook"], ["Chinese source confirmed from source sheet."]),
  entry("suffix-precision", "suffix_name", ["精準", "Precision"], "Precision", [], [], "general_suffix", "approved", "B", ["original_workbook"], ["Chinese source confirmed from source sheet."]),
  entry("suffix-talents", "suffix_name", ["異能", "Talents"], "Talents", [], [], "general_suffix", "approved", "B", ["original_workbook"], ["Chinese source confirmed from source sheet. NOTE: 'Talents' as a mod suffix type has been deprecated in the most recent major mod patch; renamed to 'Deviant Energy'. The DE variant entries (Wild DE, Phantasmal DE, etc.) reflect the current naming convention."]),
  entry("suffix-battle", "suffix_name", ["通用", "Battle"], "Battle", ["Universal"], [], "general_suffix", "approved", "B", ["original_workbook"], ["Chinese source 通用 confirmed from source sheet; may also map to Universal."]),
  entry("suffix-battlefield", "suffix_name", ["生存", "Battlefield"], "Battlefield", ["Survival"], [], "general_suffix", "approved", "B", ["original_workbook"], ["Chinese source 生存 confirmed from source sheet; may also map to Survival."]),
  entry("suffix-resonance", "suffix_name", ["共振", "Resonance"], "Resonance", [], [], "general_suffix", "approved", "B", ["original_workbook"], ["Chinese source confirmed from source sheet."]),
  entry("suffix-melee", "suffix_name", ["近戰預設", "Melee"], "Melee", ["Melee Default"], [], "general_suffix", "approved", "B", ["original_workbook", "translationDictionary"], ["近戰預設 is the melee variant general suffix, appearing alongside Violent/Precision/Talents/Battle/Battlefield. 預設 means default/preset; approved English is Melee."]),
  entry("suffix-mirror", "suffix_name", ["虛實"], "Mirror", [], ["Phantasmal", "Mirage", "Reality/Illusion", "Virtual/Real"], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Owner-corrected mapping during Module 5 final suffix identification pass. 虛實 maps to Mirror, not Phantasmal or Mirage."]),
  entry("suffix-wild", "suffix_name", ["蠻荒", "Wild"], "Wild", [], [], "mod_suffix", "approved", "B", ["project_owner_canonical_suffix_mapping", "source_sheet_context"], ["蠻荒 is a proximity-based damage suffix; project-owner correction confirms canonical English is Wild."]),
  entry("suffix-phantasmal", "suffix_name", ["幻境", "Phantasmal"], "Phantasmal", [], [], "mod_suffix", "approved", "B", ["project_owner_canonical_suffix_mapping", "source_sheet_context"], ["幻境 is a back-attack/positioning suffix; project-owner correction confirms canonical English is Phantasmal."]),
  entry("suffix-lunar", "suffix_name", ["月兆"], "Lunar", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Owner-approved during Module 5 final suffix identification pass. Not claimed as official localization evidence."]),
  entry("suffix-crescent", "suffix_name", ["月守"], "Crescent", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Owner-approved during Module 5 final suffix identification pass. Not claimed as official localization evidence."]),
  entry("suffix-downstar", "suffix_name", ["墜星"], "Downstar", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Owner-approved during Module 5 final suffix identification pass. Not claimed as official localization evidence."]),
  entry("suffix-battle-struggle", "suffix_name", ["抗爭"], "Battle", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Owner-approved during Module 5 final suffix identification pass. 抗爭 maps to Battle (distinct from 通用→Battle entry suffix-battle). Not claimed as official localization evidence."])
];

const deviantEnergySuffixEntries: ModTerminologyEntry[] = [
  entry("suffix-wild-de", "suffix_name", ["蠻荒異能", "Wild Deviant Energy"], "Wild Deviant Energy", [], [], "mod_suffix", "approved", "B", ["project_owner_canonical_suffix_mapping", "source_sheet_context"], ["Deviant Energy variant of 蠻荒 (Wild). All mod suffixes have a Deviant Energy variant sharing the same stat scaling."]),
  entry("suffix-phantasmal-de", "suffix_name", ["幻境異能", "Phantasmal Deviant Energy"], "Phantasmal Deviant Energy", [], [], "mod_suffix", "approved", "B", ["project_owner_canonical_suffix_mapping", "source_sheet_context"], ["Deviant Energy variant of 幻境 (Phantasmal)."]),
  entry("suffix-resonance-de", "suffix_name", ["共振異能", "Resonance Deviant Energy"], "Resonance Deviant Energy", [], [], "mod_suffix", "approved", "B", ["project_owner_canonical_suffix_mapping", "source_sheet_context"], ["Deviant Energy variant of 共振 (Resonance). 共振 is already approved as Resonance in the terminology registry."]),
  entry("suffix-mirror-de", "suffix_name", ["虛實異能"], "Mirror Deviant Energy", [], ["Phantasmal Deviant Energy", "Mirage Deviant Energy"], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Owner-corrected Deviant Energy variant. 虛實異能 maps to Mirror Deviant Energy."]),
  entry("suffix-lunar-de", "suffix_name", ["月兆異能"], "Lunar Deviant Energy", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Deviant Energy variant of 月兆 (Lunar)."]),
  entry("suffix-crescent-de", "suffix_name", ["月守異能"], "Crescent Deviant Energy", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Deviant Energy variant of 月守 (Crescent)."]),
  entry("suffix-downstar-de", "suffix_name", ["墜星異能"], "Downstar Deviant Energy", [], [], "mod_suffix", "approved", "B", ["project_owner_game_knowledge", "module_5_human_suffix_identification"], ["Deviant Energy variant of 墜星 (Downstar)."])
];

const keywordSuffixEntries: ModTerminologyEntry[] = [
  entry("suffix-burn", "suffix_name", ["灼燒", "灼烧", "Burn"], "Burn", [], [], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-power-surge", "suffix_name", ["電湧", "电涌", "Power Surge"], "Power Surge", [], ["Electric Surge"], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-frost-vortex", "suffix_name", ["冰霜漩渦", "冰霜旋涡", "Frost Vortex"], "Frost Vortex", [], [], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-bounce", "suffix_name", ["彈射", "弹射", "Bounce"], "Bounce", ["Ricochet"], [], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-shrapnel", "suffix_name", ["碎彈", "碎弹", "Shrapnel"], "Shrapnel", [], [], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-fast-gunner", "suffix_name", ["快槍手", "快枪手", "Fast Gunner"], "Fast Gunner", [], [], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-unstable-bomber", "suffix_name", ["不穩定爆彈", "不稳定爆弹", "Unstable Bomber"], "Unstable Bomber", [], [], "keyword_suffix", "approved", "A", ["translationDictionary", "original_workbook"], []),
  entry("suffix-fortress-warfare", "suffix_name", ["堡壘戰爭", "堡垒战术", "Fortress Warfare"], "Fortress Warfare", [], ["Fortress War", "Fortress Battle"], "keyword_suffix", "approved", "B", ["translationDictionary"], []),
  entry("suffix-the-bulls-eye", "suffix_name", ["獵人標記", "猎人标记", "公牛眼", "The Bull's Eye"], "The Bull's Eye", ["Bullseye", "Hunter's Mark"], ["Mark"], "keyword_suffix", "approved", "B", ["translationDictionary"], [])
];

const badTranslationEntries: ModTerminologyEntry[] = [
  entry("bad-violent-injury", "stat", ["Violent Injury", "暴擊傷害"], "Crit DMG", [], ["Violent Injury"], "damage_stat", "needs_review", "C", ["overlay_candidate"], ["Violent Injury is a known mistranslation of 暴擊傷害 which means Crit DMG."]),
  entry("bad-weakness-damage", "stat", ["Weakness Damage", "弱點傷害"], "Weakspot DMG", [], ["Weakness Damage"], "damage_stat", "needs_review", "C", ["overlay_candidate"], ["Weakness Damage is a known mistranslation of 弱點傷害 which means Weakspot DMG."]),
  entry("bad-abnormal-damage", "stat", ["Abnormal Damage", "異常傷害"], "Status DMG", [], ["Abnormal Damage"], "damage_stat", "needs_review", "C", ["overlay_candidate"], ["Abnormal Damage is a known mistranslation of 異常傷害 which means Status DMG."]),
  entry("bad-electric-surge", "keyword", ["Electric Surge", "電湧"], "Power Surge", [], ["Electric Surge"], "elemental_keyword", "needs_review", "C", ["overlay_candidate"], ["Electric Surge is a known mistranslation of 電湧 which means Power Surge."]),
  entry("bad-mark-bullseye", "keyword", ["Mark", "標記"], "The Bull's Eye", ["Bullseye"], ["Mark"], "build_keyword", "needs_review", "C", ["overlay_candidate", "translationDictionary"], ["Mark is ambiguous; in context of 標記 referencing 獵人標記 it means Bullseye / The Bull's Eye."]),
  entry("bad-fortress-war", "keyword", ["Fortress War", "Fortress Battle", "堡壘戰爭"], "Fortress Warfare", [], ["Fortress War", "Fortress Battle"], "build_keyword", "needs_review", "C", ["overlay_candidate"], ["Fortress War / Fortress Battle are known mistranslations; approved form is Fortress Warfare."])
];

const allEntries: ModTerminologyEntry[] = [
  ...statEntries,
  ...suffixStatEntries,
  ...effectPhraseEntries,
  ...keywordEntries,
  ...generalSuffixEntries,
  ...deviantEnergySuffixEntries,
  ...keywordSuffixEntries,
  ...badTranslationEntries
];

function buildRegistry(): ModTerminologyRegistry {
  return {
    module: "mod_terminology_registry",
    moduleStatus: "verified_snapshot_locked",
    locked: true,
    generatedAt: new Date().toISOString(),
    entries: allEntries
  };
}

export function getRegistry(): ModTerminologyRegistry {
  const registry = buildRegistry();
  const parsed = modTerminologyRegistrySchema.safeParse(registry);
  if (!parsed.success) {
    throw new Error(`Mod terminology registry validation failed:\n${formatZodError(parsed.error).join("\n")}`);
  }
  return parsed.data;
}

export function writeRegistry(outputPath?: string): ModTerminologyRegistry {
  const registry = getRegistry();
  const resolvedPath = outputPath ?? path.join(ROOT_DIR, "data", "verified", "mod-terminology-registry.verified.json");
  fs.writeFileSync(resolvedPath, JSON.stringify(registry, null, 2), "utf8");
  return registry;
}

export function lookupApprovedModTerm(input: string, termType?: string): ModTerminologyEntry | null {
  const lowered = input.toLowerCase().trim();
  for (const entry of allEntries) {
    if (termType && entry.termType !== termType) continue;
    if (entry.approvedEnglish?.toLowerCase() === lowered) return entry;
    if (entry.aliasesEnglish.some((a) => a.toLowerCase() === lowered)) return entry;
    if (entry.sourceOriginalTerms.some((s) => s.toLowerCase() === lowered)) return entry;
  }
  return null;
}

export function normalizeModTerm(input: string, termType?: string): string | null {
  const entry = lookupApprovedModTerm(input, termType);
  return entry?.approvedEnglish ?? null;
}

export function flagBadModTranslation(originalTerm: string, candidateEnglish: string): { isBad: boolean; approvedEnglish: string | null; entry: ModTerminologyEntry | null } {
  const lowered = candidateEnglish.toLowerCase();
  for (const entry of allEntries) {
    if (entry.badTranslations.some((bt) => bt.toLowerCase() === lowered)) {
      return { isBad: true, approvedEnglish: entry.approvedEnglish, entry };
    }
  }
  const approved = lookupApprovedModTerm(originalTerm);
  return { isBad: false, approvedEnglish: approved?.approvedEnglish ?? null, entry: approved };
}

export function getAliasesForTerm(approvedEnglish: string): string[] {
  const entry = allEntries.find((e) => e.approvedEnglish?.toLowerCase() === approvedEnglish.toLowerCase());
  return entry?.aliasesEnglish ?? [];
}

export function getEntriesByType(termType: ModTerminologyEntry["termType"]): ModTerminologyEntry[] {
  return allEntries.filter((e) => e.termType === termType);
}

export function getEntriesByStatus(status: ModTerminologyEntry["status"]): ModTerminologyEntry[] {
  return allEntries.filter((e) => e.status === status);
}

if (require.main === module) {
  try {
    const registry = writeRegistry();
    const approved = registry.entries.filter((e) => e.status === "approved").length;
    const needsReview = registry.entries.filter((e) => e.status === "needs_review").length;
    console.log(`Mod terminology registry generated: ${registry.entries.length} entries`);
    console.log(`Approved: ${approved}`);
    console.log(`Needs review: ${needsReview}`);
    console.log("Output: data/verified/mod-terminology-registry.verified.json");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
