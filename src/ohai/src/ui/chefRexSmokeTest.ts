import { CHEF_REX_MAX_BONUS_PERCENT, CHEF_REX_DEFAULT_BONUS_PERCENT } from './chefRex';

function assert(condition: boolean, message: string): void {
 if (!condition) throw new Error(message);
}

assert(CHEF_REX_MAX_BONUS_PERCENT === 42, 'Chef Rex max bonus must remain 42%.');
assert(CHEF_REX_DEFAULT_BONUS_PERCENT === 0, 'Chef Rex default bonus is 0 (manual only).');

console.log('chefRexSmokeTest passed');
