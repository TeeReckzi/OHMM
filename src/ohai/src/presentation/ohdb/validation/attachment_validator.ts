import { loadOhdbAttachments } from '../ohdb_adapters';

const EXCLUDED_SLOTS = ['Ammo', 'Melee Component', 'Stock'];
const DUPLICATE_TO_EXCLUDE = 'advanced-combat-optic';
const EXPECTED_VALID = 'advanced-combat-optics';

export interface AttachmentValidationReport {
  totalImported: number;
  excludedSlotsPresent: string[];
  duplicateExcluded: boolean;
  validEntryPresent: boolean;
  errors: string[];
}

export function validateAttachments(): AttachmentValidationReport {
  const result = loadOhdbAttachments();
  const data = result.data;

  const excludedPresent = data
    .filter(a => EXCLUDED_SLOTS.includes(a.slotName))
    .map(a => a.slotName);

  const duplicateExcluded = data.some(a => a.slug === DUPLICATE_TO_EXCLUDE);
  const validPresent = data.some(a => a.slug === EXPECTED_VALID);

  const errors: string[] = [];
  if (excludedPresent.length > 0) errors.push(`Excluded slots found: ${excludedPresent.join(', ')}`);
  if (duplicateExcluded) errors.push(`Duplicate slug '${DUPLICATE_TO_EXCLUDE}' should not be present`);
  if (!validPresent) errors.push(`Expected valid entry '${EXPECTED_VALID}' missing`);

  return {
    totalImported: data.length,
    excludedSlotsPresent: excludedPresent,
    duplicateExcluded,
    validEntryPresent: validPresent,
    errors
  };
}
