# Effect Description Verification Backlog

## Summary
- Total entries with raw token descriptions: 80
- Verified descriptions wired (from verifiedModFamilies.ts): 0 new (already wired via modRegistry.ts)
- Still needing human verification: 80

## Notes
- `verifiedModFamilies.ts` contains 96 verified weapon + gear mod entries that are already wired into `modRegistry.ts` via the import chain. These entries do NOT appear in this backlog — they are clean.
- The generated `mod-cores.generated.ts` entries (machine-translated Chinese) are superseded by `verifiedModFamilies.ts` at the registry level. They remain in the generated file as a historical reference but are not displayed.
- Entries below have `effectSummary` values that trigger `isRawTokenDescription()` and will show the fallback message to users.
- Deviations, armor pieces, and cradle perks are NOT included below — deviations use name-as-description (valid), armor uses "Part of X set" (valid), and cradle perks have verified descriptions.

---

## Weapons (needing verification)

| ID | Name | Family | Raw Text (first 80 chars) | Confidence |
|----|------|--------|---------------------------|------------|
| aug-electron-cloud | AUG - Electron Cloud | Rifle | `• Hit 30%Target • ReloadHit Target4(1) Duration7seconds Trigger 1 • Hit 10 H` | estimated |
| compound-bow-nowhere-to-run | Compound Bow - Nowhere to Run | Crossbow | `• Trigger Target+2 • +1 +1 Reload100% HitHitTarget1stacks【】 4stacks Duration` | estimated |

---

## Key Gear / Armor Pieces (needing verification)

| ID | Name | Slot | Raw Text (first 80 chars) | Confidence |
|----|------|------|---------------------------|------------|
| veteran-gloves | Veteran Gloves | gloves | `stacks Trigger Range / Area300%Damage` | estimated |
| drifter-gloves | Drifter Gloves | gloves | `Damage+15%、Crit Rate+15%` | estimated |
| gilded-gauntlets | Gilded Gauntlets | gloves | `(Crit Rate)Crit Rate、Crit DMG+20%` | estimated |
| bbq-gloves | BBQ Gloves | gloves | `stacks 100%` | estimated |
| fire-rune-boots | Fire Rune Boots | boots | `Target 50% Damage+30% Duration15seconds` | estimated |
| snow-camo-gloves | Snow Camo Gloves | gloves | `4Target 50%Super Anomaly StrengthStatus DMG(Damage 40%Damage)` | estimated |
| elder-cloak | Elder Cloak | chest | `Target TargetDamage50%Damage` | estimated |
| stealth-walker-shirt | Stealth Walker Shirt | chest | `Duration1.5Range / AreaEnemy( )` | estimated |
| frost-tactical-vest | Frost Tactical Vest | chest | `Range / Area120%Status DMG` | estimated |
| gas-hood | Gas Hood | head | `Trigger Crit Rate+35% Damage+15% Duration6seconds` | estimated |
| yellow-paint-mask | Yellow Paint Mask | head | `EnemyTrigger1` | estimated |
| mayfly-goggles | Mayfly Goggles | head | `Trigger Trigger1 Damage-30%` | estimated |
| overload-electro-pants | Overload Electro Pants | pants | `Trigger20 6 Elemental DMG+20% Cooldown4seconds CooldownTrigger` | estimated |
| magnetic-moment-top | Magnetic Moment Top | chest | `TargetDuration7Range / Area` | estimated |
| spreader-mask | Spreader Mask | mask | `Range / Area+50% 2%Range / Area Damage+1%` | estimated |
| blast-front-top | Blast Front Top | chest | `• +0.3seconds • Damage+30%` | estimated |
| shaman-vulture-top | Shaman Vulture Top | chest | `Trigger Crit Rate+35% Duration3seconds` | estimated |
| keen-leather-top | Keen Leather Top | chest | `Trigger 1 Damage+2%` | estimated |
| tactical-step-shoes | Tactical Step Shoes | boots | `HitTarget 40%1 HP1%` | estimated |
| veteran-hunter-boots | Veteran Hunter Boots | boots | `Target 1Hit Hit Weakspot DMG+30%` | estimated |
| blood-trail-boots | Blood Trail Boots | boots | `Enemy 20% Duration5seconds Target` | estimated |
| stomp-boots | Stomp Boots | boots | `Enemy Damage+30%` | estimated |
| hard-tactical-boots | Hard Tactical Boots | boots | `seconds1 Fire Rate+15%` | estimated |
| leather-boots | Leather Boots | boots | `seconds2.5%HP HP50%` | estimated |
| oasis-mask | Oasis Mask | mask | `• stacks+10 • stacks +1%` | estimated |
| desert-dust-mask | Desert Dust Mask | mask | `Trigger 70%1+20%` | estimated |
| precision-shot-mask | Precision Shot Mask | mask | `Trigger Reload+8% 10 stacks Reload` | estimated |
| magic-trigger-top | Magic Trigger Top | chest | `Trigger 40%` | estimated |
| thorn-dance-pants | Thorn Dance Pants | pants | `Hit 70%1` | estimated |
| blade-pants | Blade Pants | pants | `Trigger Trigger1` | estimated |
| toxic-hood | Toxic Hood | head | `• Hit1 • Damage+150%` | estimated |
| cage-helmet | Cage Helmet | head | `Trigger Trigger1` | estimated |
| snowbreak-top | Snowbreak Top | chest | `stacks Status DMG+25% Duration25seconds` | estimated |
| glide-pants | Glide Pants | pants | `Reload100% Movement Speed30% Duration2seconds 1 100% Duration1.5seconds` | estimated |

