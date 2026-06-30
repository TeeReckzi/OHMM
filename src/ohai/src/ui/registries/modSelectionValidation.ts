import type { ModSelection } from '../types';

/**
 * Localized selector validation helper.
 * A complete equipped mod selection requires BOTH a core and a suffix.
 */
export function isCompleteEquippedModSelection(
 slot: string,
 selection: ModSelection
): boolean {
 const core = selection[`${slot}Core`];
 const suffix = selection[`${slot}Suffix`];
 return Boolean(core && suffix);
}

export type ModSelectionStatus =
 | 'empty'
 | 'missingCore'
 | 'missingSuffix'
 | 'complete';

export function getModSelectionStatus(
 slot: string,
 selection: ModSelection
): ModSelectionStatus {
 const core = selection[`${slot}Core`];
 const suffix = selection[`${slot}Suffix`];

 if (!core && !suffix) return 'empty';
 if (!core) return 'missingCore';
 if (!suffix) return 'missingSuffix';
 return 'complete';
}
