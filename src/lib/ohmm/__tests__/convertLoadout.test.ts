import { describe, expect, it } from 'vitest';
import { buildSelectionToLoadoutMap, loadoutMapToBuildSelection } from '../convertLoadout';

function item(id: string) {
  return { id, name: id, category: 'Test', rarity: 'Rare', tier: 4, stars: 3 };
}

describe('loadoutMapToBuildSelection', () => {
  it('maps primary and secondary attachment UI keys into build state', () => {
    const build = loadoutMapToBuildSelection({
      primary: item('primary-weapon'),
      att_sight: item('primary-optic'),
      att_muzzle: item('primary-muzzle'),
      att_mag: item('primary-magazine'),
      att_barrel: item('primary-tactical'),
      att_stock: item('primary-stock'),
      att_ammo: item('primary-ammo'),

      secondary: item('secondary-weapon'),
      sec_att_sight: item('secondary-optic'),
      sec_att_muzzle: item('secondary-muzzle'),
      sec_att_mag: item('secondary-magazine'),
      sec_att_barrel: item('secondary-tactical'),
      sec_att_stock: item('secondary-stock'),
      sec_att_ammo: item('secondary-ammo'),
    }, 'attacker');

    expect(build.weapon.attachments).toEqual({
      optic: 'primary-optic',
      muzzle: 'primary-muzzle',
      magazine: 'primary-magazine',
      tactical: 'primary-tactical',
      stock: 'primary-stock',
      ammo: 'primary-ammo',
    });
    expect(build.secondaryWeapon?.attachments).toEqual({
      optic: 'secondary-optic',
      muzzle: 'secondary-muzzle',
      magazine: 'secondary-magazine',
      tactical: 'secondary-tactical',
      stock: 'secondary-stock',
      ammo: 'secondary-ammo',
    });
  });

  it('splits UI core::suffix mod IDs into explicit core and suffix selections', () => {
    const build = loadoutMapToBuildSelection({
      primary: item('primary-weapon'),
      primary_mod: {
        ...item('vmf-weapon-static-shock::power-surge'),
        name: 'Static Shock (Power Surge)',
      },
      mask_mod: {
        ...item('vmf-mask-most-wanted::the-bull-s-eye'),
        name: "Most Wanted (The Bull's Eye)",
      },
    }, 'attacker');

    expect(build.mods.weapon).toBe('vmf-weapon-static-shock');
    expect(build.modSelections?.weaponCore).toBe('vmf-weapon-static-shock');
    expect(build.modSelections?.weaponSuffix).toBe('suffix-power-surge');
    expect(build.mods.mask).toBe('vmf-mask-most-wanted');
    expect(build.modSelections?.maskCore).toBe('vmf-mask-most-wanted');
    expect(build.modSelections?.maskSuffix).toBe('suffix-the-bulls-eye');
  });

  it('preserves explicit mod suffix selections when converting build state back to loadout items', () => {
    const loadout = buildSelectionToLoadoutMap({
      id: 'roundtrip',
      label: 'Round Trip',
      role: 'attacker',
      weapon: {
        blueprintId: 'r500-memento',
        stars: 3,
        tier: 4,
        calibration: 'none',
        attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'none' },
      },
      armor: { head: 'none', mask: 'none', chest: 'none', gloves: 'none', pants: 'none', boots: 'none' },
      mods: { weapon: 'vmf-weapon-static-shock', head: 'none', mask: 'none', chest: 'none', gloves: 'none', pants: 'none', boots: 'none' },
      modSelections: {
        weaponCore: 'vmf-weapon-static-shock',
        weaponSuffix: 'suffix-power-surge',
        maskCore: 'vmf-mask-most-wanted',
        maskSuffix: 'suffix-the-bulls-eye',
      },
      cradle: { perks: [] },
      deviant: { id: 'none', trait: '' },
      food: { food: 'none', drink: 'none', chefRex: { enabled: false, bonusPercent: 0 } },
    });

    expect(loadout.primary_mod?.id).toBe('vmf-weapon-static-shock::suffix-power-surge');

    const roundTripped = loadoutMapToBuildSelection(loadout, 'attacker');
    expect(roundTripped.modSelections?.weaponCore).toBe('vmf-weapon-static-shock');
    expect(roundTripped.modSelections?.weaponSuffix).toBe('suffix-power-surge');
  });

  it('keeps a mod core selected when a UI suffix slug cannot be resolved', () => {
    const build = loadoutMapToBuildSelection({
      primary: item('primary-weapon'),
      primary_mod: {
        ...item('scorched::not-a-real-suffix'),
        name: 'Scorched (Not A Real Suffix)',
      },
    }, 'attacker');

    expect(build.mods.weapon).toBe('scorched');
    expect(build.modSelections?.weaponCore).toBe('scorched');
    expect(build.modSelections?.weaponSuffix).toBeUndefined();
  });
});
