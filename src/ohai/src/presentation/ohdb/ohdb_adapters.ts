import type { OhdbWeapon, OhdbArmor, OhdbModVariant, OhdbAttachment } from './ohdb_types';
import * as weaponsRaw from './weapons.json';
import * as armorRaw from './armor.json';
import * as modVariantsRaw from './mod_variants.json';
import * as attachmentsRaw from './attachments.json';

export interface OhdbImportResult<T> {
  data: T[];
  count: number;
  source: string;
  importedAt: string;
}

export function loadOhdbWeapons(): OhdbImportResult<OhdbWeapon> {
  const data = weaponsRaw as unknown as OhdbWeapon[];
  return {
    data,
    count: data.length,
    source: 'ohdb_import_corpus_v2',
    importedAt: new Date().toISOString()
  };
}

export function loadOhdbArmor(): OhdbImportResult<OhdbArmor> {
  const raw = armorRaw as any;
  const data = (raw.items ?? raw) as OhdbArmor[];
  return {
    data,
    count: data.length,
    source: 'ohdb_import_corpus_v2',
    importedAt: new Date().toISOString()
  };
}

export function loadOhdbModVariants(): OhdbImportResult<OhdbModVariant> {
  const raw = modVariantsRaw as any;
  const data = (raw.items ?? raw) as OhdbModVariant[];
  return {
    data,
    count: data.length,
    source: 'ohdb_import_corpus_v2',
    importedAt: new Date().toISOString()
  };
}

export function loadOhdbAttachments(): OhdbImportResult<OhdbAttachment> {
  const data = attachmentsRaw as unknown as OhdbAttachment[];
  return {
    data,
    count: data.length,
    source: 'ohdb_import_corpus_v2',
    importedAt: new Date().toISOString()
  };
}
