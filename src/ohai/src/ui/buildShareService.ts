import { SavedBuild, validateImportedBuild, CURRENT_SCHEMA_VERSION, sanitizeBuildOnLoad } from "./savedBuildSchema";
import { BuildSelection } from "./types";

function toBase64Url(str: string): string {
 return btoa(str)
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");
}

function fromBase64Url(str: string): string {
 const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
 return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

export function encodeSharePayload(build: SavedBuild): string {
 const payload = {
  v: CURRENT_SCHEMA_VERSION,
  n: build.buildName,
  m: build.gameMode,
  u: build.uptimeProfile,
  t: build.pveTargetId,
  b: {
   id: build.build.id,
   lb: build.build.label,
   rl: build.build.role,
   w: build.build.weapon,
   a: build.build.armor,
   md: build.build.mods,
   ms: build.build.modSelections,  // structured core/suffix (preferred going forward)
   cr: build.build.cradle,
   d: build.build.deviant,
   f: build.build.food,
  },
  c: build.customAssumptions,
 };

 return toBase64Url(JSON.stringify(payload));
}

export function decodeSharePayload(encoded: string): { success: true; build: SavedBuild } | { success: false; error: string } {
 try {
  const json = fromBase64Url(encoded);
  let parsed: unknown;
  try {
   parsed = JSON.parse(json);
  } catch {
   return { success: false, error: "Share string contains malformed JSON" };
  }

  if (typeof parsed !== "object" || parsed === null) {
   return { success: false, error: "Share string payload is not an object" };
  }

  const p = parsed as Record<string, unknown>;

  if (typeof p.v !== "number") {
   return { success: false, error: "Share string missing version field" };
  }

  if (p.v > CURRENT_SCHEMA_VERSION) {
   return { success: false, error: `Share string uses version ${p.v} but this version only supports up to ${CURRENT_SCHEMA_VERSION}` };
  }

  if (typeof p.b !== "object" || p.b === null) {
   return { success: false, error: "Share string missing build data" };
  }

  const b = p.b as Record<string, unknown>;

  const reconstructed: Record<string, unknown> = {
   schemaVersion: CURRENT_SCHEMA_VERSION,
   buildId: `shared-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
   buildName: p.n,
   createdAt: new Date().toISOString(),
   updatedAt: new Date().toISOString(),
   gameMode: ["pve", "pvp"].includes(p.m as string) ? p.m : "pvp",
   uptimeProfile: typeof p.u === "string" ? p.u : "realistic",
   pveTargetId: typeof p.t === "string" ? p.t : undefined,
   notes: "Imported from share string",
   build: {
    id: b.id ?? `imported-${Date.now()}`,
    label: b.lb ?? p.n,
    role: ["attacker", "defender"].includes(b.rl as string) ? b.rl : "attacker",
    weapon: b.w ?? {},
    armor: b.a ?? {},
    mods: b.md ?? {},
    modSelections: b.ms ?? undefined,
    cradle: b.cr ?? {},
    deviant: b.d ?? {},
    food: b.f ?? {},
   },
   customAssumptions: p.c ?? {},
  };

  const validation = validateImportedBuild(reconstructed);
  if (!validation.success) {
   return { success: false, error: validation.error };
  }

  // Sprint C-A: Pass through sanitize checkpoint for warnings/errors
  const { build: sanitized, warnings, errors } = sanitizeBuildOnLoad(validation.build);
  if (errors.length) {
   console.error('[share decode] sanitize errors:', errors);
  }
  if (warnings.length) {
   console.warn('[share decode] sanitize warnings:', warnings);
  }

  return { success: true, build: { ...validation.build, build: sanitized || validation.build.build } as SavedBuild };
 } catch (e) {
  return { success: false, error: `Failed to decode share string: ${e instanceof Error ? e.message : String(e)}` };
 }
}

export function copyShareStringToClipboard(build: SavedBuild): Promise<void> {
 const payload = encodeSharePayload(build);
 const shareUrl = `ohmc://build?data=${payload}`;
 return navigator.clipboard.writeText(shareUrl);
}