---

## Mod Suffixes (needing verification)

| ID | Name | Raw Text (first 80 chars) | Confidence |
|----|------|---------------------------|------------|
| suffix-mirror | Mirror | `Damage+% Duration10seconds` | observed |
| suffix-mirror-deviant-energy | Mirror Deviant Energy | `Status DMG+% Duration10seconds` | observed |
| suffix-wild | Wild | `15EnemyDamage+% 1+% +%` | observed |
| suffix-wild-deviant-energy | Wild Deviant Energy | `15EnemyStatus DMG+% 1+% +%` | observed |
| suffix-phantasmal | Phantasmal | `Damage+% Damage+%` | observed |
| suffix-phantasmal-deviant-energy | Phantasmal Deviant Energy | `Status DMG+% Status DMG+%` | observed |
| suffix-crescent | Crescent | `Damage+% Shield +%` | observed |
| suffix-crescent-deviant-energy | Crescent Deviant Energy | `Elemental DMG+% Shield +%` | observed |
| suffix-downstar | Downstar | `Damage+% Enemy%` | observed |
| suffix-downstar-deviant-energy | Downstar Deviant Energy | `Elemental DMG+% Enemy%` | observed |
| suffix-resonance | Resonance | `1Weakspot DMG Elemental DMG+% 8stacks Duration6seconds` | observed |
| suffix-resonance-deviant-energy | Resonance Deviant Energy | `1Elemental DMG Crit DMG+% 5stacks Duration6seconds` | observed |
| suffix-lunar | Lunar | `HP Crit DMG +%` | observed |
| suffix-lunar-deviant-energy | Lunar Deviant Energy | `HP Elemental DMG +%` | observed |

---

## Food Buffs (needing verification)

