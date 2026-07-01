/**
 * OHMM Build Persistence Module
 *
 * Handles serialization, deserialization, validation, and localStorage management
 * for saved builds. Designed with a stable schema versioning boundary so future
 * URL sharing can reuse the same structure.
 */

import type { LoadoutMap, EquippedItem } from "../types";

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 1;
const STORAGE_KEY = "ohmm-saved-builds";
const MAX_BUILDS = 20;

export interface SavedBuild {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  offLoadout: LoadoutMap;
  defLoadout: LoadoutMap;
}

export interface SavedBuildStore {
  schemaVersion: number;
  builds: SavedBuild[];
}

export interface SanitizationResult {
  build: SavedBuild;
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────
// SERIALIZATION
// ─────────────────────────────────────────────────────────────

/**
 * Serialize the current loadout state into a SavedBuild payload.
 */
export function serializeBuildState(
  name: string,
  offLoadout: LoadoutMap,
  defLoadout: LoadoutMap,
  existingId?: string
): SavedBuild {
  const now = new Date().toISOString();
  return {
    id: existingId || generateId(),
    name: name.trim() || "Unnamed Build",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: existingId ? now : now, // Will be overwritten by existing createdAt on update
    updatedAt: now,
    offLoadout: stripUndefined(offLoadout),
    defLoadout: stripUndefined(defLoadout),
  };
}

/**
 * Deserialize a raw JSON payload into a SavedBuild.
 * Returns null if the payload is fundamentally unparseable.
 */
export function deserializeBuildState(raw: unknown): SavedBuild | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== "string") return null;
  if (typeof obj.name !== "string") return null;
  if (!obj.offLoadout || typeof obj.offLoadout !== "object") return null;

  return {
    id: obj.id,
    name: obj.name,
    schemaVersion: typeof obj.schemaVersion === "number" ? obj.schemaVersion : 1,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : new Date().toISOString(),
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    offLoadout: obj.offLoadout as LoadoutMap,
    defLoadout: (obj.defLoadout as LoadoutMap) || {},
  };
}

// ─────────────────────────────────────────────────────────────
// SANITIZATION
// ─────────────────────────────────────────────────────────────

/**
 * Sanitize a loaded build. Validates structure, removes invalid items,
 * and produces warnings for anything that was dropped.
 *
 * This is the safety boundary — no unsanitized data should reach the UI state.
 */
export function sanitizeLoadedBuild(build: SavedBuild): SanitizationResult {
  const warnings: string[] = [];

  const offLoadout = sanitizeLoadout(build.offLoadout, "offensive", warnings);
  const defLoadout = sanitizeLoadout(build.defLoadout, "defensive", warnings);

  return {
    build: {
      ...build,
      offLoadout,
      defLoadout,
    },
    warnings,
  };
}

function sanitizeLoadout(loadout: LoadoutMap, side: string, warnings: string[]): LoadoutMap {
  if (!loadout || typeof loadout !== "object") {
    warnings.push(`${side}: loadout was not an object, reset to empty`);
    return {};
  }

  const sanitized: LoadoutMap = {};

  for (const [slot, item] of Object.entries(loadout)) {
    if (item === null || item === undefined) {
      continue; // Empty slot, valid
    }

    if (typeof item !== "object") {
      warnings.push(`${side}.${slot}: item was not an object, skipped`);
      continue;
    }

    const equip = item as EquippedItem;

    // Validate required fields
    if (!equip.id || typeof equip.id !== "string") {
      warnings.push(`${side}.${slot}: item missing valid id, skipped`);
      continue;
    }

    if (!equip.name || typeof equip.name !== "string") {
      warnings.push(`${side}.${slot}: item "${equip.id}" missing name, using id as fallback`);
      equip.name = equip.id;
    }

    // Clamp numeric values to sensible ranges
    if (typeof equip.stars === "number") {
      equip.stars = Math.max(0, Math.min(6, Math.round(equip.stars)));
    }
    if (typeof equip.tier === "number") {
      equip.tier = Math.max(0, Math.min(5, Math.round(equip.tier)));
    }

    sanitized[slot] = equip;
  }

  return sanitized;
}

// ─────────────────────────────────────────────────────────────
// LOCAL STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────

/**
 * Load all saved builds from localStorage.
 * Returns empty array if nothing saved or data is corrupt.
 */
export function loadBuildsFromLocalStorage(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    // Handle both array and store-object format
    const builds: unknown[] = Array.isArray(parsed)
      ? parsed
      : (parsed?.builds || []);

    return builds
      .map(deserializeBuildState)
      .filter((b): b is SavedBuild => b !== null)
      .slice(0, MAX_BUILDS);
  } catch {
    return [];
  }
}

/**
 * Save a build to localStorage. Enforces max build limit.
 * If a build with the same ID exists, it is updated.
 */
export function saveBuildToLocalStorage(build: SavedBuild): void {
  const existing = loadBuildsFromLocalStorage();
  const idx = existing.findIndex((b) => b.id === build.id);

  if (idx >= 0) {
    // Update existing, preserve original createdAt
    existing[idx] = { ...build, createdAt: existing[idx].createdAt };
  } else {
    // Add new, enforce limit
    if (existing.length >= MAX_BUILDS) {
      existing.pop(); // Remove oldest
    }
    existing.unshift(build); // Add to front
  }

  writeStore(existing);
}

/**
 * Delete a saved build by ID.
 */
export function deleteSavedBuild(buildId: string): void {
  const existing = loadBuildsFromLocalStorage();
  const filtered = existing.filter((b) => b.id !== buildId);
  writeStore(filtered);
}

/**
 * Rename a saved build by ID.
 */
export function renameSavedBuild(buildId: string, newName: string): void {
  const existing = loadBuildsFromLocalStorage();
  const build = existing.find((b) => b.id === buildId);
  if (build) {
    build.name = newName.trim() || "Unnamed Build";
    build.updatedAt = new Date().toISOString();
    writeStore(existing);
  }
}

// ─────────────────────────────────────────────────────────────
// AUTO-SAVE (current session state)
// ─────────────────────────────────────────────────────────────

const AUTOSAVE_KEY = "ohmm-current-session";

/**
 * Auto-save current session state. Called on every loadout change.
 */
export function autoSaveSession(offLoadout: LoadoutMap, defLoadout: LoadoutMap): void {
  try {
    const payload = JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      offLoadout: stripUndefined(offLoadout),
      defLoadout: stripUndefined(defLoadout),
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(AUTOSAVE_KEY, payload);
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/**
 * Restore auto-saved session state (survives page reload).
 * Returns null if nothing saved.
 */
export function restoreSession(): { offLoadout: LoadoutMap; defLoadout: LoadoutMap } | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const offLoadout = (parsed.offLoadout && typeof parsed.offLoadout === "object")
      ? parsed.offLoadout as LoadoutMap
      : {};
    const defLoadout = (parsed.defLoadout && typeof parsed.defLoadout === "object")
      ? parsed.defLoadout as LoadoutMap
      : {};

    // Sanitize before returning
    const warnings: string[] = [];
    return {
      offLoadout: sanitizeLoadout(offLoadout, "offensive", warnings),
      defLoadout: sanitizeLoadout(defLoadout, "defensive", warnings),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function generateId(): string {
  return `build-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripUndefined(obj: LoadoutMap): LoadoutMap {
  const result: LoadoutMap = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function writeStore(builds: SavedBuild[]): void {
  try {
    const store: SavedBuildStore = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      builds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full — silent fail
  }
}
