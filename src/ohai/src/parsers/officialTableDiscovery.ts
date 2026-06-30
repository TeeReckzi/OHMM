import * as fs from "node:fs";
import * as path from "node:path";

export type OfficialTableCategory =
  | "weapon"
  | "accessory"
  | "ammo"
  | "equipment"
  | "buff"
  | "keyword"
  | "formula"
  | "combat-node"
  | "camera-recoil"
  | "global"
  | "item"
  | "runtime-helper"
  | "standard-library"
  | "unknown";

export type OfficialTablePriority = "critical" | "high" | "medium" | "low" | "ignore";

export interface OfficialTableManifestEntry {
  tableName: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
  category: OfficialTableCategory;
  priority: OfficialTablePriority;
  isCompiledPython: boolean;
  isLikelyBindictBacked: boolean;
  leakedStrings: string[];
  fieldCandidates: string[];
  relationshipHints: string[];
  normalizationWarnings: string[];
}

export interface OfficialTableManifest {
  generatedAt: string;
  sourceRoot: string;
  totalFilesScanned: number;
  tableCount: number;
  criticalTables: string[];
  highValueTables: string[];
  entries: OfficialTableManifestEntry[];
}

const STRING_SCAN_LIMIT = 300_000;
const MAX_STRINGS_PER_FILE = 260;
const MAX_FIELDS_PER_FILE = 160;

const STANDARD_LIBRARY_ROOTS = new Set([
  "asyncio",
  "Crypto",
  "email",
  "encodings",
  "html",
  "http",
  "importlib",
  "json",
  "logging",
  "multiprocessing",
  "unittest",
  "urllib",
  "xml",
]);

const CATEGORY_PATTERNS: Array<[OfficialTableCategory, RegExp[]]> = [
  ["weapon", [/gun_/i, /weapon/i, /shoot/i, /bullet_pattern/i, /guncore/i]],
  ["accessory", [/accessory/i, /muzzle/i, /barrel/i, /sights/i, /stock/i, /clip/i, /under_barrel/i, /trigger/i]],
  ["ammo", [/ammo/i, /ammunition/i, /bullet/i]],
  ["equipment", [/equip/i, /armor/i, /suit/i, /fashion/i]],
  ["buff", [/buff/i, /cuisine/i, /food/i]],
  ["keyword", [/keyword/i, /scorch/i, /surge/i, /vortex/i, /shrap/i, /blast/i, /bounce/i]],
  ["formula", [/formula/i, /damage_formula/i]],
  ["combat-node", [/logic_tree/i, /NodeAttack/i, /NodeDamage/i, /NodeTakeDamage/i, /NodeDurativeAttack/i]],
  ["camera-recoil", [/cam_/i, /recoil/i, /viewkick/i, /shake/i, /sway/i]],
  ["global", [/global_params/i, /global/i]],
  ["item", [/item_data/i, /goods/i, /drop/i]],
  ["runtime-helper", [/helper/i, /utility/i, /manager/i, /mgr/i, /adapter/i]],
];

const CRITICAL_PATTERNS = [
  /buff_data/i,
  /gun_setting_data/i,
  /gun_base_params_data/i,
  /gun_bullet_params_data/i,
  /gun_blueprint_attr_data/i,
  /gun_accessory_.*params_data/i,
  /gun_accessory_slot_params_data/i,
  /gun_accessory_base_params_data/i,
  /gun_accessory_item_to_accessory_map_data/i,
  /effect_keyword_item_data/i,
  /passive_skill_damage_simulate_data/i,
  /formula_const/i,
  /CompDamageFormula/i,
  /CompFormulaAdapter/i,
  /NodeDamage/i,
  /NodeTakeDamage/i,
  /NodeAttack/i,
  /equip_data/i,
  /equip_combine_data/i,
  /equip_rule_data/i,
  /item_data/i,
];

const HIGH_PATTERNS = [
  /bullet_pattern_data/i,
  /gun_acc_strength_data/i,
  /gun_ads_params_data/i,
  /gun_rotate_speed_data/i,
  /gun_light_hit_strength/i,
  /cam_recoil_data/i,
  /cam_viewkick/i,
  /cam_shoulder_shoot/i,
  /global_params_data/i,
  /BuffDataHelper/i,
  /buff_utility/i,
  /RuntimeDataMgr/i,
  /logic_tree_utility/i,
  /CompShootKeywordSimulate/i,
  /CompGunAccessory/i,
];

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const stack = [root];
  const files: string[] = [];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      if (entry.isFile()) files.push(fullPath);
    }
  }
  return files.sort();
}

