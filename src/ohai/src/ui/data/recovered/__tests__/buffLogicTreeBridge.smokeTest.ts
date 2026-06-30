import {
 RECOVERED_LOGIC_TREE_BRIDGES,
 getLogicTreeBridgeByFilename,
 type RecoveredLogicTreeBridge,
} from '../buffLogicTreeBridge';

function assert(condition: boolean, message: string): void {
 if (!condition) throw new Error(message);
}

const EXPECTED_FILENAMES = [
 'buff_550005981_1.py',
 'buff_601430131_1.py',
 'buff_10200015_1.py',
 'buff_60143062_1.py',
 'behavior_player_melee_tachi_attack_attack02.py',
] as const;

const filenameSet = new Set(RECOVERED_LOGIC_TREE_BRIDGES.map((b) => b.filename));
for (const expected of EXPECTED_FILENAMES) {
 assert(filenameSet.has(expected), `buffLogicTreeBridge missing expected filename '${expected}'.`);
}

const seenFilenames = new Set<string>();
for (const bridge of RECOVERED_LOGIC_TREE_BRIDGES) {
 assert(!seenFilenames.has(bridge.filename),
  `buffLogicTreeBridge should not contain duplicate filename '${bridge.filename}'.`);
 seenFilenames.add(bridge.filename);

 assert(typeof bridge.candidateRole === 'string' && bridge.candidateRole.length > 0,
  `buffLogicTreeBridge entry '${bridge.filename}' must declare a non-empty candidateRole.`);
 assert(Array.isArray(bridge.importantFields) && bridge.importantFields.length > 0,
  `buffLogicTreeBridge entry '${bridge.filename}' must declare importantFields.`);
 assert(typeof bridge.confidence === 'string' && bridge.confidence.length > 0,
  `buffLogicTreeBridge entry '${bridge.filename}' must declare a confidence label.`);
 assert(Array.isArray(bridge.unresolvedQuestions) && bridge.unresolvedQuestions.length > 0,
  `buffLogicTreeBridge entry '${bridge.filename}' must declare at least one unresolvedQuestion.`);
}

const fireBridge = getLogicTreeBridgeByFilename('buff_550005981_1.py');
assert(!!fireBridge, 'buff_550005981_1.py must be retrievable by filename.');
const fireBridgeTyped: RecoveredLogicTreeBridge = fireBridge as RecoveredLogicTreeBridge;
assert(fireBridgeTyped.importantFields.includes('socket_buff_fire01'),
 'buff_550005981_1.py must declare socket_buff_fire01 as an important field.');
assert(fireBridgeTyped.importantFields.includes('is_buff_damage'),
 'buff_550005981_1.py must declare is_buff_damage as an important field.');
assert(fireBridgeTyped.importantFields.includes('use_final_dam_add_rate'),
 'buff_550005981_1.py must declare use_final_dam_add_rate as an important field.');
assert(fireBridgeTyped.importantFields.includes('use_final_ignore_dam_rate'),
 'buff_550005981_1.py must declare use_final_ignore_dam_rate as an important field.');

const stackBridge = getLogicTreeBridgeByFilename('buff_601430131_1.py');
assert(!!stackBridge, 'buff_601430131_1.py must be retrievable by filename.');
assert(stackBridge!.importantFields.includes('NodeChangeBuffStack'),
 'buff_601430131_1.py must declare NodeChangeBuffStack as an important field.');
assert(stackBridge!.importantFields.includes('buff_stack_checker'),
 'buff_601430131_1.py must declare buff_stack_checker as an important field.');

const getStackBridge = getLogicTreeBridgeByFilename('buff_10200015_1.py');
assert(!!getStackBridge, 'buff_10200015_1.py must be retrievable by filename.');
assert(getStackBridge!.importantFields.includes('NodeGetBuffStack'),
 'buff_10200015_1.py must declare NodeGetBuffStack as an important field.');
assert(getStackBridge!.importantFields.includes('buff_stack'),
 'buff_10200015_1.py must declare buff_stack as an important field.');

const castBridge = getLogicTreeBridgeByFilename('buff_60143062_1.py');
assert(!!castBridge, 'buff_60143062_1.py must be retrievable by filename.');
assert(castBridge!.importantFields.includes('NodeCastBuffToTarget'),
 'buff_60143062_1.py must declare NodeCastBuffToTarget as an important field.');
assert(castBridge!.importantFields.includes('keyword_tag_negate'),
 'buff_60143062_1.py must declare keyword_tag_negate as an important field.');

const attackBridge = getLogicTreeBridgeByFilename('behavior_player_melee_tachi_attack_attack02.py');
assert(!!attackBridge, 'behavior_player_melee_tachi_attack_attack02.py must be retrievable by filename.');
assert(attackBridge!.importantFields.includes('formula_attack_type'),
 'behavior_player_melee_tachi_attack_attack02.py must declare formula_attack_type as an important field.');

assert(getLogicTreeBridgeByFilename('does_not_exist.py') === undefined,
 'getLogicTreeBridgeByFilename should return undefined for unknown filenames.');

console.log('buffLogicTreeBridgeSmokeTest passed');
