import {
 CHEF_REX_BASE_BONUS_PERCENT,
 CHEF_REX_MAX_BONUS_PERCENT,
 clampChefRexActivityRating,
 clampChefRexSkillRating,
 defaultChefRexBonus,
 deriveChefRexBonus,
} from './chefRex';

function assert(condition: boolean, message: string): void {
 if (!condition) throw new Error(message);
}

assert(CHEF_REX_BASE_BONUS_PERCENT === 20, 'Chef Rex base mitigation must remain 20%.');
assert(CHEF_REX_MAX_BONUS_PERCENT === 42, 'Chef Rex max mitigation must remain 42%.');
assert(deriveChefRexBonus(1, 1) === 20, 'Chef Rex 1/1 should derive to base 20%.');
assert(defaultChefRexBonus === deriveChefRexBonus(4, 3), 'Default Chef Rex bonus should derive from 4/3 ratings.');
assert(deriveChefRexBonus(5, 5) <= 42, 'Chef Rex derived bonus must be capped at 42%.');
assert(clampChefRexSkillRating(0) === 1, 'Chef Rex skill rating should clamp low values to 1.');
assert(clampChefRexSkillRating(99) === 5, 'Chef Rex skill rating should clamp high values to 5.');
assert(clampChefRexActivityRating(0) === 1, 'Chef Rex activity rating should clamp low values to 1.');
assert(clampChefRexActivityRating(99) === 5, 'Chef Rex activity rating should clamp high values to 5.');

console.log('chefRexSmokeTest passed');