function tableNameFor(filePath: string): string {
  return path.basename(filePath).replace(/\.(pyc|py|json|txt|htm|html)$/i, "");
}

function isStandardLibraryLike(relativePath: string): boolean {
  const first = relativePath.split(/[\\/]+/).filter(Boolean)[0];
  return STANDARD_LIBRARY_ROOTS.has(first);
}

function categoryFor(relativePath: string, tableName: string): OfficialTableCategory {
  if (isStandardLibraryLike(relativePath)) return "standard-library";
  const haystack = `${relativePath} ${tableName}`;
  for (const [category, patterns] of CATEGORY_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(haystack))) return category;
  }
  return "unknown";
}

function priorityFor(relativePath: string, tableName: string, category: OfficialTableCategory): OfficialTablePriority {
  const haystack = `${relativePath} ${tableName}`;
  if (category === "standard-library") return "ignore";
  if (CRITICAL_PATTERNS.some((pattern) => pattern.test(haystack))) return "critical";
  if (HIGH_PATTERNS.some((pattern) => pattern.test(haystack))) return "high";
  if (["weapon", "accessory", "ammo", "equipment", "buff", "keyword", "formula", "combat-node", "global", "item"].includes(category)) return "medium";
  return "low";
}

function extractAsciiStrings(buffer: Buffer): string[] {
  const slice = buffer.subarray(0, Math.min(buffer.length, STRING_SCAN_LIMIT));
  const strings: string[] = [];
  let current = "";
  for (const byte of slice) {
    if (byte >= 32 && byte <= 126) current += String.fromCharCode(byte);
    else {
      if (current.length >= 3) strings.push(current);
      current = "";
    }
  }
  if (current.length >= 3) strings.push(current);
  return [...new Set(strings)].filter((value) => !/^[-_=]{4,}$/.test(value)).slice(0, MAX_STRINGS_PER_FILE);
}

function extractFieldCandidates(strings: string[]): string[] {
  const fields = new Set<string>();
  const snakeCasePattern = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;
  const classLikePattern = /\b(?:Comp|Node|Attr|Formula|Runtime|Keyword|Gun|Buff|Effect|Attack|Damage)[A-Za-z0-9]+\b/g;
  for (const value of strings) {
    for (const match of value.matchAll(snakeCasePattern)) {
      const field = match[0];
      if (field.length <= 72 && !field.includes("__")) fields.add(field);
    }
    for (const match of value.matchAll(classLikePattern)) fields.add(match[0]);
  }
  return [...fields].sort().slice(0, MAX_FIELDS_PER_FILE);
}

function relationshipHintsFor(fields: string[], strings: string[], tableName: string): string[] {
  const all = `${tableName} ${fields.join(" ")} ${strings.join(" ")}`;
  const hints = new Set<string>();
  if (/buff_id|buff_tag|buff_data|logic_tree_data/.test(all)) hints.add("buff -> logic tree / runtime effect graph");
  if (/keyword|keyword_damage_type|base_repeat_cnt|base_aoe_radius/.test(all)) hints.add("keyword -> proc simulation / damage feature routing");
  if (/gun_no|gun_setting|gun_base|gun_bullet|bullet_pattern/.test(all)) hints.add("gun_no -> weapon runtime params");
  if (/accessory_no|slot_type|socket_name|accessory_model_path/.test(all)) hints.add("accessory_no + slot_type -> weapon assembly graph");
  if (/equip|suit|combine|rule/.test(all)) hints.add("equipment -> set/slot/rule validation");
  if (/formula|final_attack_rate_dic|attacker_infos|damage_formula/.test(all)) hints.add("formula adapter -> staged damage evaluation");
  if (/pvp|weak|toughness|durability|species/.test(all)) hints.add("combat context -> PvP/weakspot/toughness/species scaling");
  if (/item_id|item_no|goods|drop/.test(all)) hints.add("item identity -> inventory/build selection mapping");
  return [...hints].sort();
}

