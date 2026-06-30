import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ammoRegistry } from "../src/ui/registries/ammoRegistry";
import { armorRegistry, keyGearRegistry } from "../src/ui/registries/armorRegistry";
import { attachmentRegistry } from "../src/ui/registries/attachmentRegistry";
import { cradleRegistry } from "../src/ui/registries/cradleRegistry";
import { deviationRegistry } from "../src/ui/registries/deviationRegistry";
import { foodBuffRegistry } from "../src/ui/registries/foodBuffRegistry";
import { modRegistry } from "../src/ui/registries/modRegistry";
import { pveTargetRegistry } from "../src/ui/registries/pveTargetRegistry";
import { weaponRegistry } from "../src/ui/registries/weaponRegistry";

type IdSourceTier = "runtime-registry" | "verified-json" | "official-semantic-table";

type CanonicalIdEntry = {
  domain: string;
  canonicalId: string;
  name?: string;
  sourceTier: IdSourceTier;
  sourceFile: string;
  confidence?: string;
  needsReview?: boolean;
  sourcePath?: string;
  aliases?: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ohaiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(ohaiRoot, "..", "..");
const outDir = path.join(ohaiRoot, "data", "canonical");
const outJson = path.join(outDir, "canonical-id-inventory.json");
const outMd = path.join(outDir, "canonical-id-inventory.md");

function rel(filePath: string): string {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function hasHanText(value: unknown): boolean {
  return typeof value === "string" && /[\u4e00-\u9fff]/.test(value);
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function displayNameOf(item: any): string | undefined {
  const name = cleanString(
    item?.name ??
      item?.displayName ??
      item?.englishName ??
      item?.nameEnglish ??
      item?.normalized?.nameEnglish ??
      item?.normalized?.displayName ??
      item?.normalized?.name ??
      item?.original?.name
  );
  return hasHanText(name) ? undefined : name;
}

function registryEntry(domain: string, item: any, sourceFile: string): CanonicalIdEntry | undefined {
  const id = cleanString(item?.id);
  if (!id) return undefined;
  const aliases = [item?.slug, item?.originalName, item?.nameOriginal, item?.assetId, item?.iconId]
    .map(cleanString)
    .filter((value): value is string => Boolean(value) && value !== id);
  return {
    domain,
    canonicalId: id,
    name: displayNameOf(item),
    sourceTier: "runtime-registry",
    sourceFile,
    confidence: cleanString(item?.confidence),
    needsReview: Boolean(item?.needsReview),
    aliases: aliases.length > 0 ? [...new Set(aliases)] : undefined,
  };
}

function walkJsonIds(
  value: unknown,
  sourceFile: string,
  domain: string,
  out: CanonicalIdEntry[],
  trail: string[] = []
): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJsonIds(item, sourceFile, domain, out, [...trail, String(index)]));
    return;
  }

  const obj = value as Record<string, unknown>;
  const id = cleanString(obj.id);
  if (id) {
    out.push({
      domain,
      canonicalId: id,
      name: displayNameOf(obj),
      sourceTier: "verified-json",
      sourceFile,
      confidence: cleanString(obj.translationConfidence ?? (obj.normalized as any)?.translationConfidence ?? obj.confidence),
      needsReview: hasHanText(id) || hasHanText(displayNameOf(obj)),
      sourcePath: trail.join("."),
    });
  }

  for (const [key, child] of Object.entries(obj)) {
    if (key === "original" || key === "provenance") continue;
    walkJsonIds(child, sourceFile, domain, out, [...trail, key]);
  }
}

function domainFromVerifiedFile(fileName: string): string {
  return fileName
    .replace(/\.verified\.json$/i, "")
    .replace(/FINALjson\.json$/i, "")
    .replace(/FINAL\.json$/i, "")
    .replace(/_/g, "-");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFiles(full);
      return entry.isFile() && entry.name.endsWith(".json") ? [full] : [];
    })
    .sort();
}

const entries: CanonicalIdEntry[] = [];

const runtimeRegistries: Array<[string, any[], string]> = [
  ["weapon", weaponRegistry, "src/ohai/src/ui/registries/weaponRegistry.ts"],
  ["armor", armorRegistry, "src/ohai/src/ui/registries/armorRegistry.ts"],
  ["key-gear", keyGearRegistry, "src/ohai/src/ui/registries/armorRegistry.ts"],
  ["mod", modRegistry, "src/ohai/src/ui/registries/modRegistry.ts"],
  ["deviation", deviationRegistry, "src/ohai/src/ui/registries/deviationRegistry.ts"],
  ["food-buff", foodBuffRegistry, "src/ohai/src/ui/registries/foodBuffRegistry.ts"],
  ["cradle", cradleRegistry, "src/ohai/src/ui/registries/cradleRegistry.ts"],
  ["attachment", attachmentRegistry, "src/ohai/src/ui/registries/attachmentRegistry.ts"],
  ["ammo", ammoRegistry, "src/ohai/src/ui/registries/ammoRegistry.ts"],
  ["pve-target", pveTargetRegistry, "src/ohai/src/ui/registries/pveTargetRegistry.ts"],
];

