import { createSavedBuild, validateSavedBuild, CURRENT_SCHEMA_VERSION, type SavedBuild } from "./savedBuildSchema";
import type { BuildSelection } from "./types";

const STORAGE_KEY = `ohmc-saved-builds-v${CURRENT_SCHEMA_VERSION}`;

function readAll(): SavedBuild[] {
 try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  const valid: SavedBuild[] = [];
  for (const item of parsed) {
   const result = validateSavedBuild(item);
   if (result.success) valid.push(result.build);
  }
  return valid;
 } catch {
  return [];
 }
}

function writeAll(builds: SavedBuild[]): void {
 try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
 } catch (e) {
  console.error("Failed to write saved builds to localStorage:", e);
 }
}

export function loadAllBuilds(): SavedBuild[] {
 return readAll();
}

export function loadBuild(buildId: string): SavedBuild | undefined {
 return readAll().find((b) => b.buildId === buildId);
}

export function saveBuild(params: {
 buildId: string;
 buildName: string;
 gameMode: "pve" | "pvp";
 build: BuildSelection;
 uptimeProfile?: string;
 customAssumptions?: Record<string, unknown>;
 pveTargetId?: string;
 notes?: string;
}): SavedBuild {
 const builds = readAll();
 const existingIndex = builds.findIndex((b) => b.buildId === params.buildId);
 const saved = createSavedBuild({
  ...params,
  buildId: params.buildId,
  buildName: params.buildName,
 });

 if (existingIndex >= 0) {
  builds[existingIndex] = { ...saved, createdAt: builds[existingIndex].createdAt };
 } else {
  builds.push(saved);
 }

 writeAll(builds);
 return saved;
}

export function deleteBuild(buildId: string): void {
 const builds = readAll().filter((b) => b.buildId !== buildId);
 writeAll(builds);
}

export function renameBuild(buildId: string, newName: string): SavedBuild | undefined {
 const builds = readAll();
 const found = builds.find((b) => b.buildId === buildId);
 if (!found) return undefined;
 found.buildName = newName;
 found.updatedAt = new Date().toISOString();
 writeAll(builds);
 return found;
}

export function duplicateBuild(buildId: string, newBuildId: string, newName: string): SavedBuild | undefined {
 const builds = readAll();
 const source = builds.find((b) => b.buildId === buildId);
 if (!source) return undefined;

 const dup = createSavedBuild({
  buildId: newBuildId,
  buildName: newName,
  gameMode: source.gameMode as "pve" | "pvp",
  build: source.build as BuildSelection,
  uptimeProfile: source.uptimeProfile,
  customAssumptions: source.customAssumptions as Record<string, unknown> | undefined,
  pveTargetId: source.pveTargetId,
  notes: source.notes,
 });

 builds.push(dup);
 writeAll(builds);
 return dup;
}

export function updateBuild(
 buildId: string,
 updates: Partial<Omit<SavedBuild, "buildId" | "createdAt" | "schemaVersion">>,
): SavedBuild | undefined {
 const builds = readAll();
 const found = builds.find((b) => b.buildId === buildId);
 if (!found) return undefined;

 Object.assign(found, updates, { updatedAt: new Date().toISOString() });
 writeAll(builds);
 return found;
}

export function generateBuildId(): string {
 return `build-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function countSavedBuilds(): number {
 return readAll().length;
}

export function clearAllBuilds(): void {
 localStorage.removeItem(STORAGE_KEY);
}
