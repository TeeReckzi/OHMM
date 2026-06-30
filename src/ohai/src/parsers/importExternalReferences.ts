import fs from "node:fs";
import path from "node:path";
import {
  externalReferenceIndexSchema,
  formatZodError,
  knownSourceUrlBases,
  referenceRowSchema
} from "../schemas/externalReferenceSchema";
import type { ReferenceRowData } from "../schemas/externalReferenceSchema";
import {
  generateSlug,
  isNoiseRow,
  determineSourceLookupStatus,
  buildCanonicalSourceUrl,
  parseWeaponMetadata,
  parseArmorMetadata,
  deriveGearSlotVariantsStats
} from "../utils/externalReferenceUtils";

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const RAW_REF_DIR = path.join(ROOT_DIR, "data", "raw", "external-references");
const EXTRACTED_REF_DIR = path.join(ROOT_DIR, "data", "extracted", "external-references");

interface FileConfig {
  sourceFilename: string;
  sourcePath: string;
  fileId: string;
  referenceType: "external_weapon_reference" | "external_armor_reference" | "external_material_reference" | "unknown_reference";
  sourceUrlBaseKey: string | null;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}

function main(): void {
  fs.mkdirSync(RAW_REF_DIR, { recursive: true });
  fs.mkdirSync(EXTRACTED_REF_DIR, { recursive: true });

  const fileConfigs: FileConfig[] = [
    {
      sourceFilename: "once_human_materials_reference.json",
      sourcePath: path.join(RAW_REF_DIR, "once_human_materials_reference.json"),
      fileId: "materials_ref",
      referenceType: "external_material_reference",
      sourceUrlBaseKey: null
    },
    {
      sourceFilename: "once_human_weapons_reference.json",
      sourcePath: path.join(RAW_REF_DIR, "once_human_weapons_reference.json"),
      fileId: "weapons_ref",
      referenceType: "external_weapon_reference",
      sourceUrlBaseKey: null
    },
    {
      sourceFilename: "once_human_english_reference.json",
      sourcePath: path.join(RAW_REF_DIR, "once_human_english_reference.json"),
      fileId: "armor_ref",
      referenceType: "external_armor_reference",
      sourceUrlBaseKey: null
    }
  ];

  const allReferences: ReferenceRowData[] = [];
  const missingFiles: string[] = [];
  let filesDetected = 0;
  let filesImported = 0;
  let totalWeaponRows = 0;
  let totalArmorRows = 0;
  let totalMaterialRows = 0;
  let totalGame8Rows = 0;
  let totalNoiseFlagged = 0;
  let totalBlankSlug = 0;
  let totalGeneratedUrl = 0;

  for (const config of fileConfigs) {
    filesDetected += 1;
    const exists = fs.existsSync(config.sourcePath);
    if (!exists) {
      console.log(`MISSING: ${config.sourceFilename} not found at ${config.sourcePath}`);
      missingFiles.push(config.sourceFilename);
      continue;
    }

    filesImported += 1;
    const rawJson = fs.readFileSync(config.sourcePath, "utf8");
    let rows: unknown[];
    try {
      rows = JSON.parse(rawJson);
      if (!Array.isArray(rows)) {
        console.log(`WARNING: ${config.sourceFilename} is not an array; skipping.`);
        continue;
      }
    } catch {
      console.log(`WARNING: ${config.sourceFilename} is not valid JSON; skipping.`);
      continue;
    }

    let fileWeaponRows = 0;
    let fileArmorRows = 0;
    let fileMaterialRows = 0;
    let fileGame8Rows = 0;
    let fileNoiseFlagged = 0;
    let fileBlankSlug = 0;
    let fileGeneratedUrl = 0;

    const sourceUrlBase = config.sourceUrlBaseKey
      ? (knownSourceUrlBases[config.sourceUrlBaseKey] ?? null)
      : null;

    for (const row of rows) {
      if (typeof row !== "object" || row === null) continue;

      const rowRecord = row as Record<string, unknown>;
      const englishName = String(rowRecord.english_name ?? rowRecord.englishName ?? "");
      const sourceSlug = String(rowRecord.source_slug ?? rowRecord.sourceSlug ?? "");
      const tierClassification = String(rowRecord.tier_classification ?? rowRecord.tierClassification ?? "");
      const metadataDump = String(rowRecord.metadata_dump ?? rowRecord.metadataDump ?? "");
      const gearSlotVariants = rowRecord.gear_slot_variants ?? rowRecord.gearSlotVariants ?? null;
      const totalVariants = typeof rowRecord.total_variants === "number" ? rowRecord.total_variants :
        typeof rowRecord.totalVariants === "number" ? rowRecord.totalVariants : null;

      const noiseCheck = isNoiseRow(englishName);

      const effectiveSourceSlug = sourceSlug && sourceSlug.length > 0 ? sourceSlug : null;
      if (!effectiveSourceSlug) fileBlankSlug += 1;

      const generated = !noiseCheck.isNoise ? generateSlug(englishName) : null;

      const lookupStatus = determineSourceLookupStatus(effectiveSourceSlug, sourceUrlBase);
      const canonicalUrl = buildCanonicalSourceUrl(sourceUrlBase, effectiveSourceSlug);
      if (canonicalUrl) fileGeneratedUrl += 1;

      let weaponStats = null;
      let armorStats = null;
      let materialStats = null;

      if (config.referenceType === "external_weapon_reference") {
        weaponStats = parseWeaponMetadata(metadataDump);
      } else if (config.referenceType === "external_armor_reference") {
        armorStats = parseArmorMetadata(metadataDump);
      } else if (config.referenceType === "external_material_reference" && gearSlotVariants && Array.isArray(gearSlotVariants)) {
        materialStats = deriveGearSlotVariantsStats(gearSlotVariants as Array<Record<string, unknown>>);
      }

      const isWeaponData = config.referenceType === "external_weapon_reference";
      const isArmorData = config.referenceType === "external_armor_reference";
      const isMaterialData = config.referenceType === "external_material_reference";

      const referenceRow: ReferenceRowData = {
        id: `${config.fileId}_${String(rowRecord.id_index ?? allReferences.length + 1)}`,
        englishName,
        referenceType: config.referenceType,
        sourceFilename: config.sourceFilename,
        fileId: config.fileId,
        sourceSlug: effectiveSourceSlug,
        generatedSlug: generated,
        sourceLookupStatus: lookupStatus,
        sourceUrlBase,
        canonicalSourceUrl: canonicalUrl,
        tierClassification: tierClassification || null,
        metadataDump: metadataDump || null,
        weaponStats,
        armorStats,
        materialStats,
        gearSlotVariants: gearSlotVariants && Array.isArray(gearSlotVariants)
          ? (gearSlotVariants as Array<Record<string, unknown>>) : null,
        totalVariants,
        isNoise: noiseCheck.isNoise,
        noiseReason: noiseCheck.reason,
        confidence: "raw_reference_not_verified"
      };

      if (noiseCheck.isNoise) {
        fileNoiseFlagged += 1;
      } else if (isWeaponData) {
        fileWeaponRows += 1;
      } else if (isArmorData) {
        fileArmorRows += 1;
      } else if (isMaterialData) {
        fileMaterialRows += 1;
      }

      allReferences.push(referenceRow);
    }

    totalWeaponRows += fileWeaponRows;
    totalArmorRows += fileArmorRows;
    totalMaterialRows += fileMaterialRows;
    totalGame8Rows += fileGame8Rows;
    totalNoiseFlagged += fileNoiseFlagged;
    totalBlankSlug += fileBlankSlug;
    totalGeneratedUrl += fileGeneratedUrl;

    console.log(`Imported ${config.sourceFilename}:`);
    console.log(`  Type: ${config.referenceType}`);
    console.log(`  Total rows: ${rows.length}`);
    console.log(`  Weapon rows: ${fileWeaponRows}`);
    console.log(`  Armor rows: ${fileArmorRows}`);
    console.log(`  Material rows: ${fileMaterialRows}`);
    console.log(`  Noise rows flagged: ${fileNoiseFlagged}`);
    console.log(`  Blank sourceSlug: ${fileBlankSlug}`);
    console.log(`  Generated URLs: ${fileGeneratedUrl}`);
  }

  const index = {
    module: "external_reference_intake" as const,
    moduleStatus: "raw_reference_not_verified" as const,
    locked: false as const,
    verifiedFilesTouched: false as const,
    importedAt: new Date().toISOString(),
    references: allReferences,
    summary: {
      filesDetected,
      filesImported,
      weaponReferenceRows: totalWeaponRows,
      armorReferenceRows: totalArmorRows,
      materialReferenceRows: totalMaterialRows,
      game8ModRows: totalGame8Rows,
      noiseRowsFlagged: totalNoiseFlagged,
      blankSourceSlugCount: totalBlankSlug,
      generatedUrlCount: totalGeneratedUrl,
      missingSourceFiles: missingFiles
    }
  };

  const parsed = externalReferenceIndexSchema.safeParse(index);
  if (!parsed.success) {
    console.error("External reference index failed validation:");
    for (const line of formatZodError(parsed.error)) {
      console.error(`- ${line}`);
    }
    return;
  }

  const outputPath = path.join(EXTRACTED_REF_DIR, "external-reference-index.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");
  console.log(`\nOutput written: ${outputPath}`);
  console.log(`Files detected: ${parsed.data.summary.filesDetected}`);
  console.log(`Files imported: ${parsed.data.summary.filesImported}`);
  console.log(`Total reference rows: ${parsed.data.references.length}`);
  console.log(`Weapon rows: ${parsed.data.summary.weaponReferenceRows}`);
  console.log(`Armor rows: ${parsed.data.summary.armorReferenceRows}`);
  console.log(`Material rows: ${parsed.data.summary.materialReferenceRows}`);
  console.log(`Game8 mod rows: ${parsed.data.summary.game8ModRows}`);
  console.log(`Noise rows flagged: ${parsed.data.summary.noiseRowsFlagged}`);
  console.log(`Blank sourceSlug: ${parsed.data.summary.blankSourceSlugCount}`);
  console.log(`Generated URLs: ${parsed.data.summary.generatedUrlCount}`);
  console.log(`Missing source files: ${missingFiles.length > 0 ? missingFiles.join(", ") : "none"}`);

  verifyCurrentPatch(parsed.data.references);
}

function verifyCurrentPatch(references: ReferenceRowData[]): void {
  console.log("\n=== Current-Patch Spot Checks ===");

  const aug = references.find((r) => r.englishName.includes("AUG - Electron Cloud"));
  console.log(`AUG - Electron Cloud: ${aug ? "FOUND" : "NOT FOUND"}`);

  const compound = references.find((r) => r.englishName.includes("Compound Bow - The Burden of Betrayal"));
  console.log(`Compound Bow - The Burden of Betrayal: ${compound ? "FOUND" : "NOT FOUND"}`);

  const magTop = references.find((r) => r.englishName === "Magnetic Moment Top");
  console.log(`Magnetic Moment Top: ${magTop ? "FOUND" : "NOT FOUND"}`);

  const glidePants = references.find((r) => r.englishName === "Glide Pants");
  console.log(`Glide Pants: ${glidePants ? "FOUND" : "NOT FOUND"}`);
}