| ID | Name | Raw Text (first 80 chars) | Confidence |
|----|------|---------------------------|------------|
| canned-seafood-in-oil | Canned Seafood in Oil | `MiningLoggingFinal Hit ChanceGain66%、666%、6666%ResourceYieldBonus` | observed |
| stargazy-pie | Stargazy Pie | `WhileState Crit DMGIncrease25%` | observed |
| canned-steak | Canned Steak | `Shrapnel DMGIncrease20%` | observed |
| stardust-pumpkin-salad | Stardust Pumpkin Salad | `Crit DMGIncrease15%` | observed |
| roulette-dumplings | Roulette Dumplings | `RandomGainEffect SanityReduce150 AgainstDMG15% AgainstBossDMGIncrease15% Again` | observed |
| unusual-braised-meat | Unusual Braised Meat | `Sanity40% Gain15%DMG Reduction` | observed |
| bone-in-deviated-sausage | Bone-in Deviated Sausage | `AgainstBOSSDMGIncrease15%` | observed |
| mixed-fried-hot-dog | Mixed Fried Hot Dog | `AgainstWhileHunter's MarkStateEnemyDMGIncrease20%` | observed |
| spectral-canned-mushroom | Spectral Canned Mushroom | `5secondsBlinding Light Against3secondsStunEffect(CannotAgainst、)` | observed |
| assorted-canned-fruit | Assorted Canned Fruit | `Sanity80%Weakspot DMGIncrease25%` | observed |
| seafood-and-meat-platter | Seafood and Meat Platter | `HPCapIncrease15% 30seconds100%HP` | observed |
| honey-glazed-meat | Honey Glazed Meat | `HitWhileStateEnemy Crit RateIncrease15%` | observed |
| butter-matsutake-mushrooms | Butter Matsutake Mushrooms | `AgainstStatus DMGIncrease8% While、State Status DMGIncrease12%` | observed |
| gingerdrop | Gingerdrop | `TriggerHeavy FortressDurationIncrease5seconds` | observed |
| shellfish-meat | Shellfish Meat | `HitEnemy AgainstTarget5%Effect(Duration10seconds Cannot)` | observed |
| lunar-gummy | Lunar Gummy | `GainSanity*60%Max HPShield Duration30s 60sCannot` | observed |
| starry-bubble-tea | Starry Bubble Tea | `State Per SecondGain5%Max HPShield 50%Max HPShield` | observed |
| stardust-raspberry-shaved-ice | Stardust Raspberry Shaved Ice | `Duration<Effect>DurationIncrease20%` | observed |
| all-weather-stew | All-Weather Stew | `Max StaminaIncrease30% 、Cold ResistIncrease30(、State)` | observed |
| stardust-malt-ale | Stardust Malt Ale | `ResistIncrease(100/105) ReduceAgainstSanity` | observed |
| malt-ale | Malt Ale | `1100Sanity ResistIncrease70 ReduceAgainstSanity` | observed |
| stardust-tea | Stardust Tea | `1100Sanity Effect 、StateDurationIncrease2` | observed |
| stardust-energy-drink | Stardust Energy Drink | `Gain` | observed |
| ice-tea | Ice Tea | `1100Sanity Increase25% 2secondsMovement SpeedIncrease20%` | observed |
| stardust-italian-soup-can | Stardust Italian Soup Can | `Increase1 IncreaseChance` | observed |
| fruit-tea | Fruit Tea | `160Sanity ResistIncrease30 ReduceAgainstSanity` | observed |
| surprise-spring-roll | Surprise Spring Roll | `Increase5% ~ 15%Elemental DMG HP40% EffectDoubled` | observed |
| french-fries | French Fries | `Heavy FortressWeapon DMGIncrease20%` | observed |

---

## Suspicious Duplicate Names

| Name | IDs | Source Files |
|------|-----|-------------|
| Flame Resonance | vmf-weapon-flame-resonance, vmf-gloves-flame-resonance, core-flame-resonance | verifiedModFamilies, mod-cores.generated |
| Hug-in-a-Bowl | hug-in-a-bowl (food), hug-in-a-bowl (deviation) | food-buffs.generated, deviations.generated |

**Note:** The Flame Resonance duplicates are intentional — one is a weapon mod and one is a gloves mod with the same name but different slots. The Hug-in-a-Bowl duplication across food/deviation categories is an ID collision that should be namespaced (e.g., `food-hug-in-a-bowl` vs `deviation-hug-in-a-bowl`).

---

## Category/Slot Mismatches Still Detected

| ID | Claimed Category/Slot | Suspicious Field | Issue |
|----|-----------------------|------------------|-------|
| suffix-talents | weapon suffix | effectSummary: `(、、、)Damage` | Chinese punctuation artifacts in otherwise English entry |
| cowboy-boots | boots / fortress-warfare | effectSummary: `Cowboy Boots` | Name echoed as effect — no actual description |
| hot-dog-shorts | pants / bounce | effectSummary: `Hot Dog Shorts` | Name echoed as effect — no actual description |

---

## Data Pipeline Observations

1. **Generated mod-cores are superseded**: `modRegistry.ts` imports `verifiedModFamilies` (96 entries) which override the generated `mod-cores.generated.ts` entries. The generated cores remain as historical artifacts.

2. **No cross-reference possible for key-gear**: The key-gear entries have unique IDs not found in `verifiedModFamilies.ts`. These require fresh in-game captures.

3. **Food buff descriptions are tokenized stat fragments**: The food-buff generated entries come from a Chinese data sheet with no separator tokens between stat names and values. These need manual re-entry from in-game tooltips.

4. **Suffix entries lack numeric values**: Many suffix effectSummary fields show the stat name with `+%` but no actual number (e.g., `Damage+%`). The numbers are tier-dependent and were stripped during extraction.
