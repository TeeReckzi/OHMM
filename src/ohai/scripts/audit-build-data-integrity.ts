import fs from 'node:fs';
import path from 'node:path';

import { weaponRegistry } from '../src/ui/registries/weaponRegistry';
import { armorRegistry, keyGearRegistry } from '../src/ui/registries/armorRegistry';
import { modRegistry } from '../src/ui/registries/modRegistry';
import { ammoRegistry } from '../src/ui/registries/ammoRegistry';
import { attachmentRegistry } from '../src/ui/registries/attachmentRegistry';
import { foodBuffRegistry } from '../src/ui/registries/foodBuffRegistry';
import { deviationRegistry } from '../src/ui/registries/deviationRegistry';
import { cradleRegistry } from '../src/ui/registries/cradleRegistry';
import { pveTargetRegistry } from '../src/ui/registries/pveTargetRegistry';
import type { AnyCanonicalItem, CanonicalArmor, CanonicalMod } from '../src/ui/itemTypes';

type Severity = 'BLOCKER' | 'WARN' | 'INFO';
type Issue = {
  severity: Severity;
  source: string;
  item: string;
  message: string;
};

type RegistrySpec<T extends { id: string; name?: string; category?: string; effectSummary?: string; confidence?: string; needsReview?: boolean; sourceNotes?: string }> = {
  name: string;
  source: string;
  items: T[];
  userFacing: boolean;
};

const repoRoot = process.cwd();
const reportPath = path.join(repoRoot, 'docs/generated/data-integrity-audit-report.md');
const issues: Issue[] = [];

const loadoutSlots = ['weapon', 'head', 'mask', 'chest', 'gloves', 'pants', 'boots'] as const;
const armorSlots = ['head', 'mask', 'chest', 'gloves', 'pants', 'boots'] as const;
const attachmentSlots = ['optic', 'muzzle', 'magazine', 'tactical', 'stock'] as const;

const suspiciousTokens = [
  'elemental-overload',
  'status-amplifier',
  'burn-set-2pc',
  'blaze-suffix',
  'crit-boost',
  'Mod Suffix: Blaze',
  'Burn Set 2pc',
];

const suspiciousIdFragments = [
  'sample',
  'fake',
  'imaginary',
  'test-build',
  'no-such',
  'unknown',
  'non-existent',
];

const allowedMentionFiles = new Set([
  path.normalize('docs/data-integrity-quarantine-plan.md'),
  path.normalize('docs/mod-core-suffix-relationship-contract.md'),
]);

function add(severity: Severity, source: string, item: string, message: string): void {
  issues.push({ severity, source, item, message });
}

function normalizeRel(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'dist-ui') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function hasSuspiciousIdFragment(value: string): string | undefined {
  const normalized = value.toLowerCase();
  return suspiciousIdFragments.find((fragment) => normalized.includes(fragment));
}

function maybeWarnSourceNotes(source: string, itemId: string, sourceNotes?: string): void {
  if (!sourceNotes) return;
  const lowered = sourceNotes.toLowerCase();
  const markers = ['pending', 'placeholder', 'sample', 'manual', 'estimated', 'values pending'];
  const marker = markers.find((m) => lowered.includes(m));
  if (marker) {
    add('WARN', source, itemId, `sourceNotes contain review marker "${marker}"`);
  }
}

