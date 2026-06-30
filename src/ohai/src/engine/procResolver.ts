import type { ProcSource } from "./procTypes";
import { getInternalRegistry } from "./procRegistry";

export function getProcSource(procId: string): ProcSource | undefined {
  return getInternalRegistry().get(procId);
}

export function listProcSources(): ProcSource[] {
  return Array.from(getInternalRegistry().values());
}

export function getProcSourcesForSource(sourceId: string): ProcSource[] {
  return listProcSources().filter((p) => p.sourceId === sourceId);
}

export function getProcSourcesGeneratingMechanic(
  mechanicId: string
): ProcSource[] {
  return listProcSources().filter(
    (p) => p.generatedMechanicId === mechanicId
  );
}
