import {
  computeRuntimeFinalMultiplier,
  createRuntimeAttackPayload,
  runtimeKeywordForMechanic,
} from "./runtimeAttackTypes";

function assert(name: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${name}`);
  }
  console.log(`PASS ${name}`);
}

function run(): void {
  console.log("=== Runtime Attack Payload Smoke Test ===\n");

  const burnPayload = createRuntimeAttackPayload({
    elementType: "blaze",
    keyword: runtimeKeywordForMechanic("burn"),
    damageFeatureType: "keyword",
    isKeywordDamage: true,
    critAttack: true,
    weakAttack: false,
    finalAttackRateDic: {
      rate: 1.2,
      buildingRate: 1,
      formulaTypeRate: 1.15,
    },
    pvpDamageRate: 0.72,
  });

  assert("Burn maps to SCORCH keyword", burnPayload.keyword === "SCORCH");
  assert("Keyword damage flag preserved", burnPayload.isKeywordDamage === true);

  const burnFinal = computeRuntimeFinalMultiplier(burnPayload);
  assert(
    "Final multiplier combines rate × formulaTypeRate × pvpDamageRate",
    Math.abs(burnFinal - (1.2 * 1.15 * 0.72)) < 0.0001
  );

  const vortexPayload = createRuntimeAttackPayload({
    keyword: runtimeKeywordForMechanic("frostVortex"),
    damageFeatureType: "durative",
    snapshotPolicy: {
      reuseLastDamage: true,
      accumulateDamage: false,
      reuseLastTimeSeconds: 0,
    },
  });

  assert("Frost Vortex maps to VORTEX keyword", vortexPayload.keyword === "VORTEX");
  assert(
    "Durative attacks can reuse previous damage snapshots",
    vortexPayload.snapshotPolicy?.reuseLastDamage === true
  );

  const surgePayload = createRuntimeAttackPayload({
    keyword: runtimeKeywordForMechanic("powerSurge"),
    weakAttack: true,
    toughness: {
      extraToughnessDamageRate: 1.5,
      ignoreWeakPartRate: false,
      weaknessToughnessDamageMultiplier: 1.35,
    },
  });

  assert("Power Surge maps to SURGE keyword", surgePayload.keyword === "SURGE");
  assert(
    "Weakspot/toughness linkage metadata preserved",
    surgePayload.toughness.weaknessToughnessDamageMultiplier === 1.35
  );

  console.log("\nAll runtime payload smoke tests passed.\n");
}

run();