function validateRegistry<T extends { id: string; name?: string; category?: string; effectSummary?: string; confidence?: string; needsReview?: boolean; sourceNotes?: string }>(spec: RegistrySpec<T>): void {
  const seen = new Map<string, number>();
  for (const item of spec.items) {
    seen.set(item.id, (seen.get(item.id) ?? 0) + 1);
  }

  for (const [id, count] of seen) {
    if (count > 1) add('BLOCKER', spec.source, id, `duplicate registry id appears ${count} times`);
  }

  for (const item of spec.items) {
    const id = item.id || '<missing-id>';
    if (!item.id) add('BLOCKER', spec.source, id, 'missing id');
    if (!item.name) add('BLOCKER', spec.source, id, 'missing name');
    if (!item.category) add('BLOCKER', spec.source, id, 'missing category');
    if (!item.effectSummary) add('BLOCKER', spec.source, id, 'missing effectSummary');
    if (!item.confidence) add('BLOCKER', spec.source, id, 'missing confidence');

    if (item.confidence === 'placeholder' && spec.userFacing) {
      add('BLOCKER', spec.source, id, 'placeholder-confidence item is reachable by user-facing registry');
    }
    if (item.confidence === 'estimated' || item.needsReview) {
      add('WARN', spec.source, id, `registry item is ${item.confidence ?? 'unknown confidence'}${item.needsReview ? ' and needsReview=true' : ''}`);
    }

    const suspicious = hasSuspiciousIdFragment(id);
    if (suspicious) add('WARN', spec.source, id, `id contains suspicious fragment "${suspicious}"`);
    maybeWarnSourceNotes(spec.source, id, item.sourceNotes);
  }
}

function validateArmorRegistry(): void {
  const setNames = new Set(armorRegistry.map((a) => a.armorSet).filter(Boolean));
  for (const armor of armorRegistry) {
    if (!armorSlots.includes(armor.slot as (typeof armorSlots)[number])) {
      add('BLOCKER', 'src/ui/registries/armorRegistry.ts', armor.id, `invalid armor slot "${armor.slot}"`);
    }
    if (!armor.armorSet) {
      add('WARN', 'src/ui/registries/armorRegistry.ts', armor.id, 'armor piece has no armorSet');
    }
  }
  for (const setName of setNames) {
    const bySet = armorRegistry.filter((a) => a.armorSet === setName);
    for (const slot of armorSlots) {
      const count = bySet.filter((a) => a.slot === slot).length;
      if (count === 0) add('WARN', 'src/ui/registries/armorRegistry.ts', String(setName), `set has no ${slot} armor piece in registry`);
      if (count > 1) add('WARN', 'src/ui/registries/armorRegistry.ts', String(setName), `set has ${count} ${slot} pieces in registry`);
    }
  }
}

function validateModRegistry(): void {
  for (const mod of modRegistry) {
    if (!loadoutSlots.includes(mod.modSlot as (typeof loadoutSlots)[number])) {
      add('BLOCKER', 'src/ui/registries/modRegistry.ts', mod.id, `invalid modSlot "${mod.modSlot}"`);
    }
    if (mod.modType !== 'core' && mod.modType !== 'suffix') {
      add('BLOCKER', 'src/ui/registries/modRegistry.ts', mod.id, `invalid modType "${String(mod.modType)}"`);
    }

    const suspiciousExact = suspiciousTokens.find((token) => mod.id === token || mod.name === token);
    if (suspiciousExact) {
      add('BLOCKER', 'src/ui/registries/modRegistry.ts', mod.id, `suspicious placeholder/plausible token is present as loadable registry data: ${suspiciousExact}`);
    }

    if (mod.modType === 'suffix' && mod.id === 'none') {
      add('BLOCKER', 'src/ui/registries/modRegistry.ts', mod.id, 'suffix registry must not represent missing suffix as an actual suffix');
    }
  }

  const suffixesBySlot = new Map<string, CanonicalMod[]>();
  const coresBySlot = new Map<string, CanonicalMod[]>();
  for (const slot of loadoutSlots) {
    suffixesBySlot.set(slot, modRegistry.filter((m) => m.modSlot === slot && m.modType === 'suffix'));
    coresBySlot.set(slot, modRegistry.filter((m) => m.modSlot === slot && m.modType === 'core'));
  }

  for (const slot of loadoutSlots) {
    const cores = coresBySlot.get(slot) ?? [];
    const suffixes = suffixesBySlot.get(slot) ?? [];
    if (cores.length > 0 && suffixes.length === 0) {
      add('BLOCKER', 'src/ui/registries/modRegistry.ts', slot, 'slot has core mods but zero suffix options; core+suffix contract cannot be fulfilled');
    }
    if (suffixes.length > 0 && cores.length === 0) {
      add('WARN', 'src/ui/registries/modRegistry.ts', slot, 'slot has suffixes but zero core mods');
    }
  }
}

