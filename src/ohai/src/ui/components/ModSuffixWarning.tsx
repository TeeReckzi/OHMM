import type { ModSelections } from '../types';

interface ModSuffixWarningProps {
 slot: string;
 selection?: ModSelections;
}

/**
 * Localized warning shown when a core mod is selected but no suffix is chosen.
 * Only renders when status === 'missingSuffix'.
 */
export function ModSuffixWarning({ slot, selection }: ModSuffixWarningProps) {
 if (!selection) return null;

 const core = (selection as any)[`${slot}Core`];
 const suffix = (selection as any)[`${slot}Suffix`];

 // Only show warning if core is selected but suffix is missing
 if (!core || suffix) return null;

 return (
  <div className="text-[10px] text-amber-400 mt-0.5">
   Select a suffix to complete this mod.
  </div>
 );
}
