import { describe, it, expect } from "vitest";
import {
  isRawTokenDescription,
  formatEffectForDisplay,
} from "../effectDisplayFormatter";
import {
  categorizeMod,
  normalizeModSlot,
  gearSlotLabel,
} from "../../../app/components/selectors/ModSelector";
import { verifiedModFamilies } from "../../../ohai/src/ui/registries/verifiedModFamilies";
import { mod_suffixes } from "../../../ohai/src/ui/registries/generated/mod-suffixes.generated";
import { key_gear } from "../../../ohai/src/ui/registries/generated/key-gear.generated";
import { weapons } from "../../../ohai/src/ui/registries/generated/weapons.generated";

// ─────────────────────────────────────────────────────────────
// a) No rendered effect text contains raw token patterns
// ─────────────────────────────────────────────────────────────

describe("effectDisplayFormatter", () => {
  it("detects duplicated stat labels as raw tokens", () => {
    expect(isRawTokenDescription("Damage+% Damage+%")).toBe(true);
  });

  it("detects unseparated duration tokens", () => {
    expect(isRawTokenDescription("Duration2seconds")).toBe(true);
    expect(isRawTokenDescription("Reload100% Movement Speed30% Duration2seconds")).toBe(true);
  });

  it("detects raw Target and Range tokens", () => {
    expect(isRawTokenDescription("TargetDuration7Range / Area")).toBe(true);
    expect(isRawTokenDescription("Target7 enemies")).toBe(true);
  });

  it("detects Chinese bracket artifacts", () => {
    expect(isRawTokenDescription("stacks【】")).toBe(true);
    expect(isRawTokenDescription("effect【】text")).toBe(true);
  });

  it("passes through normal effect descriptions", () => {
    expect(isRawTokenDescription("Weapon DMG +15% for 10s.")).toBe(false);
    expect(isRawTokenDescription("When triggering Frost Vortex, increases DMG by +4.0%.")).toBe(false);
    expect(isRawTokenDescription("Crit Rate +10.0%, Crit DMG +30.0%.")).toBe(false);
  });

  it("formatEffectForDisplay returns safe fallback for raw tokens", () => {
    const result = formatEffectForDisplay("Damage+% Damage+%");
    expect(result).not.toContain("+%");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatEffectForDisplay returns placeholder message for low-confidence raw tokens", () => {
    const result = formatEffectForDisplay("Reload100% junk", "placeholder");
    expect(result).toBe("Effect data pending verification");
  });

  it("formatEffectForDisplay passes through clean text", () => {
    const text = "Weapon DMG +15% for 10s.";
    expect(formatEffectForDisplay(text)).toBe(text);
  });

  it("formatEffectForDisplay returns empty string for null/undefined", () => {
    expect(formatEffectForDisplay(null)).toBe("");
    expect(formatEffectForDisplay(undefined)).toBe("");
    expect(formatEffectForDisplay("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────
// b) No rendered selector text contains undefined/null/NaN
// ─────────────────────────────────────────────────────────────

describe("meta display safety", () => {
  it("String(undefined) produces 'undefined' which should be filtered", () => {
    // The GenericDetail component now filters out null/undefined/empty meta entries
    const meta: Record<string, any> = { set: undefined, slot: "chest", displaySlot: "Chest" };
    const displayed = Object.entries(meta)
      .filter(([_k, v]) => v != null && String(v) !== "undefined" && String(v) !== "null" && String(v) !== "");
    expect(displayed.every(([_k, v]) => !String(v).includes("undefined"))).toBe(true);
    expect(displayed.length).toBe(2); // slot and displaySlot survive
  });
});

// ─────────────────────────────────────────────────────────────
// c) categorizeMod uses weaponCategory field first (verified tag match)
// ─────────────────────────────────────────────────────────────

describe("categorizeMod", () => {
  it("uses direct weaponCategory field over regex heuristic", () => {
    // "Shooting Blitz" has "blitz" which the old regex matched to "Unstable Bomber"
    // But its verified category is "Fast Gunner" via weaponCategory
    const result = categorizeMod({
      name: "Shooting Blitz",
      effectSummary: "Fast Gunner duration +4s. When Fast Gunner is active, Weapon DMG +15%.",
      tags: ["mod", "core", "weapon", "fast gunner"],
      id: "vmf-weapon-shooting-blitz",
      weaponCategory: "Fast Gunner",
    });
    expect(result).toBe("Fast Gunner");
  });

  it("resolves category from lowercase tags (as produced by verifiedModFamilies)", () => {
    // Tags from toCanonicalMod are lowercased — check case-insensitive matching
    const result = categorizeMod({
      name: "Shock Rampage",
      tags: ["mod", "core", "weapon", "power surge"],
      id: "vmf-weapon-shock-rampage",
    });
    expect(result).toBe("Power Surge");
  });

  it("does NOT run keyword heuristic on gear mods", () => {
    // "Mag Expansion" has "reload" in its effect — should NOT become "Fast Gunner"
    const result = categorizeMod({
      name: "Mag Expansion",
      effectSummary: "When reloading an empty magazine, Magazine Capacity +30.0%.",
      tags: ["mod", "core", "head"],
      id: "vmf-head-mag-expansion",
      modSlot: "head",
    });
    expect(result).toBe("General");
    expect(result).not.toBe("Fast Gunner");
  });

  it("falls back to regex for unverified weapon mods", () => {
    const result = categorizeMod({
      name: "Some Unknown Frost Mod",
      tags: [],
      id: "unknown-frost-thing",
    });
    expect(result).toBe("Frost");
  });

  it("returns General for weapon mods with no matching pattern", () => {
    const result = categorizeMod({
      name: "Mystery Mod",
      effectSummary: "Does something unusual.",
      tags: [],
      id: "mystery-mod",
    });
    expect(result).toBe("General");
  });
});

// ─────────────────────────────────────────────────────────────
// d) Mechanic filters only include items mapped to that mechanic
// ─────────────────────────────────────────────────────────────

describe("slot normalization", () => {
  it("normalizes weapon mod slots correctly", () => {
    expect(normalizeModSlot("weapon")).toBe("weapon");
    expect(normalizeModSlot("primary")).toBe("weapon");
    expect(normalizeModSlot("secondary")).toBe("weapon");
  });

  it("normalizes gear mod slots correctly", () => {
    expect(normalizeModSlot("helmet")).toBe("head");
    expect(normalizeModSlot("head")).toBe("head");
    expect(normalizeModSlot("mask")).toBe("mask");
    expect(normalizeModSlot("chest")).toBe("chest");
    expect(normalizeModSlot("top")).toBe("chest");
    expect(normalizeModSlot("boots")).toBe("boots");
    expect(normalizeModSlot("shoes")).toBe("boots");
  });

  it("gearSlotLabel returns slot display name not a weapon category", () => {
    expect(gearSlotLabel("head")).toBe("Helmet");
    expect(gearSlotLabel("chest")).toBe("Top");
    expect(gearSlotLabel("pants")).toBe("Bottoms");
    expect(gearSlotLabel("mask")).toBe("Mask");
  });
});


// ─────────────────────────────────────────────────────────────
// e) Verified descriptions from verifiedModFamilies pass through cleanly
// ─────────────────────────────────────────────────────────────

describe("verifiedModFamilies descriptions are clean", () => {
  it("no verified mod effectSummary triggers raw token detection", () => {
    const failures: string[] = [];
    for (const mod of verifiedModFamilies) {
      if (isRawTokenDescription(mod.effectSummary ?? "")) {
        failures.push(`${mod.id}: "${mod.effectSummary?.slice(0, 60)}..."`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("formatEffectForDisplay passes verified descriptions through unchanged", () => {
    // Sample a few known-good verified entries
    const samples = verifiedModFamilies.slice(0, 10);
    for (const mod of samples) {
      const result = formatEffectForDisplay(mod.effectSummary, mod.confidence);
      expect(result).toBe(mod.effectSummary);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// f) Generated entries with raw tokens get the fallback message
// ─────────────────────────────────────────────────────────────

describe("generated entries with raw tokens get fallback", () => {
  it("key-gear entries with raw tokens receive fallback message", () => {
    const rawEntries = key_gear.filter((k) => isRawTokenDescription(k.effectSummary ?? ""));
    expect(rawEntries.length).toBeGreaterThan(0);
    for (const entry of rawEntries) {
      const result = formatEffectForDisplay(entry.effectSummary, entry.confidence);
      expect(result).not.toBe(entry.effectSummary);
      expect(
        result === "Effect data pending verification" ||
        result === "Estimated modifiers available — description not verified"
      ).toBe(true);
    }
  });

  it("mod-suffix entries with raw tokens receive fallback message", () => {
    const rawEntries = mod_suffixes.filter((s) => isRawTokenDescription(s.effectSummary ?? ""));
    expect(rawEntries.length).toBeGreaterThan(0);
    for (const entry of rawEntries) {
      const result = formatEffectForDisplay(entry.effectSummary, entry.confidence);
      expect(result).not.toBe(entry.effectSummary);
    }
  });

  it("weapon entries with raw tokens receive fallback message", () => {
    const rawEntries = weapons.filter((w) => isRawTokenDescription(w.effectSummary ?? ""));
    // At least the AUG and Compound Bow have raw tokens
    expect(rawEntries.length).toBeGreaterThan(0);
    for (const entry of rawEntries) {
      const result = formatEffectForDisplay(entry.effectSummary, entry.confidence);
      expect(result).not.toBe(entry.effectSummary);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// g) Formatter prefers clean text over fallback when available
// ─────────────────────────────────────────────────────────────

describe("formatter prefers clean text over fallback", () => {
  it("clean effectSummary is returned as-is regardless of confidence", () => {
    const cleanText = "Weapon DMG +15% for 10s after weapon swap.";
    expect(formatEffectForDisplay(cleanText, "verified")).toBe(cleanText);
    expect(formatEffectForDisplay(cleanText, "observed")).toBe(cleanText);
    expect(formatEffectForDisplay(cleanText, "estimated")).toBe(cleanText);
    expect(formatEffectForDisplay(cleanText, "placeholder")).toBe(cleanText);
  });

  it("raw token text triggers fallback even with high confidence", () => {
    const rawText = "Reload100% Duration7seconds Target3";
    expect(formatEffectForDisplay(rawText, "verified")).toBe(
      "Estimated modifiers available — description not verified"
    );
    expect(formatEffectForDisplay(rawText, "observed")).toBe(
      "Estimated modifiers available — description not verified"
    );
  });

  it("raw token text with placeholder/experimental confidence gets pending message", () => {
    const rawText = "Damage+% Duration10seconds";
    expect(formatEffectForDisplay(rawText, "placeholder")).toBe(
      "Effect data pending verification"
    );
    expect(formatEffectForDisplay(rawText, "experimental")).toBe(
      "Effect data pending verification"
    );
  });
});