function validateCatalogGeneratedOptions(): void {
  const catalogPath = path.join(repoRoot, 'src/ui/data/catalog.ts');
  if (!fs.existsSync(catalogPath)) return;
  const content = fs.readFileSync(catalogPath, 'utf8');

  if (content.includes("emptyMod('weapon suffix')") || content.includes("emptyMod('head suffix')")) {
    add('WARN', 'src/ui/data/catalog.ts', 'modSuffixOptions', 'suffix option UI exposes an empty/None suffix; ensure this is treated as incomplete, not a valid equipped mod');
  }
  if (content.includes("id: 'none'") && content.includes("No ${slot} mod selected")) {
    add('INFO', 'src/ui/data/catalog.ts', 'emptyMod', 'catalog uses none sentinel for empty mod UI state');
  }
}

function validateKnownSampleBuilds(): void {
  const file = path.join(repoRoot, 'src/ui/buildPersistenceSmokeTest.ts');
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('mods: { weapon:') || content.includes('mods: { weapon: "')) {
    add('BLOCKER', 'src/ui/buildPersistenceSmokeTest.ts', 'SAMPLE_BUILD.mods', 'sample build uses legacy single mod keys instead of core/suffix pairs');
  }
  for (const token of ['imaginary-mod', 'non-existent-weapon', 'no-such-armor', 'unknown-deviant', 'fake-food']) {
    if (content.includes(token)) {
      add('WARN', 'src/ui/buildPersistenceSmokeTest.ts', token, 'negative-test fake ID is present; keep quarantined to schema tests and never use as build truth');
    }
  }
  if (content.includes('build with missing item IDs still passes schema validation')) {
    add('WARN', 'src/ui/buildPersistenceSmokeTest.ts', 'schema validation', 'schema intentionally allows missing item IDs; domain validator must run separately before user-facing output');
  }
}

