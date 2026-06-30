import {
 BUFF_TAG_FAMILIES,
 BUFF_TAG_FAMILY_SUMMARIES,
 RECOVERED_BUFF_TAG_PROPS,
 getRecoveredBuffTagPropsByFamily,
 isBuffTagFamily,
 type BuffTagFamily,
 type BuffTagPropName,
} from '../buffTagPropMap';

function assert(condition: boolean, message: string): void {
 if (!condition) throw new Error(message);
}

const EXPECTED_FAMILIES: BuffTagFamily[] = [
 'scorch',
 'surge',
 'frozen',
 'vortex',
 'mark',
 'armed',
 'quick_draw',
 'bleeding',
];

const EXPECTED_PROPS: BuffTagPropName[] = [
 'tag_debuff_time_reduce_add_rate_scorch',
 'tag_debuff_time_extend_add_rate_scorch',
 'tag_debuff_time_extend_add_rate_surge',
 'tag_debuff_time_reduce_add_rate_frozen',
 'tag_debuff_time_extend_add_rate_frozen',
 'tag_debuff_time_reduce_add_rate_vortex',
 'tag_debuff_time_extend_add_rate_vortex',
 'tag_debuff_time_reduce_add_rate_mark',
 'tag_debuff_time_extend_add_rate_mark',
 'tag_buff_time_extend_add_rate_armed',
 'tag_buff_time_extend_add_rate_quick_draw',
 'tag_debuff_time_reduce_add_rate_bleeding',
 'tag_debuff_time_extend_add_rate_bleeding',
];

assert(BUFF_TAG_FAMILIES.length === 8, 'buffTagPropMap should expose exactly 8 families.');
for (const family of EXPECTED_FAMILIES) {
 assert(BUFF_TAG_FAMILIES.includes(family), `buffTagPropMap missing expected family '${family}'.`);
}

assert(RECOVERED_BUFF_TAG_PROPS.length === EXPECTED_PROPS.length,
 `buffTagPropMap should expose exactly ${EXPECTED_PROPS.length} recovered props, got ${RECOVERED_BUFF_TAG_PROPS.length}.`);

for (const prop of EXPECTED_PROPS) {
 assert(RECOVERED_BUFF_TAG_PROPS.some((p) => p.prop === prop),
  `buffTagPropMap missing expected prop '${prop}'.`);
}

const propSet = new Set(RECOVERED_BUFF_TAG_PROPS.map((p) => p.prop));
assert(propSet.size === RECOVERED_BUFF_TAG_PROPS.length,
 'buffTagPropMap should not contain duplicate props.');

const scorchProps = getRecoveredBuffTagPropsByFamily('scorch');
const scorchOps = new Set(scorchProps.map((p) => `${p.kind}:${p.timeOp}`));
assert(scorchOps.has('debuff:reduce'), 'scorch should expose a debuff:reduce prop.');
assert(scorchOps.has('debuff:extend'), 'scorch should expose a debuff:extend prop.');

const surgeProps = getRecoveredBuffTagPropsByFamily('surge');
assert(surgeProps.length > 0, 'surge should expose at least one prop.');
const surgeExtend = surgeProps.filter((p) => p.timeOp === 'extend' && p.kind === 'debuff');
assert(surgeExtend.length >= 1, 'surge should expose at least one debuff:extend prop.');

const armedProps = getRecoveredBuffTagPropsByFamily('armed');
assert(armedProps.length > 0, 'armed should expose at least one prop.');
assert(armedProps.every((p) => p.kind === 'buff'), 'armed props must all be kind=buff.');

const quickDrawProps = getRecoveredBuffTagPropsByFamily('quick_draw');
assert(quickDrawProps.length > 0, 'quick_draw should expose at least one prop.');
assert(quickDrawProps.every((p) => p.kind === 'buff'), 'quick_draw props must all be kind=buff.');

for (const summary of BUFF_TAG_FAMILY_SUMMARIES) {
 assert(summary.props.length > 0, `Family '${summary.family}' must expose at least one prop.`);
 assert(summary.semanticConfidence === 'likely' || summary.semanticConfidence === 'unknown',
  `Family '${summary.family}' must declare a valid semanticConfidence.`);
}

assert(isBuffTagFamily('scorch'), 'isBuffTagFamily("scorch") must return true.');
assert(!isBuffTagFamily('not-a-family'), 'isBuffTagFamily("not-a-family") must return false.');

console.log('buffTagPropMapSmokeTest passed');