for (const [domain, registry, sourceFile] of runtimeRegistries) {
  for (const item of registry) {
    const entry = registryEntry(domain, item, sourceFile);
    if (entry) entries.push(entry);
  }
}

const verifiedDirs = [path.join(ohaiRoot, "data", "verified"), path.join(repoRoot, "verified")];
const seenVerifiedFiles = new Set<string>();
for (const dir of verifiedDirs) {
  for (const filePath of listJsonFiles(dir)) {
    const fileName = path.basename(filePath);
    const duplicateKey = `${fileName}:${fs.statSync(filePath).size}`;
    if (seenVerifiedFiles.has(duplicateKey)) continue;
    seenVerifiedFiles.add(duplicateKey);
    walkJsonIds(readJson(filePath), rel(filePath), domainFromVerifiedFile(fileName), entries);
  }
}

const promotionSeedPath = path.join(
  ohaiRoot,
  "data",
  "official",
  "interpreted",
  "semantic-graph",
  "canonical-runtime-promotion-seed.json"
);
if (fs.existsSync(promotionSeedPath)) {
  const seed = readJson(promotionSeedPath) as any;
  for (const [entityType, tableNames] of Object.entries(seed.entityTypeIndex ?? {})) {
    if (!Array.isArray(tableNames)) continue;
    for (const tableName of tableNames) {
      if (typeof tableName !== "string" || tableName.length === 0) continue;
      entries.push({
        domain: `official:${entityType}`,
        canonicalId: tableName,
        name: tableName,
        sourceTier: "official-semantic-table",
        sourceFile: rel(promotionSeedPath),
        confidence: "schema-inferred",
        needsReview: entityType === "unknown_table",
      });
    }
  }
}

entries.sort((a, b) =>
  a.domain.localeCompare(b.domain) ||
  a.canonicalId.localeCompare(b.canonicalId) ||
  a.sourceTier.localeCompare(b.sourceTier) ||
  a.sourceFile.localeCompare(b.sourceFile)
);

const duplicateIds = new Map<string, CanonicalIdEntry[]>();
for (const entry of entries) {
  const key = `${entry.domain}:${entry.canonicalId}`;
  const bucket = duplicateIds.get(key) ?? [];
  bucket.push(entry);
  duplicateIds.set(key, bucket);
}

const duplicateGroups = [...duplicateIds.entries()]
  .filter(([, group]) => group.length > 1)
  .map(([key, group]) => ({
    key,
    count: group.length,
    sourceTiers: [...new Set(group.map((entry) => entry.sourceTier))],
    sourceFiles: [...new Set(group.map((entry) => entry.sourceFile))],
  }));

const summary = {
  generatedAt: new Date().toISOString(),
  entryCount: entries.length,
  uniqueDomainIdCount: duplicateIds.size,
  duplicateGroupCount: duplicateGroups.length,
  countsBySourceTier: Object.fromEntries(
    [...new Set(entries.map((entry) => entry.sourceTier))]
      .sort()
      .map((tier) => [tier, entries.filter((entry) => entry.sourceTier === tier).length])
  ),
  countsByDomain: Object.fromEntries(
    [...new Set(entries.map((entry) => entry.domain))]
      .sort()
      .map((domain) => [domain, entries.filter((entry) => entry.domain === domain).length])
  ),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outJson,
  JSON.stringify(
    {
      summary,
      duplicateGroups,
      entries,
    },
    null,
    2
  ) + "\n"
);

const mdLines = [
  "# Canonical ID Inventory",
  "",
  `Generated: ${summary.generatedAt}`,
  "",
  "## Summary",
  "",
  `- Entries: ${summary.entryCount}`,
  `- Unique domain/id pairs: ${summary.uniqueDomainIdCount}`,
  `- Duplicate domain/id groups: ${summary.duplicateGroupCount}`,
  "",
  "## Counts by Source Tier",
  "",
  ...Object.entries(summary.countsBySourceTier).map(([tier, count]) => `- ${tier}: ${count}`),
  "",
  "## Counts by Domain",
  "",
  ...Object.entries(summary.countsByDomain).map(([domain, count]) => `- ${domain}: ${count}`),
  "",
  "## Duplicate Groups",
  "",
  ...(duplicateGroups.length === 0
    ? ["- None"]
    : duplicateGroups.slice(0, 100).map((group) => `- ${group.key}: ${group.count} entries from ${group.sourceFiles.join(", ")}`)),
  "",
  duplicateGroups.length > 100 ? `_${duplicateGroups.length - 100} additional duplicate groups omitted from Markdown; see JSON._` : "",
  "",
].filter((line) => line !== undefined);

fs.writeFileSync(outMd, mdLines.join("\n"));

console.log(`Wrote ${rel(outJson)}`);
console.log(`Wrote ${rel(outMd)}`);
console.log(JSON.stringify(summary, null, 2));