function validateBuildObject(source: string, item: string, build: any): void {
  const weaponById = new Map(weaponRegistry.map((w) => [w.id, w]));
  const armorById = new Map<string, CanonicalArmor>(armorRegistry.map((a) => [a.id, a]));
  const keyGearById = new Map(keyGearRegistry.map((k) => [k.id, k]));
  const modById = new Map(modRegistry.map((m) => [m.id, m]));
  const ammoById = new Map(ammoRegistry.map((a) => [a.id, a]));
  const attachmentById = new Map(attachmentRegistry.map((a) => [a.id, a]));
  const foodById = new Map(foodBuffRegistry.map((f) => [f.id, f]));
  const deviationById = new Map(deviationRegistry.map((d) => [d.id, d]));
  const cradleById = new Map(cradleRegistry.map((c) => [c.id, c]));

  const weaponId = build?.weapon?.blueprintId;
  if (typeof weaponId === 'string') {
    const weapon = weaponById.get(weaponId);
    if (!weapon) add('BLOCKER', source, `${item}.weapon`, `weapon blueprintId does not resolve: ${weaponId}`);
    const ammoId = build?.weapon?.attachments?.ammo;
    if (typeof ammoId === 'string' && ammoId !== 'none') {
      const ammo = ammoById.get(ammoId);
      if (!ammo) add('BLOCKER', source, `${item}.ammo`, `ammo id does not resolve: ${ammoId}`);
      if (weapon && ammo && !weapon.allowedAmmoCategories.includes(ammo.ammoCategory)) {
        add('BLOCKER', source, `${item}.ammo`, `ammo ${ammoId} category ${ammo.ammoCategory} is not allowed for ${weaponId}`);
      }
    }
  }

  for (const slot of armorSlots) {
    const armorId = build?.armor?.[slot];
    if (typeof armorId === 'string' && armorId !== 'empty' && armorId !== 'none') {
      const armor = armorById.get(armorId);
      const keyGear = keyGearById.get(armorId);
      const resolvedSlot = armor?.slot ?? keyGear?.slot;
      if (!armor && !keyGear) add('BLOCKER', source, `${item}.armor.${slot}`, `armor/key gear id does not resolve: ${armorId}`);
      else if (resolvedSlot !== slot) add('BLOCKER', source, `${item}.armor.${slot}`, `selected item ${armorId} belongs to ${resolvedSlot}, not ${slot}`);
    }
  }

  for (const slot of attachmentSlots) {
    const attachmentId = build?.weapon?.attachments?.[slot];
    if (typeof attachmentId === 'string' && attachmentId !== 'none') {
      const attachment = attachmentById.get(attachmentId);
      if (!attachment) add('BLOCKER', source, `${item}.attachments.${slot}`, `attachment id does not resolve: ${attachmentId}`);
      else if (attachment.attachmentSlot !== slot) add('BLOCKER', source, `${item}.attachments.${slot}`, `attachment ${attachmentId} belongs to ${attachment.attachmentSlot}, not ${slot}`);
    }
  }

  const mods = build?.mods ?? {};
  for (const slot of loadoutSlots) {
    const legacy = mods[slot];
    if (typeof legacy === 'string' && legacy !== 'none') {
      add('BLOCKER', source, `${item}.mods.${slot}`, `legacy single mod key is used; must use ${slot}Core + ${slot}Suffix`);
    }

    const coreId = mods[`${slot}Core`];
    const suffixId = mods[`${slot}Suffix`];
    const hasCore = typeof coreId === 'string' && coreId !== 'none' && coreId !== '';
    const hasSuffix = typeof suffixId === 'string' && suffixId !== 'none' && suffixId !== '';

    if (hasCore && !hasSuffix) add('BLOCKER', source, `${item}.mods.${slot}`, `core mod ${coreId} selected without required suffix`);
    if (!hasCore && hasSuffix) add('BLOCKER', source, `${item}.mods.${slot}`, `suffix ${suffixId} selected without required core mod`);

    if (hasCore) {
      const core = modById.get(coreId);
      if (!core) add('BLOCKER', source, `${item}.mods.${slot}Core`, `core mod id does not resolve: ${coreId}`);
      else {
        if (core.modType !== 'core') add('BLOCKER', source, `${item}.mods.${slot}Core`, `${coreId} is ${core.modType}, not core`);
        if (core.modSlot !== slot) add('BLOCKER', source, `${item}.mods.${slot}Core`, `${coreId} belongs to ${core.modSlot}, not ${slot}`);
      }
    }

    if (hasSuffix) {
      const suffix = modById.get(suffixId);
      if (!suffix) add('BLOCKER', source, `${item}.mods.${slot}Suffix`, `suffix id does not resolve: ${suffixId}`);
      else {
        if (suffix.modType !== 'suffix') add('BLOCKER', source, `${item}.mods.${slot}Suffix`, `${suffixId} is ${suffix.modType}, not suffix`);
        if (suffix.modSlot !== slot) add('BLOCKER', source, `${item}.mods.${slot}Suffix`, `${suffixId} belongs to ${suffix.modSlot}, not ${slot}`);
      }
    }
  }

  const foodId = build?.food?.food;
  if (typeof foodId === 'string' && foodId !== 'none' && !foodById.has(foodId)) add('BLOCKER', source, `${item}.food`, `food id does not resolve: ${foodId}`);

  const drinkId = build?.food?.drink;
  if (typeof drinkId === 'string' && drinkId !== 'none' && !foodById.has(drinkId)) add('WARN', source, `${item}.drink`, `drink id does not resolve in food registry: ${drinkId}`);

  const deviantId = build?.deviant?.id;
  if (typeof deviantId === 'string' && deviantId !== 'none' && !deviationById.has(deviantId)) add('BLOCKER', source, `${item}.deviant`, `deviation id does not resolve: ${deviantId}`);

  const perks = build?.cradle?.perks;
  if (Array.isArray(perks)) {
    for (const perkId of perks) {
      if (typeof perkId === 'string' && !cradleById.has(perkId)) add('BLOCKER', source, `${item}.cradle`, `cradle perk id does not resolve: ${perkId}`);
    }
  }
}

