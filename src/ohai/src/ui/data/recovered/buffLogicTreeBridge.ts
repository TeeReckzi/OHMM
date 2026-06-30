export type LogicTreeConfidence =
 | 'high-priority-candidate; numeric schema unresolved'
 | 'stack-changing buff logic candidate; numeric schema unresolved'
 | 'stack-reading buff logic candidate; numeric schema unresolved'
 | 'general attack/damage node schema reference; numeric schema unresolved';

export interface RecoveredLogicTreeBridge {
 filename: string;
 sourcePath: string;
 candidateRole: string;
 importantFields: readonly string[];
 confidence: LogicTreeConfidence;
 unresolvedQuestions: readonly string[];
 notes?: string;
}

export const RECOVERED_LOGIC_TREE_BRIDGES: readonly RecoveredLogicTreeBridge[] = [
 {
  filename: 'buff_550005981_1.py',
  sourcePath: 'game_common/data/logic_tree/buff_550005981_1.py',
  candidateRole: 'fire/scorch keyword buff logic candidate (socket_buff_fire01 family)',
  importantFields: [
   'socket_buff_fire01',
   'is_buff_damage',
   'is_keyword_sfx_use',
   'is_keyword_damage',
   'keyword_tag',
   'keyword_event_id',
   'keyword_sfx_path',
   'element_type',
   'jump_word_element_type',
   'formula_attack_type',
   'use_final_dam_add_rate',
   'use_final_ignore_dam_rate',
   'buff_id',
   'buff_lv',
   'mapping_buff',
  ],
  confidence: 'high-priority-candidate; numeric schema unresolved',
  unresolvedQuestions: [
   'Exact Burn/fire damage formula is not yet recovered.',
   'buff_id / buff_lv numeric values are present in the .pyc but not yet bridged to PSI/scaling.',
   'Node-level row schema (how many bytes per field) is still being recovered via tokenized_selected_rows.',
  ],
 },
 {
  filename: 'buff_601430131_1.py',
  sourcePath: 'game_common/data/logic_tree/buff_601430131_1.py',
  candidateRole: 'stack-changing buff logic candidate (NodeChangeBuffStack / buff_stack_checker family)',
  importantFields: [
   'on_buff_stack_change::%source_lv',
   'on_buff_stack_change',
   'buff_id',
   'buff_lv',
   'mapping_buff',
   'buff_stack_checker',
   'NodeChangeBuffStack',
  ],
  confidence: 'stack-changing buff logic candidate; numeric schema unresolved',
  unresolvedQuestions: [
   'How on_buff_stack_change resolves numeric stacks per source level is not yet recovered.',
   'What buff_id families are wired into this stack-changer is not yet enumerated.',
  ],
 },
 {
  filename: 'buff_10200015_1.py',
  sourcePath: 'game_common/data/logic_tree/buff_10200015_1.py',
  candidateRole: 'stack-reading buff logic candidate (NodeGetBuffStack family, used with max_hp / heal)',
  importantFields: [
   'NodeGetBuffStack',
   'buff_stack',
  ],
  confidence: 'stack-reading buff logic candidate; numeric schema unresolved',
  unresolvedQuestions: [
   'How buff_stack maps to numeric effect magnitude (e.g. heal amount) is not yet recovered.',
   'Whether buff_stack here is the same numeric system as buff_601430131_1 is not yet verified.',
  ],
 },
 {
  filename: 'buff_60143062_1.py',
  sourcePath: 'game_common/data/logic_tree/buff_60143062_1.py',
  candidateRole: 'conditional buff-cast / mark/keyword logic candidate (NodeCastBuffToTarget family)',
  importantFields: [
   'mapping_buff',
   'buff_id',
   'buff_lv',
   'element_type',
   'formula_attack_type',
   'keyword_tag',
   'keyword_tag_negate',
   'NodeCastBuffToTarget',
  ],
  confidence: 'general attack/damage node schema reference; numeric schema unresolved',
  unresolvedQuestions: [
   'Whether keyword_tag_negate is a boolean flag or numeric threshold is not yet recovered.',
   'Exact mapping_buff / buff_id numeric values are present in the .pyc but not yet bridged to the OHAI build sheet.',
  ],
  notes: 'Likely drives a conditional buff-cast or mark/keyword-related trigger; structure resembles a buff check + cast pipeline.',
 },
 {
  filename: 'behavior_player_melee_tachi_attack_attack02.py',
  sourcePath: 'game_common/data/logic_tree/behavior_player_melee_tachi_attack_attack02.py',
  candidateRole: 'general attack/damage node schema reference (not a status-effect driver)',
  importantFields: [
   'is_buff_damage',
   'damage_value',
   'element_type',
   'formula_attack_type',
   'is_keyword_damage',
   'is_keyword_sfx_use',
   'jump_word_element_type',
   'keyword_event_id',
   'keyword_sfx_path',
   'keyword_tag',
   'skill_rate',
   'skill_rate_type',
   'use_final_dam_add_rate',
   'use_final_ignore_dam_rate',
  ],
  confidence: 'general attack/damage node schema reference; numeric schema unresolved',
  unresolvedQuestions: [
   'Which of these fields are node-input vs node-output pins is not fully resolved.',
   'skill_rate_type enum values are present as strings but not yet enumerated.',
  ],
  notes: 'Useful as a reference for the attack-side row schema; not a status-effect candidate itself.',
 },
] as const;

export function getLogicTreeBridgeByFilename(filename: string): RecoveredLogicTreeBridge | undefined {
 return RECOVERED_LOGIC_TREE_BRIDGES.find((b) => b.filename === filename);
}
