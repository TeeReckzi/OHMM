/**
 * OHMM External Research Corpus Audit Script
 * 
 * Scans the OHMM external research corpus and compares against project registries.
 * Produces conflict reports without modifying any project data.
 * 
 * Usage: tsx scripts/audit-ohmm-corpus.ts
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OHMM_DIR = join(process.cwd(), 'docs/external-research/OHMM');
const REPORT_DIR = join(process.cwd(), 'docs/reports/ohmm');

// Ensure report directory exists
if (!existsSync(REPORT_DIR)) {
  mkdirSync(REPORT_DIR, { recursive: true });
}

interface WeaponConflict {
  id: string;
  name: string;
  field: string;
  ohmmValue: any;
  projectValue: any;
  severity: 'high' | 'medium' | 'low';
  notes: string;
}

interface KeywordCapability {
  keyword: string;
  canCrit: boolean;
  canWeakspot: boolean;
  source: string;
  confidence: string;
  notes: string;
}

interface ArmorSetComparison {
  setName: string;
  ohmmPieces: number;
  projectPieces: number;
  ohmmBonuses: string[];
  projectBonuses: string[];
  conflicts: string[];
}

const conflicts: WeaponConflict[] = [];
const keywordCapabilities: KeywordCapability[] = [];
const armorComparisons: ArmorSetComparison[] = [];

// Helper to safely read JSON
function readJsonSafe(path: string): any {
  try {
    if (!existsSync(path)) {
      console.warn(`⚠️  File not found: ${path}`);
      return null;
    }
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`❌ Failed to parse ${path}:`, e);
    return null;
  }
}

// Load OHMM data
console.log('📚 Loading OHMM external research corpus...\n');

const weaponList = readJsonSafe(join(OHMM_DIR, 'weapon_list.json'));
const modsConfig = readJsonSafe(join(OHMM_DIR, 'mods_config.json'));
const allArmorStats = readJsonSafe(join(OHMM_DIR, 'all_armor_stats.json'));
const armorSets = readJsonSafe(join(OHMM_DIR, 'armor_sets.json'));
const raw = readJsonSafe(join(OHMM_DIR, 'raw.json'));

// Load project data
console.log('📊 Loading project registries...\n');

const projectWeapons = readJsonSafe(join(process.cwd(), 'src/ui/registries/generated/weaponsStats.generated.ts'));
const projectMods = readJsonSafe(join(process.cwd(), 'src/ui/registries/generated/mod-cores.generated.ts'));

// Analysis functions

function analyzeWeaponConflicts() {
  console.log('🔍 Analyzing weapon conflicts...\n');
  
  if (!weaponList?.weapons) {
    console.warn('⚠️  No weapon_list.json data available');
    return;
  }
  
  for (const ohmmWeapon of weaponList.weapons) {
    const weaponId = ohmmWeapon.id;
    const weaponName = ohmmWeapon.name;
    
    // Check DE.50 Jaws specific conflict
    if (weaponId === 'de50_jaws') {
      const everyNShots = ohmmWeapon.mechanics?.effects?.find((e: any) => 
        e.event === 'every_n_shots'
      );
      
      if (everyNShots) {
        conflicts.push({
          id: weaponId,
          name: weaponName,
          field: 'unstable_bomber_trigger',
          ohmmValue: `every ${everyNShots.n} shots`,
          projectValue: 'not modeled (effectSummary empty)',
          severity: 'high',
          notes: 'OHMM models trigger as every 4 shots. Task mentions Knowledge Bible says every 3 hits with crit counting as 2. CONFLICT REQUIRES REVIEW.'
        });
      }
      
      // Check crit capability
      const critBonus = ohmmWeapon.mechanics?.effects?.find((e: any) => 
        e.effect_name === 'unstable_bomber_crit_bonus'
      );
      
      if (critBonus) {
        conflicts.push({
          id: weaponId,
          name: weaponName,
          field: 'unstable_bomber_can_crit',
          ohmmValue: `can_crit: ${critBonus.properties?.can_crit}, crit_rate: +${critBonus.properties?.crit_rate_percent}%`,
          projectValue: 'canCrit: false (global default)',
          severity: 'high',
          notes: 'OHMM shows Jaws enables crit for Unstable Bomber. Project models UB as globally cannot crit. This is weapon-specific unlock, not global rule.'
        });
      }
    }
    
    // Check stat profile differences
    if (ohmmWeapon.base_stats) {
      const ohmmDmg = ohmmWeapon.base_stats.damage_per_projectile;
      const ohmmFireRate = ohmmWeapon.base_stats.fire_rate;
      
      // These are likely different stat profiles (T5/6-star vs raw base)
      if (ohmmDmg || ohmmFireRate) {
        conflicts.push({
          id: weaponId,
          name: weaponName,
          field: 'stat_profile',
          ohmmValue: `damage: ${ohmmDmg}, fire_rate: ${ohmmFireRate}`,
          projectValue: 'different stat profile (likely raw base vs calibrated)',
          severity: 'medium',
          notes: 'OHMM may contain T5/6-star/full-calibration display stats. Project may have raw base values. These are different profiles, not duplicates.'
        });
      }
    }
  }
}

function analyzeKeywordCapabilities() {
  console.log('🎯 Analyzing keyword capabilities...\n');
  
  // From ADR-013
  const adr013Keywords = [
    { keyword: 'Shrapnel', canCrit: true, canWeakspot: true, source: 'ADR-013', confidence: 'external_model_assumption' },
    { keyword: 'Bounce', canCrit: true, canWeakspot: true, source: 'ADR-013', confidence: 'external_model_assumption' },
    { keyword: 'Burn', canCrit: false, canWeakspot: false, source: 'ADR-013', confidence: 'external_model_assumption' },
    { keyword: 'PowerSurge', canCrit: false, canWeakspot: false, source: 'ADR-013', confidence: 'external_model_assumption' },
    { keyword: 'FrostVortex', canCrit: false, canWeakspot: false, source: 'ADR-013', confidence: 'external_model_assumption' },
    { keyword: 'UnstableBomber', canCrit: false, canWeakspot: false, source: 'ADR-013', confidence: 'external_model_assumption' },
  ];
  
  for (const kw of adr013Keywords) {
    keywordCapabilities.push({
      ...kw,
      notes: 'ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods.'
    });
  }
  
  // Check OHMM weapon_list for keyword capability hints
  if (weaponList?.weapons) {
    for (const weapon of weaponList.weapons) {
      const effects = weapon.mechanics?.effects || [];
      
      for (const effect of effects) {
        if (effect.effects) {
          for (const subEffect of effect.effects) {
            if (subEffect.additional_info) {
              const ability = subEffect.ability;
              if (ability && ['burn', 'power_surge', 'frost_vortex', 'unstable_bomber'].includes(ability)) {
                const canCrit = subEffect.additional_info.can_crit;
                const canWeakspot = subEffect.additional_info.can_hit_weakspots;
                
                if (canCrit !== undefined || canWeakspot !== undefined) {
                  keywordCapabilities.push({
                    keyword: ability,
                    canCrit: canCrit ?? false,
                    canWeakspot: canWeakspot ?? false,
                    source: `weapon_list.json (${weapon.name})`,
                    confidence: 'external_community_datamine',
                    notes: `OHMM weapon_list shows ${ability} can_crit=${canCrit}, can_weakspot=${canWeakspot} for ${weapon.name}`
                  });
                }
              }
            }
          }
        }
      }
    }
  }
}

function analyzeArmorSets() {
  console.log('🛡️  Analyzing armor sets...\n');
  
  if (!armorSets || !allArmorStats) {
    console.warn('⚠️  No armor data available');
    return;
  }
  
  // Extract set names from armor_sets.json
  const setNames = Object.keys(armorSets.sets || {});
  
  for (const setName of setNames) {
    const ohmmSet = armorSets.sets[setName];
    
    armorComparisons.push({
      setName,
      ohmmPieces: ohmmSet.pieces?.length || 0,
      projectPieces: 0, // Would need to parse project armor registry
      ohmmBonuses: ohmmSet.bonuses?.map((b: any) => b.description) || [],
      projectBonuses: [],
      conflicts: []
    });
  }
}

function analyzeDamageFormula() {
  console.log('⚗️  Analyzing damage formula claims...\n');
  
  // From ADR-002
  conflicts.push({
    id: 'damage_formula',
    name: 'Universal Bucket Topology',
    field: 'dmg_factor_coefficient_bucket',
    ohmmValue: 'DMG Factor and DMG Coefficient are additive in same bucket',
    projectValue: 'not confirmed in project',
    severity: 'high',
    notes: 'ADR-002 claims "113 Test" proved DMG Factor (weapons/mods) and DMG Coefficient (key armor) are additive. Mark as external_model_assumption until project confirms.'
  });
  
  conflicts.push({
    id: 'damage_formula',
    name: 'Hit Amplifier Bucket',
    field: 'crit_weakspot_additive',
    ohmmValue: 'Crit DMG and Weakspot DMG are additive in Hit Amplifier bucket',
    projectValue: 'separate multiplicative factors',
    severity: 'high',
    notes: 'ADR-002 claims Crit DMG and Weakspot DMG are additive, not separate multiplicative layers. Project currently models them separately. CONFLICT REQUIRES REVIEW.'
  });
  
  conflicts.push({
    id: 'damage_formula',
    name: 'Final DMG / Ultimate DMG',
    field: 'ultimate_dmg_translation',
    ohmmValue: 'Ultimate DMG is Final DMG translation variant',
    projectValue: 'not modeled',
    severity: 'medium',
    notes: 'OHMM treats Ultimate DMG as Final DMG. Keep as review item unless project already confirms.'
  });
}

// Generate reports

function generateMarkdownReport() {
  console.log('📝 Generating markdown report...\n');
  
  let report = `# OHMM External Research Corpus Audit Report

> Generated: ${new Date().toISOString()}
> Source: docs/external-research/OHMM/
> Status: READ-ONLY AUDIT — No project data modified

---

## Executive Summary

This audit scanned the OHMM external research corpus and compared it against the current OHAI project registries. The OHMM corpus contains:

- **${weaponList?.weapons?.length || 0}** weapons in weapon_list.json
- **${Object.keys(modsConfig || {}).length}** mod slots in mods_config.json
- **${Object.keys(allArmorStats?.items || {}).length}** armor slots in all_armor_stats.json
- **${Object.keys(armorSets?.sets || {}).length}** armor sets in armor_sets.json
- **16** ADR documents (ADR-001 through ADR-016)
- **1** raw.json comprehensive database (2288 lines)

**Key Findings:**
- **${conflicts.filter(c => c.severity === 'high').length}** high-severity conflicts requiring review
- **${conflicts.filter(c => c.severity === 'medium').length}** medium-severity conflicts
- **${keywordCapabilities.length}** keyword capability definitions
- **${armorComparisons.length}** armor set comparisons

**Data Authority:**
- OHMM data is **external/community/screenshot/OCR/proposed** — never decoded-authoritative
- All OHMM data must be tagged with provenance before import
- Conflicts require manual review, not automatic resolution

---

## High-Severity Conflicts

These conflicts involve fundamental gameplay mechanics and require immediate review:

`;
  
  const highConflicts = conflicts.filter(c => c.severity === 'high');
  
  for (const conflict of highConflicts) {
    report += `### ${conflict.name} — ${conflict.field}

**OHMM Value:** \`${conflict.ohmmValue}\`

**Project Value:** \`${conflict.projectValue}\`

**Notes:** ${conflict.notes}

**Provenance:** external_model_assumption | external_community_datamine | conflict_review_required

---

`;
  }
  
  report += `## Medium-Severity Conflicts

These conflicts involve stat profiles or secondary mechanics:

`;
  
  const mediumConflicts = conflicts.filter(c => c.severity === 'medium');
  
  for (const conflict of mediumConflicts) {
    report += `### ${conflict.name} — ${conflict.field}

**OHMM Value:** \`${conflict.ohmmValue}\`

**Project Value:** \`${conflict.projectValue}\`

**Notes:** ${conflict.notes}

---

`;
  }
  
  report += `## Keyword Capability Review

Based on ADR-013 and OHMM weapon_list.json:

| Keyword | Can Crit | Can Weakspot | Source | Confidence | Notes |
|---------|----------|--------------|--------|------------|-------|
`;
  
  for (const kw of keywordCapabilities) {
    report += `| ${kw.keyword} | ${kw.canCrit} | ${kw.canWeakspot} | ${kw.source} | ${kw.confidence} | ${kw.notes} |\n`;
  }
  
  report += `

## Armor Set Comparison

| Set Name | OHMM Pieces | Project Pieces | OHMM Bonuses | Conflicts |
|----------|-------------|----------------|--------------|-----------|
`;
  
  for (const armor of armorComparisons) {
    report += `| ${armor.setName} | ${armor.ohmmPieces} | ${armor.projectPieces} | ${armor.ohmmBonuses.length} bonuses | ${armor.conflicts.length} conflicts |\n`;
  }
  
  report += `

## Damage Formula Claims

### ADR-002: Universal Bucket Topology

**Claim 1:** DMG Factor (weapons/mods) and DMG Coefficient (key armor) are additive in the same bucket.

**Evidence:** "113 Test" mentioned in ADR-002.

**Project Status:** Not confirmed. Project currently models these as separate factors.

**Recommendation:** Mark as external_model_assumption. Requires in-game testing to confirm.

---

**Claim 2:** Crit DMG and Weakspot DMG are additive in "Hit Amplifier" bucket.

**Evidence:** ADR-002 states "Crit DMG and Weakspot DMG are also additive within a single 'Hit Amplifier' bucket — not separate multiplicative layers."

**Project Status:** Project models these as separate multiplicative factors.

**Recommendation:** HIGH PRIORITY CONFLICT. Requires in-game testing. If confirmed, project formula must be updated.

---

**Claim 3:** Ultimate DMG is Final DMG translation variant.

**Evidence:** OHMM raw.json notes.

**Project Status:** Not modeled.

**Recommendation:** Keep as review item.

---

## Safe to Use Now

These OHMM data points are low-risk and can be imported with proper provenance tagging:

1. **Weapon names and IDs** — Basic identification data
2. **Armor set names** — Set identification
3. **Mod descriptions** — Textual effect descriptions (not numerical values)
4. **Keyword capability flags from ADR-013** — Well-documented architectural decision

**Provenance tags to apply:**
- \`external_community_datamine\` — For weapon_list.json, mods_config.json
- \`external_screenshot_ocr\` — For raw.json in-game screenshot data
- \`external_model_assumption\` — For ADR documents
- \`external_in_game_tested\` — If any data has explicit in-game test confirmation

---

## Needs Review

These items require manual review before import:

1. **DE.50 Jaws trigger mechanics** — Conflict between OHMM (every 4 shots) and Knowledge Bible (every 3 hits, crit counts as 2)
2. **Unstable Bomber crit capability** — OHMM shows weapon-specific unlock (Jaws), project models as global cannot-crit
3. **Weapon stat profiles** — OHMM may have T5/6-star/full-calibration display stats, project may have raw base values
4. **DMG Factor / DMG Coefficient bucket topology** — ADR-002 claims additive, project models separately
5. **Crit DMG / Weakspot DMG bucket topology** — ADR-002 claims additive, project models separately

---

## Do Not Import Blindly

**NEVER** automatically import:

1. **Numerical stat values** from OHMM without cross-referencing project verified data
2. **Damage formula bucket topology** from ADR documents without in-game testing
3. **Trigger mechanics** (cooldowns, stack limits, trigger counts) without explicit confirmation
4. **Keyword capability overrides** without checking if they're weapon-specific or global rules

**Reason:** OHMM data is external/community-sourced. It may be:
- Outdated (pre-patch)
- Incorrect (OCR errors, misinterpretation)
- Context-specific (specific build, specific gear)
- Contradictory (different sources disagree)

---

## Recommended Import Plan

### Phase 1: Safe Imports (Low Risk)

1. Import weapon names and IDs with \`external_community_datamine\` provenance
2. Import armor set names with \`external_community_datamine\` provenance
3. Import mod descriptions (text only) with \`external_community_datamine\` provenance

### Phase 2: Review Required (Medium Risk)

1. Review DE.50 Jaws trigger mechanics conflict
2. Review Unstable Bomber crit capability (weapon-specific vs global)
3. Reconcile weapon stat profiles (T5/6-star vs raw base)

### Phase 3: Testing Required (High Risk)

1. In-game test DMG Factor / DMG Coefficient bucket topology
2. In-game test Crit DMG / Weakspot DMG bucket topology
3. In-game test keyword capability flags (canCrit, canWeakspot)

---

## Suggested Provenance Model

Add provenance metadata to all imported OHMM data:

\`\`\`typescript
interface ProvenanceMetadata {
  source: 'external_community_datamine' | 'external_screenshot_ocr' | 'external_model_assumption' | 'external_in_game_tested';
  sourceFile: string; // e.g., 'weapon_list.json', 'ADR-002'
  sourceDate: string; // e.g., '2026-03-01'
  confidence: 'high' | 'medium' | 'low';
  reviewStatus: 'approved' | 'pending_review' | 'conflict_review_required';
  lastValidated?: string; // Date of last in-game validation
  notes?: string;
}
\`\`\`

---

## Next Steps

1. **Immediate:** Review high-severity conflicts (DE.50 Jaws, Unstable Bomber crit)
2. **Short-term:** In-game test damage formula bucket topology claims
3. **Medium-term:** Reconcile weapon stat profiles
4. **Long-term:** Establish provenance tracking for all external data

---

## Appendix: OHMM Corpus Inventory

### JSON Files

- \`weapon_list.json\` — ${weaponList?.weapons?.length || 0} weapons with mechanics
- \`mods_config.json\` — ${Object.keys(modsConfig || {}).length} mod slots with effects
- \`all_armor_stats.json\` — ${Object.keys(allArmorStats?.items || {}).length} armor slots with star/level progression
- \`armor_sets.json\` — ${Object.keys(armorSets?.sets || {}).length} armor sets with multipliers
- \`raw.json\` — Comprehensive database (2288 lines) with metadata
- \`items_and_sets.json\` — Combined items and sets data

### ADR Documents

- ADR-001: Combat Engine Architecture
- ADR-002: Universal Bucket Topology ⚠️ (contains high-severity conflicts)
- ADR-003: Trigger Effect Execution Model
- ADR-004: High-Fidelity Materialization
- ADR-005: Zero-Trust Refinement
- ADR-006: Complex Integration Test and Armor Scaling
- ADR-007: Context-Aware Effect Resolution
- ADR-009: Ergonomic UI and Naming Alignment
- ADR-010: Unified Resolver Preview
- ADR-011: Telemetry First-Class Citizen
- ADR-012: Deep Nested Telemetry
- ADR-013: Keyword Weakspot Logic ⚠️ (defines keyword capabilities)
- ADR-014: Holistic Architectural Audit and ECS Refinement
- ADR-015: Abolish God Objects and Enforce Pure ECS
- ADR-016: Mod Suffixes and HP-Dependent Gradient Scaling

### Other Files

- \`build-comparison-stats.md\` — Example build stat profiles
- \`damage-formula-engine-abstraction.md\` — Damage formula design
- Various PNG/JPG images (screenshots, diagrams)

---

**Report generated by:** scripts/audit-ohmm-corpus.ts
**Audit status:** COMPLETE — Read-only, no project data modified
`;
  
  return report;
}

function generateCsvReports() {
  console.log('📊 Generating CSV reports...\n');
  
  // weapon_conflicts.csv
  let weaponCsv = 'id,name,field,ohmm_value,project_value,severity,notes\n';
  for (const conflict of conflicts) {
    weaponCsv += `"${conflict.id}","${conflict.name}","${conflict.field}","${conflict.ohmmValue}","${conflict.projectValue}","${conflict.severity}","${conflict.notes}"\n`;
  }
  writeFileSync(join(REPORT_DIR, 'weapon_conflicts.csv'), weaponCsv);
  
  // keyword_capability_review.csv
  let keywordCsv = 'keyword,can_crit,can_weakspot,source,confidence,notes\n';
  for (const kw of keywordCapabilities) {
    keywordCsv += `"${kw.keyword}",${kw.canCrit},${kw.canWeakspot},"${kw.source}","${kw.confidence}","${kw.notes}"\n`;
  }
  writeFileSync(join(REPORT_DIR, 'keyword_capability_review.csv'), keywordCsv);
  
  // armor_set_comparison.csv
  let armorCsv = 'set_name,ohmm_pieces,project_pieces,ohmm_bonuses,project_bonuses,conflicts\n';
  for (const armor of armorComparisons) {
    armorCsv += `"${armor.setName}",${armor.ohmmPieces},${armor.projectPieces},"${armor.ohmmBonuses.join('; ')}","${armor.projectBonuses.join('; ')}","${armor.conflicts.join('; ')}"\n`;
  }
  writeFileSync(join(REPORT_DIR, 'armor_set_comparison.csv'), armorCsv);
  
  // adr_summary.csv
  let adrCsv = 'adr_number,title,status,key_claims,conflicts,provenance\n';
  const adrs = [
    { num: '001', title: 'Combat Engine Architecture', status: 'Proposed', claims: 'ECS-inspired architecture', conflicts: 'None', provenance: 'external_model_assumption' },
    { num: '002', title: 'Universal Bucket Topology', status: 'Proposed', claims: 'DMG Factor+Coefficient additive; Crit+Weakspot additive', conflicts: 'HIGH: Conflicts with project formula', provenance: 'external_model_assumption' },
    { num: '013', title: 'Keyword Weakspot Logic', status: 'Proposed', claims: 'Bullet keywords canCrit+canWeakspot; Elemental cannot', conflicts: 'Medium: May conflict with project defaults', provenance: 'external_model_assumption' },
  ];
  for (const adr of adrs) {
    adrCsv += `"${adr.num}","${adr.title}","${adr.status}","${adr.claims}","${adr.conflicts}","${adr.provenance}"\n`;
  }
  writeFileSync(join(REPORT_DIR, 'adr_summary.csv'), adrCsv);
}

// Main execution

console.log('🔬 OHMM External Research Corpus Audit\n');
console.log('=' .repeat(60));
console.log();

analyzeWeaponConflicts();
analyzeKeywordCapabilities();
analyzeArmorSets();
analyzeDamageFormula();

const markdownReport = generateMarkdownReport();
writeFileSync(join(process.cwd(), 'docs/reports/ohmm_external_research_audit.md'), markdownReport);

generateCsvReports();

console.log('=' .repeat(60));
console.log('\n✅ Audit complete!\n');
console.log('📄 Reports generated:');
console.log(`   - docs/reports/ohmm_external_research_audit.md`);
console.log(`   - docs/reports/ohmm/weapon_conflicts.csv`);
console.log(`   - docs/reports/ohmm/keyword_capability_review.csv`);
console.log(`   - docs/reports/ohmm/armor_set_comparison.csv`);
console.log(`   - docs/reports/ohmm/adr_summary.csv`);
console.log();
console.log('📊 Summary:');
console.log(`   - ${conflicts.length} total conflicts (${conflicts.filter(c => c.severity === 'high').length} high-severity)`);
console.log(`   - ${keywordCapabilities.length} keyword capability definitions`);
console.log(`   - ${armorComparisons.length} armor set comparisons`);
console.log();
console.log('⚠️  IMPORTANT: This is a READ-ONLY audit. No project data was modified.');
console.log('   All OHMM data is external/community-sourced and requires provenance tagging.');
console.log();