function scanTextFiles(): void {
  const files = [
    ...walk(path.join(repoRoot, 'docs')),
    ...walk(path.join(repoRoot, 'data')),
    ...walk(path.join(repoRoot, 'src')),
  ].filter((file) => /\.(ts|tsx|json|md)$/i.test(file));

  for (const file of files) {
    const rel = normalizeRel(file);
    const normalizedRel = path.normalize(rel);
    const content = fs.readFileSync(file, 'utf8');
    const allowedMention = allowedMentionFiles.has(normalizedRel);

    for (const token of suspiciousTokens) {
      if (content.includes(token) && !allowedMention) {
        const severity: Severity = rel.includes('docs/') ? 'WARN' : 'BLOCKER';
        add(severity, rel, token, 'suspicious placeholder/plausible token appears outside quarantine contract docs');
      }
    }

    if (/mods:\s*\{[^}]*\bweapon\s*:/s.test(content) || /mods:\s*\{[^}]*\bhead\s*:/s.test(content)) {
      const isSchemaMigration = rel.endsWith('src/ui/types.ts') || rel.endsWith('src/ui/savedBuildSchema.ts');
      if (!isSchemaMigration) add('WARN', rel, 'legacy-mod-selection', 'legacy mods.{slot} shape appears outside migration/type definition code');
    }

    const looksLikeBuildDoc = /weapon|primary weapon|armor set|mods?|suffix|loadout/i.test(content)
      && /build|loadout|sample|example/i.test(content);
    if (looksLikeBuildDoc && !/validationStatus|verified-loadout|concept-build|incomplete-data|invalid-build|deprecated-example/i.test(content)) {
      const severity: Severity = rel.includes('docs/') || rel.includes('data/') ? 'WARN' : 'INFO';
      add(severity, rel, 'build-like-content', 'build-like file lacks explicit validation status label');
    }
  }
}

function scanJsonBuilds(): void {
  const files = [
    ...walk(path.join(repoRoot, 'data')),
    ...walk(path.join(repoRoot, 'src')),
  ].filter((file) => /\.(json)$/i.test(file));

  for (const file of files) {
    const rel = normalizeRel(file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      add('WARN', rel, '<json>', 'could not parse JSON for build validation');
      continue;
    }
    const queue: Array<{ item: string; value: any }> = [{ item: path.basename(file), value: parsed }];
    while (queue.length) {
      const cur = queue.shift()!;
      const value = cur.value;
      if (!value || typeof value !== 'object') continue;
      if (value.weapon && value.armor && value.mods) validateBuildObject(rel, cur.item, value);
      if (value.build?.weapon && value.build?.armor && value.build?.mods) validateBuildObject(rel, `${cur.item}.build`, value.build);
      if (Array.isArray(value)) value.forEach((child, idx) => queue.push({ item: `${cur.item}[${idx}]`, value: child }));
      else for (const [key, child] of Object.entries(value)) if (child && typeof child === 'object') queue.push({ item: `${cur.item}.${key}`, value: child });
    }
  }
}

