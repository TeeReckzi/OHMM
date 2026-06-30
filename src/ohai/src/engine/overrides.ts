import type { GearMechanicOverride } from "./types";
import { _testAddOverride } from "./mechanicRegistry";

const gildedGlovesOverride: GearMechanicOverride = {
  overrideId: "gilded-gloves-burn-crit",
  sourceGearName: "Gilded Gloves",
  affectedMechanicId: "burn",
  enablesCritRollPerTick: true,
  critChanceSource: "characterCritRate",
  critDamageSource: "characterCritDMG",
  source: { kind: "in_game_observation", label: "Gilded Gloves", note: "Gilded Gloves enables Burn damage to be crit-eligible. Each Burn tick rolls independently against character Crit Rate. EBR Grilled Octopus fire ring proc (at full Burn stacks) creates the additional damage events, not Gilded Gloves directly." },
  confidence: "observed_in_game_needs_testing",
  needsRetest: true,
  notes: "Gilded Gloves enables crit for Burn via canCrit=true. Extra crit damage events observed in testing are attributed to the EBR fire ring proc at full Burn stacks. Needs systematic verification to confirm crit eligibility mechanic and separate proc source."
};

export function registerInitialOverrides(): void {
  _testAddOverride(gildedGlovesOverride);
}

export function getInitialOverrides(): GearMechanicOverride[] {
  return [gildedGlovesOverride];
}
