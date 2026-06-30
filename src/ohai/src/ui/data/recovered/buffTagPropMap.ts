export type BuffTagFamily =
 | 'scorch'
 | 'surge'
 | 'frozen'
 | 'vortex'
 | 'mark'
 | 'armed'
 | 'quick_draw'
 | 'bleeding';

export type BuffTagTimeOp = 'extend' | 'reduce';
export type BuffTagKind = 'buff' | 'debuff';

export type BuffTagPropName =
 | 'tag_debuff_time_reduce_add_rate_scorch'
 | 'tag_debuff_time_extend_add_rate_scorch'
 | 'tag_debuff_time_extend_add_rate_surge'
 | 'tag_debuff_time_reduce_add_rate_frozen'
 | 'tag_debuff_time_extend_add_rate_frozen'
 | 'tag_debuff_time_reduce_add_rate_vortex'
 | 'tag_debuff_time_extend_add_rate_vortex'
 | 'tag_debuff_time_reduce_add_rate_mark'
 | 'tag_debuff_time_extend_add_rate_mark'
 | 'tag_buff_time_extend_add_rate_armed'
 | 'tag_buff_time_extend_add_rate_quick_draw'
 | 'tag_debuff_time_reduce_add_rate_bleeding'
 | 'tag_debuff_time_extend_add_rate_bleeding';

export interface RecoveredBuffTagProp {
 family: BuffTagFamily;
 kind: BuffTagKind;
 timeOp: BuffTagTimeOp;
 prop: BuffTagPropName;
 source: 'buff_tag_prop_map.py';
 confidence: 'recovered';
 semanticLabel?: string;
 semanticConfidence?: 'likely' | 'unknown';
}

export interface BuffTagFamilySummary {
 family: BuffTagFamily;
 props: BuffTagPropName[];
 semanticLabel?: string;
 semanticConfidence: 'likely' | 'unknown';
}

interface SemanticLabel {
 label: string;
 confidence: 'likely' | 'unknown';
}

const SEMANTIC_LABELS: Record<BuffTagFamily, SemanticLabel> = {
 scorch: { label: 'Burn / Scorch / fire status family', confidence: 'likely' },
 surge: { label: 'Power Surge / electric status family', confidence: 'likely' },
 frozen: { label: 'Frozen / frost status family', confidence: 'likely' },
 vortex: { label: 'Frost Vortex', confidence: 'likely' },
 mark: { label: 'Hunter Mark', confidence: 'likely' },
 armed: { label: 'Fortress Warfare / Armed / heavy stance buff family', confidence: 'likely' },
 quick_draw: { label: 'Fast Gunner / Quick Draw', confidence: 'likely' },
 bleeding: { label: 'Bleed', confidence: 'likely' },
};

export const RECOVERED_BUFF_TAG_PROPS: readonly RecoveredBuffTagProp[] = [
 {
  family: 'scorch',
  kind: 'debuff',
  timeOp: 'reduce',
  prop: 'tag_debuff_time_reduce_add_rate_scorch',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.scorch.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'scorch',
  kind: 'debuff',
  timeOp: 'extend',
  prop: 'tag_debuff_time_extend_add_rate_scorch',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.scorch.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'surge',
  kind: 'debuff',
  timeOp: 'extend',
  prop: 'tag_debuff_time_extend_add_rate_surge',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.surge.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'frozen',
  kind: 'debuff',
  timeOp: 'reduce',
  prop: 'tag_debuff_time_reduce_add_rate_frozen',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.frozen.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'frozen',
  kind: 'debuff',
  timeOp: 'extend',
  prop: 'tag_debuff_time_extend_add_rate_frozen',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.frozen.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'vortex',
  kind: 'debuff',
  timeOp: 'reduce',
  prop: 'tag_debuff_time_reduce_add_rate_vortex',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.vortex.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'vortex',
  kind: 'debuff',
  timeOp: 'extend',
  prop: 'tag_debuff_time_extend_add_rate_vortex',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.vortex.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'mark',
  kind: 'debuff',
  timeOp: 'reduce',
  prop: 'tag_debuff_time_reduce_add_rate_mark',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.mark.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'mark',
  kind: 'debuff',
  timeOp: 'extend',
  prop: 'tag_debuff_time_extend_add_rate_mark',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.mark.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'armed',
  kind: 'buff',
  timeOp: 'extend',
  prop: 'tag_buff_time_extend_add_rate_armed',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.armed.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'quick_draw',
  kind: 'buff',
  timeOp: 'extend',
  prop: 'tag_buff_time_extend_add_rate_quick_draw',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.quick_draw.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'bleeding',
  kind: 'debuff',
  timeOp: 'reduce',
  prop: 'tag_debuff_time_reduce_add_rate_bleeding',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.bleeding.label,
  semanticConfidence: 'likely',
 },
 {
  family: 'bleeding',
  kind: 'debuff',
  timeOp: 'extend',
  prop: 'tag_debuff_time_extend_add_rate_bleeding',
  source: 'buff_tag_prop_map.py',
  confidence: 'recovered',
  semanticLabel: SEMANTIC_LABELS.bleeding.label,
  semanticConfidence: 'likely',
 },
] as const;

export const BUFF_TAG_FAMILIES: readonly BuffTagFamily[] = [
 'scorch',
 'surge',
 'frozen',
 'vortex',
 'mark',
 'armed',
 'quick_draw',
 'bleeding',
] as const;

export const BUFF_TAG_FAMILY_SUMMARIES: readonly BuffTagFamilySummary[] = BUFF_TAG_FAMILIES.map((family) => {
 const propsForFamily = RECOVERED_BUFF_TAG_PROPS.filter((p) => p.family === family).map((p) => p.prop);
 const semantic = SEMANTIC_LABELS[family];
 return {
  family,
  props: propsForFamily,
  semanticLabel: semantic.label,
  semanticConfidence: semantic.confidence,
 };
});

export function getRecoveredBuffTagPropsByFamily(family: BuffTagFamily): RecoveredBuffTagProp[] {
 return RECOVERED_BUFF_TAG_PROPS.filter((p) => p.family === family);
}

export function isBuffTagFamily(value: string): value is BuffTagFamily {
 return (BUFF_TAG_FAMILIES as readonly string[]).includes(value);
}