function warningsFor(isLikelyBindictBacked: boolean, isCompiledPython: boolean, fieldCandidates: string[], priority: OfficialTablePriority): string[] {
  const warnings: string[] = [];
  if (isCompiledPython) warnings.push("Compiled .pyc table: use bytecode/string extraction, patched magic decompiler, or scripts/bindict_parser.py for candidate row decoding.");
  if (isLikelyBindictBacked) warnings.push("Generated bindict payload likely present: schema strings are extractable; try scripts/bindict_parser.py before treating rows as unrecoverable.");
  if (fieldCandidates.length === 0 && priority !== "ignore") warnings.push("No obvious fields found in scan window; inspect manually or increase scan limit.");
  return warnings;
}

export function discoverOfficialTables(sourceRoot: string): OfficialTableManifest {
  const absoluteRoot = path.resolve(sourceRoot);
  const files = walkFiles(absoluteRoot);
  const entries: OfficialTableManifestEntry[] = [];
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    if (![".py", ".pyc", ".json", ".txt", ".htm", ".html"].includes(extension)) continue;
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(absoluteRoot, filePath).replace(/\\/g, "/");
    const tableName = tableNameFor(filePath);
    const category = categoryFor(relativePath, tableName);
    const priority = priorityFor(relativePath, tableName, category);
    let leakedStrings: string[] = [];
    let fieldCandidates: string[] = [];
    let isLikelyBindictBacked = false;
    try {
      const buffer = fs.readFileSync(filePath);
      leakedStrings = extractAsciiStrings(buffer);
      fieldCandidates = extractFieldCandidates(leakedStrings);
      isLikelyBindictBacked = leakedStrings.some((value) => value.includes("bindict") || value.includes("data =") || value.includes("client_data"));
    } catch {
      // Keep entry, but mark it as lacking extracted schema.
    }
    const isCompiledPython = extension === ".pyc";
    entries.push({
      tableName,
      relativePath,
      extension,
      sizeBytes: stat.size,
      category,
      priority,
      isCompiledPython,
      isLikelyBindictBacked,
      leakedStrings,
      fieldCandidates,
      relationshipHints: relationshipHintsFor(fieldCandidates, leakedStrings, tableName),
      normalizationWarnings: warningsFor(isLikelyBindictBacked, isCompiledPython, fieldCandidates, priority),
    });
  }
  const priorityRank: Record<OfficialTablePriority, number> = { critical: 0, high: 1, medium: 2, low: 3, ignore: 4 };
  entries.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.relativePath.localeCompare(b.relativePath));
  return {
    generatedAt: new Date().toISOString(),
    sourceRoot: absoluteRoot,
    totalFilesScanned: files.length,
    tableCount: entries.length,
    criticalTables: entries.filter((entry) => entry.priority === "critical").map((entry) => entry.relativePath),
    highValueTables: entries.filter((entry) => entry.priority === "high").map((entry) => entry.relativePath),
    entries,
  };
}

export function writeOfficialTableManifest(manifest: OfficialTableManifest, outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "official-table-manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(outDir, "official-table-schema-summary.json"),
    JSON.stringify(
      manifest.entries.map((entry) => ({
        tableName: entry.tableName,
        relativePath: entry.relativePath,
        category: entry.category,
        priority: entry.priority,
        fields: entry.fieldCandidates,
        relationships: entry.relationshipHints,
        warnings: entry.normalizationWarnings,
      })),
      null,
      2
    )
  );
}

export function formatOfficialTableReport(manifest: OfficialTableManifest): string {
  const byPriority = manifest.entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.priority] = (acc[entry.priority] ?? 0) + 1;
    return acc;
  }, {});
  const critical = manifest.entries.filter((entry) => entry.priority === "critical").slice(0, 25);
  const high = manifest.entries.filter((entry) => entry.priority === "high").slice(0, 25);
  return [
    "Official table discovery complete.",
    `Source root: ${manifest.sourceRoot}`,
    `Files scanned: ${manifest.totalFilesScanned}`,
    `Manifest entries: ${manifest.tableCount}`,
    `Priority counts: ${JSON.stringify(byPriority)}`,
    "",
    "Critical tables:",
    ...critical.map((entry) => `- ${entry.relativePath} [${entry.category}] fields=${entry.fieldCandidates.slice(0, 12).join(", ")}`),
    "",
    "High-value tables:",
    ...high.map((entry) => `- ${entry.relativePath} [${entry.category}] fields=${entry.fieldCandidates.slice(0, 12).join(", ")}`),
  ].join("\n");
}
