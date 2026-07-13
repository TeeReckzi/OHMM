#!/usr/bin/env python3
"""
Structure the mining output into usable data files for OHMM's registries.

Reads mining_output/ reports and the raw corpus strings, then produces:
1. keyword_enum_map.json — keyword type IDs → names + Chinese names
2. damage_formula_variables.json — all formula variable names with categories
3. deviation_system.json — fusion slots, skill types, states, material types
4. calibration_data.json — affix options, blueprint tables, perk system
5. weapon_constants.json — weapon types, shield system, hold states
6. mod_system.json — mod v2 index fields, shiny system, prop fields
7. buff_keyword_map.json — buff keyword identifiers for damage parsing
8. id_to_name_map.json — internal IDs → localized names and icon paths
9. stat_key_candidates.json — all stat-like variable names found in formulas

Output: src/ohai/data/extracted/structured/
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

CORPUS_ROOT = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\root_script_dictrained\raw")
MINING_DIR = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\mining_output")
OUTPUT_DIR = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\structured")


def extract_strings_from_pyc(filepath: Path, min_len: int = 4) -> list[str]:
    """Extract printable ASCII strings from a .pyc file."""
    if not filepath.exists():
        return []
    data = filepath.read_bytes()
    strings = []
    current = bytearray()
    for byte in data:
        if 32 <= byte < 127:
            current.append(byte)
        else:
            if len(current) >= min_len:
                s = bytes(current).decode('ascii')
                strings.append(s)
            current.clear()
    if len(current) >= min_len:
        strings.append(bytes(current).decode('ascii'))
    return strings


def load_mining_json(name: str) -> dict:
    path = MINING_DIR / name
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    return {}


def write_output(name: str, data: Any):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / name
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str) + '\n', encoding='utf-8')
    print(f"  Written: {name} ({path.stat().st_size / 1024:.1f} KB)")


# ── 1. Keyword Enum Map ──

def build_keyword_enum_map() -> dict:
    """Extract keyword type IDs and names from keyword-related files."""
    keyword_files = [
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordBase.pyc",
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordDianYong.pyc",
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordBaoDan.pyc",
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordBingShuangXuanWo.pyc",
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordSuiDan.pyc",
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordNormal.pyc",
        "dcs_extend/component/shoot_new/keyword/SubCompKeywordTanShe.pyc",
        "dcs_extend/component/shoot_new/keyword/CompShootDamageSimulateClient.pyc",
        "dcs_extend/common/damage_event_parser.pyc",
    ]

    # Known mappings from mining pass
    keyword_map = {
        "001": {"id": "KEYWORD_TYPE_001", "english": "Normal", "chinese": "普通", "class": "SubCompKeywordNormal"},
        "302": {"id": "KEYWORD_TYPE_302", "english": "Power Surge", "chinese": "电涌 (DianYong)", "class": "SubCompKeywordDianYong"},
        "303": {"id": "KEYWORD_TYPE_303", "english": "Frost Vortex", "chinese": "冰霜旋涡 (BingShuangXuanWo)", "class": "SubCompKeywordBingShuangXuanWo"},
        "306": {"id": "KEYWORD_TYPE_306", "english": "Unstable Bomber", "chinese": "爆弹 (BaoDan)", "class": "SubCompKeywordBaoDan"},
        "312": {"id": "KEYWORD_TYPE_312", "english": "Shrapnel", "chinese": "碎弹 (SuiDan)", "class": "SubCompKeywordSuiDan"},
    }

    # Extract additional from damage_event_parser
    parser_strings = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/common/damage_event_parser.pyc")
    buff_keywords = [s for s in parser_strings if s.startswith('BUFF_KEYWORD_')]
    keyword_map["_buff_keywords"] = buff_keywords

    # Look for more keyword type files
    keyword_dir = CORPUS_ROOT / "dcs_extend/component/shoot_new/keyword"
    if keyword_dir.exists():
        for f in sorted(keyword_dir.glob("SubCompKeyword*.pyc")):
            name = f.stem.replace("SubCompKeyword", "")
            if name not in ["Base"]:
                strings = extract_strings_from_pyc(f)
                type_ids = [s for s in strings if s.startswith("KEYWORD_TYPE_")]
                if type_ids:
                    for tid in type_ids:
                        num = tid.replace("KEYWORD_TYPE_", "")
                        if num not in keyword_map:
                            keyword_map[num] = {
                                "id": tid,
                                "english": name,
                                "chinese": f"(from {f.stem})",
                                "class": f.stem,
                            }

    return {"keywords": keyword_map, "source": "dcs_extend/component/shoot_new/keyword/"}


# ── 2. Damage Formula Variables ──

def build_damage_formula_variables() -> dict:
    """Extract and categorize all damage formula variable names."""
    formula_file = CORPUS_ROOT / "game_common/data/formula_data/damage_formula.pyc"
    strings = extract_strings_from_pyc(formula_file)

    # Categorize formula variables
    categories = {
        "crit": [],
        "weakspot": [],
        "attack": [],
        "damage_type": [],
        "species": [],
        "keyword": [],
        "element": [],
        "melee": [],
        "debuff": [],
        "flags": [],
        "target": [],
        "other": [],
    }

    formula_vars = []
    for s in strings:
        if not re.match(r'^[a-z_]+$', s) and not re.match(r'^[a-z_]+[a-z0-9_]*$', s):
            if re.match(r'^[A-Z][A-Z_.]+', s):
                # Constant
                pass
            else:
                continue

        s_lower = s.lower()
        formula_vars.append(s)

        if 'crit' in s_lower or 'cirt' in s_lower:
            categories['crit'].append(s)
        elif 'weak' in s_lower:
            categories['weakspot'].append(s)
        elif 'attack' in s_lower and 'type' not in s_lower:
            categories['attack'].append(s)
        elif 'dam_add_rate' in s_lower or 'dam_ignore' in s_lower or 'dam_rate' in s_lower:
            categories['damage_type'].append(s)
        elif 'species' in s_lower:
            categories['species'].append(s)
        elif 'keyword' in s_lower:
            categories['keyword'].append(s)
        elif 'element' in s_lower or 'lightning' in s_lower:
            categories['element'].append(s)
        elif 'melee' in s_lower:
            categories['melee'].append(s)
        elif 'debuff' in s_lower:
            categories['debuff'].append(s)
        elif s_lower.startswith('attack_is_') or s_lower.startswith('use_') or s_lower.startswith('target_has_'):
            categories['flags'].append(s)
        elif 'target' in s_lower or 'unit' in s_lower:
            categories['target'].append(s)
        else:
            categories['other'].append(s)

    # Also get formula_const variables
    formula_const = CORPUS_ROOT / "dcs_extend/const/formula_const.pyc"
    const_strings = extract_strings_from_pyc(formula_const)
    formula_types = [s for s in const_strings if s[0].isupper() and len(s) > 3]
    formula_funcs = [s for s in const_strings if 'get_' in s or 'final_' in s or 'base_' in s]

    return {
        "formula_variables": sorted(set(formula_vars)),
        "categorized": {k: sorted(set(v)) for k, v in categories.items() if v},
        "formula_types": sorted(set(formula_types)),
        "formula_adapter_functions": sorted(set(formula_funcs)),
        "source": "game_common/data/formula_data/damage_formula.pyc + dcs_extend/const/formula_const.pyc",
    }


# ── 3. Deviation System ──

def build_deviation_system() -> dict:
    """Extract deviation/fusion system enums, slots, and types."""
    files = {
        "DeviationConst": "game_common/deviation/DeviationConst.pyc",
        "deviation_const": "dcs_extend/const/deviation_const.pyc",
        "FusionResult": "game_common/deviation/fusion/FusionResult.pyc",
        "FusionAdditive": "game_common/deviation/fusion/FusionAdditive.pyc",
        "FusionNodeOutput": "game_common/deviation/fusion/FusionNodeOutput.pyc",
        "DeviationHelper": "game_common/helper/DeviationHelper.pyc",
        "DeviationDataModel": "game_common/deviation/DeviationDataModel.pyc",
        "deviation_utility": "dcs_extend/common/deviation_utility.pyc",
    }

    all_strings = {}
    for label, path in files.items():
        all_strings[label] = extract_strings_from_pyc(CORPUS_ROOT / path)

    # Parse known enum structures from DeviationConst
    dc = all_strings.get("DeviationConst", [])

    # Build structured enums from the string sequence
    deviation_system = {
        "skill_types": {
            "MATERIAL": 0, "WORKER": 1, "FIGHT": 2, "COMMON": 3,
            "REVERSED": 4, "SKIN": 5, "PASSIVE_SKILL": 6, "ACTIVE_SKILL": 7,
            "DEVIATION_LEVEL": 8, "ANIMAL": 9, "FURNITURE": 10,
            "DEVIATION_SCRIPT_SP": 11, "DEVIATION_BATTLE_PASSIVE": 12,
            "ANIMAL_AND_FURNITURE": 13,
        },
        "data_location": {
            "NONE": 0, "TERRITORY": 1, "BUILDING": 2, "MAIL": 3,
            "ACCOUNT_WAREHOUSE": 4,
        },
        "fusion_slots": {
            "SLOT_1": 0, "SLOT_2": 1, "RESULT": 2,
            "CORE_SLOT_LST": [0, 1], "DESTROY_SLOT_LST": [0, 1],
        },
        "fusion_states": {
            "START": 0, "TAKE_OFF": 1, "TAKE_OUT": 2,
        },
        "fusion_putin_types": {
            "ADDITIVE_MATERIAL": 0, "CATALYSIS_MATERIAL": 1,
        },
        "fusion_material_types": {
            "ITEM_MAIN_SUB_TYPE": 0, "ITEM_NO": 1, "FUSION_CORE_SKILLS": 2,
        },
        "wish_box_states": {
            "NORMAL": 0, "WAIT_FOR_TRANS": 1, "IN_TRANS": 2, "WAIT_FOR_RECEIVE": 3,
        },
        "work_states": {
            "SLEEPING": 0, "WORKING": 1,
        },
        "summon_events": [s for s in all_strings.get("deviation_const", []) if s.isupper() and len(s) > 4 and '_' in s][:30],
        "combat_ops": [s for s in all_strings.get("deviation_const", []) if 'COMBAT' in s or 'SKILL' in s][:20],
    }

    # Fusion functions from FusionResult
    fusion_funcs = [s for s in all_strings.get("FusionResult", []) if 'fusion' in s.lower() or 'skill' in s.lower()]
    deviation_system["fusion_functions"] = sorted(set(fusion_funcs))[:50]

    # Helper functions
    helper_funcs = [s for s in all_strings.get("DeviationHelper", []) if 'deviation' in s.lower()]
    deviation_system["helper_functions"] = sorted(set(helper_funcs))[:50]

    deviation_system["source_files"] = list(files.values())
    return deviation_system


# ── 4. Calibration Data ──

def build_calibration_data() -> dict:
    """Extract calibration and blueprint system constants."""
    files = {
        "GunCoreHelper": "game_common/guncore/GunCoreHelper.pyc",
        "BluePrintHelper": "game_common/guncore/BluePrintHelper.pyc",
        "GunPerkConst": "game_common/gunperk/GunPerkConst.pyc",
        "calibration_data": "game_common/data/gun_calibration_affix_option_data.pyc",
    }

    all_strings = {}
    for label, path in files.items():
        all_strings[label] = extract_strings_from_pyc(CORPUS_ROOT / path)

    perk_const = all_strings.get("GunPerkConst", [])
    blueprint = all_strings.get("BluePrintHelper", [])
    guncore = all_strings.get("GunCoreHelper", [])

    return {
        "perk_qualities": {"Green": 1, "Blue": 2, "Purple": 3, "Yellow": 4, "Red": 5, "White": 0},
        "perk_slot_states": ["EmptyCalibrated", "Equipped", "EquippedCalibrated"],
        "perk_icon_states": ["Empty", "Normal", "Selected", "BatchSelected", "BatchUnselected", "BatchAllSelected"],
        "perk_sort_keys": ["perk_quality", "perk_cost", "perk_lv", "calibration_type", "apply_range", "perk_num"],
        "blueprint_data_tables": [s for s in blueprint if s.endswith('_data') and 'blueprint' in s.lower()],
        "gun_data_tables": [s for s in guncore if s.endswith('_data') and not s.startswith('get_')],
        "calibration_functions": [s for s in guncore if 'calibration' in s.lower()],
        "blueprint_types": {"EQUIP": 0, "GUN": 1},
        "blueprint_plaque_data_types": {"INTEGER": 0, "FLOAT": 1},
        "source_files": list(files.values()),
    }


# ── 5. Weapon Constants ──

def build_weapon_constants() -> dict:
    """Extract weapon type system and related constants."""
    strings = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/const/weapon_const.pyc")
    spring_strings = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/component/spring/spring_types.pyc")

    return {
        "hand_hold_states": {"Empty": 0, "Firearms": 1, "Melee": 2, "Tools": 3},
        "weapon_categories": {
            "WEAPON_GUN": "Firearms",
            "WEAPON_CLOSE_WEAPON": "Melee",
            "WEAPON_THROW": "Thrown",
            "WEAPON_TOOL": "Tools",
            "THROWN": "Thrown",
            "FLYING_KNIFE": "Thrown",
            "BUILD_TOOL": "Tools",
            "FLAME_GUN": "Firearms",
            "RPG_GUN": "Firearms",
        },
        "shield_hp_types": {
            "Fixed_Value": 0, "Relate_to_Attr": 1, "Relate_to_Master_Attr": 2,
            "Skill_Strength": 3, "Invincible": 4, "Input_Value": 5,
        },
        "shield_types": ["shield_self", "shield_offset", "shield_bind_socket", "shield_bind_handhold", "shield_offset_3d"],
        "spring_types": [s for s in spring_strings if s.startswith('GUN_') or s.startswith('gun_')],
        "source_files": ["dcs_extend/const/weapon_const.pyc", "dcs_extend/component/spring/spring_types.pyc"],
    }


# ── 6. Mod System ──

def build_mod_system() -> dict:
    """Extract mod v2 system structure."""
    strings = extract_strings_from_pyc(CORPUS_ROOT / "game_common/Mod/ModV2IndexCache.pyc")

    return {
        "index_fields": ["total_level", "shiny", "normal", "range_map", "level_map", "level_idx", "range_idx"],
        "query_fields": ["check_level", "check_shiny", "check_group_set"],
        "operations": ["init_mod_v2_index", "update_mod_v2_index", "remove_mod_v2_index", "rebuild_mod_v2_index", "query_mod_v2_count"],
        "properties": ["mod_code", "dynamic_prop_per", "is_shiny", "apply_range"],
        "all_identifiers": [s for s in strings if re.match(r'^[a-z_]+[a-z0-9_]*$', s) and len(s) > 3],
        "source_files": ["game_common/Mod/ModV2IndexCache.pyc"],
    }


# ── 7. Buff Keyword Map ──

def build_buff_keyword_map() -> dict:
    """Extract buff keyword identifiers used in damage parsing."""
    parser = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/common/damage_event_parser.pyc")

    buff_keywords = [s for s in parser if s.startswith('BUFF_KEYWORD_')]
    damage_parse_types = [s for s in parser if s.startswith('KILL_') or s.startswith('UNIT_')]
    weapon_plaque_types = [s for s in parser if s.startswith('UNIT_TYPE_') or s.startswith('UNIT_SPECIES_') or s.startswith('UNIT_PROTOTYPE_')]

    return {
        "buff_keywords": {
            "BUFF_KEYWORD_BLAST": {"english": "Unstable Bomber", "element": "blast"},
            "BUFF_KEYWORD_SCORCH": {"english": "Burn", "element": "blaze"},
            "BUFF_KEYWORD_VORTEX": {"english": "Frost Vortex", "element": "frost"},
            "BUFF_KEYWORD_SURGE": {"english": "Power Surge", "element": "shock"},
            "BUFF_KEYWORD_SHRAP": {"english": "Shrapnel", "element": "physical"},
            "BUFF_KEYWORD_PROJ": {"english": "Bounce", "element": "physical"},
            "BUFF_KEYWORD_MARK": {"english": "The Bull's Eye", "element": "none"},
            "BUFF_KEYWORD_QUICK_DRAW": {"english": "Fast Gunner", "element": "none"},
            "BUFF_KEYWORD_ARMED": {"english": "Fortress Warfare", "element": "none"},
        },
        "damage_parse_types": sorted(set(damage_parse_types)),
        "weapon_plaque_types": sorted(set(weapon_plaque_types)),
        "unit_species_identifiers": [s for s in parser if 'SPECIES' in s],
        "source": "dcs_extend/common/damage_event_parser.pyc",
    }


# ── 8. ID-to-Name Map ──

def build_id_to_name_map() -> dict:
    """Extract ID→name and ID→icon path mappings from localization and icon files."""
    mining_data = load_mining_json('icon_model_maps.json')
    loc_data = load_mining_json('localization_maps.json')

    # Process icon/model paths
    icon_paths = {}
    for entry in mining_data.get('files', []):
        for path_str in entry.get('asset_paths', []):
            # Extract the meaningful part
            if any(ext in path_str for ext in ['.png', '.jpg', '.dds', '.gim', '.mesh']):
                key = path_str.split('/')[-1] if '/' in path_str else path_str
                icon_paths[key] = {'full_path': path_str, 'source': entry['path']}

    # Process localization strings
    loc_strings = {}
    for entry in loc_data.get('files', []):
        for s in entry.get('strings', []):
            if re.match(r'^[A-Z][A-Z0-9_]+$', s) and len(s) > 5:
                loc_strings[s] = entry['path']

    return {
        "icon_model_paths": dict(list(icon_paths.items())[:500]),
        "localization_keys": dict(list(loc_strings.items())[:500]),
        "total_icon_paths": len(icon_paths),
        "total_loc_keys": len(loc_strings),
    }


# ── 9. Stat Key Candidates ──

def build_stat_key_candidates() -> dict:
    """Extract all stat-like variable names that could map to OHMM's 42 StatKeys."""
    formula_strings = extract_strings_from_pyc(CORPUS_ROOT / "game_common/data/formula_data/damage_formula.pyc")
    const_strings = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/const/formula_const.pyc")
    adapter_strings = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/component_server/CompFormulaAdapter.pyc")
    attr_strings = extract_strings_from_pyc(CORPUS_ROOT / "dcs_extend/const/attr_const.pyc")

    # Collect all stat-like names
    stat_pattern = re.compile(r'^(final_|base_|get_|BB\.)?[a-z][a-z0-9_]*(rate|dam|dmg|bonus|add|reduction|resist|speed|hp|shield|attack|crit|weak|element|status|keyword|melee|buff|debuff)[a-z0-9_]*$', re.IGNORECASE)

    all_candidates = set()
    for strings in [formula_strings, const_strings, adapter_strings, attr_strings]:
        for s in strings:
            if stat_pattern.match(s):
                all_candidates.add(s)

    # Categorize
    categories = {
        "offensive_damage": sorted(s for s in all_candidates if 'dam' in s.lower() and 'reduction' not in s.lower()),
        "crit_weakspot": sorted(s for s in all_candidates if 'crit' in s.lower() or 'weak' in s.lower()),
        "attack_rate": sorted(s for s in all_candidates if 'attack' in s.lower() or 'rate' in s.lower()),
        "defensive": sorted(s for s in all_candidates if 'reduction' in s.lower() or 'resist' in s.lower() or 'shield' in s.lower()),
        "keyword_proc": sorted(s for s in all_candidates if 'keyword' in s.lower()),
        "status_element": sorted(s for s in all_candidates if 'status' in s.lower() or 'element' in s.lower()),
        "melee": sorted(s for s in all_candidates if 'melee' in s.lower()),
        "debuff": sorted(s for s in all_candidates if 'debuff' in s.lower()),
    }

    return {
        "all_candidates": sorted(all_candidates),
        "categorized": categories,
        "total": len(all_candidates),
        "sources": [
            "game_common/data/formula_data/damage_formula.pyc",
            "dcs_extend/const/formula_const.pyc",
            "dcs_extend/component_server/CompFormulaAdapter.pyc",
            "dcs_extend/const/attr_const.pyc",
        ],
    }


# ── Main ──

def main() -> int:
    print("Structuring mining output for OHMM registries...")
    print(f"  Corpus: {CORPUS_ROOT}")
    print(f"  Output: {OUTPUT_DIR}")
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("1. Keyword Enum Map")
    write_output("keyword_enum_map.json", build_keyword_enum_map())

    print("2. Damage Formula Variables")
    write_output("damage_formula_variables.json", build_damage_formula_variables())

    print("3. Deviation System")
    write_output("deviation_system.json", build_deviation_system())

    print("4. Calibration Data")
    write_output("calibration_data.json", build_calibration_data())

    print("5. Weapon Constants")
    write_output("weapon_constants.json", build_weapon_constants())

    print("6. Mod System")
    write_output("mod_system.json", build_mod_system())

    print("7. Buff Keyword Map")
    write_output("buff_keyword_map.json", build_buff_keyword_map())

    print("8. ID-to-Name Map")
    write_output("id_to_name_map.json", build_id_to_name_map())

    print("9. Stat Key Candidates")
    write_output("stat_key_candidates.json", build_stat_key_candidates())

    print("\nDone. All structured data written to:")
    print(f"  {OUTPUT_DIR}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