function validateRegistries(): void {
  const canonicalRegistries: RegistrySpec<AnyCanonicalItem>[] = [
    { name: 'weaponRegistry', source: 'src/ui/registries/weaponRegistry.ts', items: weaponRegistry, userFacing: true },
    { name: 'armorRegistry', source: 'src/ui/registries/armorRegistry.ts', items: armorRegistry, userFacing: true },
    { name: 'keyGearRegistry', source: 'src/ui/registries/armorRegistry.ts', items: keyGearRegistry, userFacing: true },
    { name: 'modRegistry', source: 'src/ui/registries/modRegistry.ts', items: modRegistry, userFacing: true },
    { name: 'foodBuffRegistry', source: 'src/ui/registries/foodBuffRegistry.ts', items: foodBuffRegistry, userFacing: true },
    { name: 'deviationRegistry', source: 'src/ui/registries/deviationRegistry.ts', items: deviationRegistry, userFacing: true },
    { name: 'cradleRegistry', source: 'src/ui/registries/cradleRegistry.ts', items: cradleRegistry, userFacing: true },
    { name: 'pveTargetRegistry', source: 'src/ui/registries/pveTargetRegistry.ts', items: pveTargetRegistry, userFacing: true },
    { name: 'attachmentRegistry', source: 'src/ui/registries/attachmentRegistry.ts', items: attachmentRegistry, userFacing: true },
  ];

  for (const registry of canonicalRegistries) validateRegistry(registry);
  validateRegistry({ name: 'ammoRegistry', source: 'src/ui/registries/ammoRegistry.ts', items: ammoRegistry, userFacing: true });
  validateArmorRegistry();
  validateModRegistry();
  validateCatalogGeneratedOptions();
}

function issueCounts(): Record<Severity, number> {
  return {
    BLOCKER: issues.filter((i) => i.severity === 'BLOCKER').length,
    WARN: issues.filter((i) => i.severity === 'WARN').length,
    INFO: issues.filter((i) => i.severity === 'INFO').length,
  };
}

function writeReport(): void {
  const counts = issueCounts();
  const quarantineSources = [...new Set(issues.filter((i) => i.severity === 'BLOCKER' || i.message.toLowerCase().includes('quarantine')).map((i) => i.source))].sort();
  const suspiciousIds = issues
    .filter((i) => suspiciousTokens.some((token) => i.item.includes(token) || i.message.includes(token)) || suspiciousIdFragments.some((fragment) => i.item.toLowerCase().includes(fragment)))
    .map((i) => `- ${i.item} (${i.source}) — ${i.message}`);
  const legacyModIssues = issues.filter((i) => i.message.toLowerCase().includes('legacy') || i.message.includes('core/suffix')).map((i) => `- [${i.severity}] ${i.source} :: ${i.item} :: ${i.message}`);

  const lines = [
    '# Data Integrity Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- BLOCKERS: ${counts.BLOCKER}`,
    `- WARNINGS: ${counts.WARN}`,
    `- INFO: ${counts.INFO}`,
    '',
    '## Quarantine candidates',
    '',
    ...(quarantineSources.length ? quarantineSources.map((s) => `- ${s}`) : ['- None']),
    '',
    '## Placeholder / suspicious IDs',
    '',
    ...(suspiciousIds.length ? suspiciousIds : ['- None']),
    '',
    '## Legacy mod-selection usage / core+suffix contract issues',
    '',
    ...(legacyModIssues.length ? legacyModIssues : ['- None']),
    '',
    '## Full issue list',
    '',
    ...issues.map((i) => `- [${i.severity}] ${i.source} :: ${i.item} :: ${i.message}`),
    '',
    '## Next actions',
    '',
    '- Replace or quarantine BLOCKER records before user testing.',
    '- Convert sample/default builds to explicit validationStatus labels.',
    '- Replace legacy mods.{slot} samples with core/suffix pairs.',
    '- Keep schema-level permissiveness separate from domain-level build validity.',
  ];

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
}

function printReport(): void {
  const counts = issueCounts();
  console.log('\nData Integrity Audit');
  console.log('='.repeat(60));
  console.log(`BLOCKERS: ${counts.BLOCKER}`);
  console.log(`WARNINGS: ${counts.WARN}`);
  console.log(`INFO: ${counts.INFO}`);
  console.log('='.repeat(60));
  for (const issue of issues) {
    console.log(`[${issue.severity}] ${issue.source} :: ${issue.item} :: ${issue.message}`);
  }
  console.log('='.repeat(60));
  console.log(`Report written to ${path.relative(repoRoot, reportPath)}`);
}

validateRegistries();
validateKnownSampleBuilds();
scanTextFiles();
scanJsonBuilds();
writeReport();
printReport();

if (issueCounts().BLOCKER > 0) process.exit(1);
