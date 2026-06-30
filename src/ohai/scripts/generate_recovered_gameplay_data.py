"""Generate compact verified gameplay data from decoded Once Human bindicts."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TABLES = {
    "attributes": "06294_d88af3df.pyc",
    "weapon_equipment": "02548_58575b3c.pyc",
    "gun_preset": "02913_64d8a7df.pyc",
    "gun_runtime": "05509_bc5aafa8.pyc",
    "bullet_runtime": "02057_475e3761.pyc",
    "buff_definitions": "03495_7798b54f.pyc",
    "behavior_buff_links": "06570_e3071415.pyc",
    "weapon_blueprint_calibration": "02106_493f74ec.pyc",
    "calibration_global_config": "04726_a1d887cb.pyc",
}


def find_table(scan: dict[str, Any], basename: str) -> dict[str, Any]:
    for record in scan.get("files", []):
        if basename in record.get("path", ""):
            data = record.get("parsed", {}).get("data")
            if isinstance(data, dict):
                return data
    raise ValueError(f"Could not find {basename}")


def number_or_none(value: Any) -> int | float | None:
    return value if isinstance(value, (int, float)) else None


def gun_preset_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict):
            continue
        attack = number_or_none(value.get("gun_preset_attack"))
        material = value.get("weapon_material_type")
        if attack is None or (attack == 0 and material != "gun"):
            continue
        attrs = []
        names = value.get("base_attr_name_list") or []
        vals = value.get("base_attr_val_list") or []
        if isinstance(names, list) and isinstance(vals, list):
            attrs = [{"attrId": str(name), "value": vals[i]} for i, name in enumerate(names) if i < len(vals)]
        rows.append({
            "equipOriginId": int(key),
            "gunPresetAttack": attack,
            "baseAttrs": attrs,
            "gunElementAffix": value.get("gun_element_affix") or "",
            "gunElementAffixValue": value.get("gun_element_affix_value") or 0,
            "jumpWordSubNo": value.get("jump_word_sub_no") or 0,
            "weaponMaterialType": material or "",
            "source": TABLES["gun_preset"],
        })
    return rows


def weapon_equipment_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict):
            continue
        gun_no = value.get("gun_no") or 0
        if not gun_no:
            continue
        rows.append({
            "equipOriginId": int(key),
            "gunNo": gun_no,
            "blueprintNo": value.get("blueprint_no") or 0,
            "equipType": value.get("equip_type") or 0,
            "equipQuality": value.get("equip_quality") or 0,
            "equipLevel": value.get("equip_lv") or 0,
            "artLevel": value.get("art_lv") or 0,
            "armModelPath": value.get("arm_model_path") or "",
            "animGraph": value.get("anim_graph") or "",
            "skinSeqNo": value.get("skin_seq_no") or "",
            "source": TABLES["weapon_equipment"],
        })
    return rows


def gun_runtime_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict):
            continue
        rows.append({
            "gunNo": int(key),
            "accessorySeqNo": value.get("accessory_seq_no") or 0,
            "gunSkillNo": value.get("gun_skill_no") or "",
            "bulletNo": value.get("bullet_no") or 0,
            "bulletBaseNo": value.get("bullet_base_no") or 0,
            "bulletCost": value.get("bullet_cost") or 0,
            "bulletBoxCost": value.get("bullet_box_cost") or 0,
            "defaultShootMode": value.get("default_shoot_mode") or 0,
            "autoTimeInterval": value.get("auto_time_interval") or 0,
            "burstBulletInterval": value.get("burst_bullet_interval") or 0,
            "burstBulletNum": value.get("burst_bullet_num") or 0,
            "reloadAddBulletTime": value.get("reload_add_bullet_time") or 0,
            "reloadLoopTime": value.get("reload_loop_time") or 0,
            "reloadUiRate": value.get("reload_ui_rate") or 0,
            "bulletSpeed": value.get("bullet_speed") or 0,
            "bulletFlyMaxDistance": value.get("bullet_fly_max_dis") or 0,
            "distanceDamageValue1": value.get("dis_damage_value1") or [],
            "distanceDamageValue2": value.get("dis_damage_value2") or [],
            "icon": value.get("gun_main_ui_image") or "",
            "source": TABLES["gun_runtime"],
        })
    return rows


def bullet_runtime_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict):
            continue
        rows.append({
            "bulletBaseNo": int(key),
            "bulletSpeed": value.get("bullet_speed") or 0,
            "bulletSpeedMin": value.get("bullet_speed_min") or 0,
            "bulletSpeedAttenuationDistance": value.get("bullet_speed_attenuation_dis") or 0,
            "bulletFlyMaxDistance": value.get("bullet_fly_max_dis") or 0,
            "bulletGravity": value.get("bullet_gravity") or 0,
            "bulletGravity2": value.get("bullet_gravity2") or 0,
            "bulletScatterNo": value.get("bullet_scatter_no") or "",
            "bulletPatternNo": value.get("bullet_pattern_no") or "",
            "ringlikeBulletNo": value.get("ringlike_bullet_no") or "",
            "viewkickNo": value.get("viewkick_no") or "",
            "source": TABLES["bullet_runtime"],
        })
    return rows


def buff_definition_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict):
            continue
        params = value.get("buff_params")
        if not isinstance(params, dict):
            continue
        rows.append({
            "key": key,
            "buffId": params.get("buff_id") or 0,
            "buffLevel": params.get("buff_level") or 0,
            "buffFlag": params.get("buff_flag") or 0,
            "buffMaxStack": params.get("buff_max_stack") or 0,
            "buffTag": params.get("buff_tag") or [],
            "buffSubTags": params.get("buff_sub_tags") or [],
            "skillTag": params.get("skill_tag") or [],
            "lifeTime": params.get("life_time") or 0,
            "degradeStack": params.get("degrade_stack") or 0,
            "degradeTime": params.get("degrade_time") or 0,
            "refreshRule": params.get("refresh_rule") or 0,
            "refreshBuffStack": params.get("refresh_buff_stack") or 0,
            "multiBuffLimit": params.get("multi_buff_limit") or 0,
            "uniqueTag": params.get("unique_tag") or "",
            "effectUnitType": params.get("effect_unit_type") or [],
            "logicTreeData": value.get("logic_tree_data") or [],
            "source": TABLES["buff_definitions"],
        })
    return rows


def behavior_buff_link_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if isinstance(value, dict) and isinstance(value.get("buff"), list):
            rows.append({"behavior": key, "buffs": value["buff"], "source": TABLES["behavior_buff_links"]})
    return rows


def attr_pair_rows(value: dict[str, Any]) -> list[dict[str, Any]]:
    attrs = []
    for index in range(1, 5):
        name = value.get(f"base_attr_name{index}") or ""
        if not name:
            continue
        attrs.append({
            "attrId": str(name),
            "value": value.get(f"base_attr_val{index}") or 0,
        })
    return attrs


def weapon_blueprint_calibration_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict):
            continue
        blueprint_no = value.get("blueprint_no")
        strength_lv = value.get("strength_lv")
        if not isinstance(blueprint_no, int) or not isinstance(strength_lv, int):
            continue
        rows.append({
            "id": f"{blueprint_no}:{strength_lv}",
            "blueprintNo": blueprint_no,
            "strengthLv": strength_lv,
            "perkSlotCalibrationMax": value.get("perk_slot_calibration_max") or 0,
            "presetAttackRatio": value.get("preset_attack_radio") or 0,
            "baseAttrs": attr_pair_rows(value),
            "fixedSkillCode": value.get("fixed_skill_code") or "",
            "fixedSkillLv": value.get("fixed_skill_lv") or 0,
            "needFragNum": value.get("need_frag_num") or 0,
            "needTokenNum": value.get("need_token_num") or 0,
            "upgradeCostCoins": value.get("upgrade_cost_coins") or 0,
            "unlockedItems": value.get("unlocked_items") or [],
            "unlockedPicPath": value.get("unlocked_pic_path") or "",
            "rawKey": key,
            "source": TABLES["weapon_blueprint_calibration"],
        })
    return sorted(rows, key=lambda row: (row["blueprintNo"], row["strengthLv"]))


def calibration_global_config_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for key, value in table.items():
        if not isinstance(value, dict) or "calibration" not in str(key).lower() and "calibrate" not in str(key).lower():
            continue
        rows.append({
            "key": str(key),
            "value": value.get("value"),
            "source": TABLES["calibration_global_config"],
        })
    return sorted(rows, key=lambda row: row["key"])


def emit_ts(catalog: dict[str, Any], source_scan: Path) -> str:
    body = json.dumps(catalog, ensure_ascii=False, indent=2)
    return "\n".join([
        "// Generated by scripts/generate_recovered_gameplay_data.py.",
        f"// Source scan: {source_scan}",
        "",
        "export interface OfficialRuntimeCatalog {",
        "  generatedFrom: string;",
        "  sourceTables: Record<string, string>;",
        "  weaponEquipments: readonly Record<string, unknown>[];",
        "  gunPresetStats: readonly Record<string, unknown>[];",
        "  gunRuntimeStats: readonly Record<string, unknown>[];",
        "  bulletRuntimeStats: readonly Record<string, unknown>[];",
        "  buffDefinitions: readonly Record<string, unknown>[];",
        "  behaviorBuffLinks: readonly Record<string, unknown>[];",
        "  weaponBlueprintCalibrations: readonly Record<string, unknown>[];",
        "  calibrationGlobalConfig: readonly Record<string, unknown>[];",
        "}",
        "",
        f"export const OFFICIAL_RUNTIME_CATALOG = {body} as const satisfies OfficialRuntimeCatalog;",
        "",
        "export const OFFICIAL_WEAPON_EQUIPMENT_BY_EQUIP_ID = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.weaponEquipments.map((row) => [row.equipOriginId, row]),",
        ");",
        "",
        "export const OFFICIAL_GUN_PRESET_BY_EQUIP_ID = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.gunPresetStats.map((row) => [row.equipOriginId, row]),",
        ");",
        "",
        "export const OFFICIAL_GUN_RUNTIME_BY_GUN_NO = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.gunRuntimeStats.map((row) => [row.gunNo, row]),",
        ");",
        "",
        "export const OFFICIAL_BULLET_RUNTIME_BY_BASE_NO = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.bulletRuntimeStats.map((row) => [row.bulletBaseNo, row]),",
        ");",
        "",
        "export const OFFICIAL_BUFF_BY_ID_LEVEL = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.buffDefinitions.map((row) => [`${row.buffId}:${row.buffLevel}`, row]),",
        ");",
        "",
        "export const OFFICIAL_WEAPON_BLUEPRINT_CALIBRATION_BY_ID = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.weaponBlueprintCalibrations.map((row) => [row.id, row]),",
        ");",
        "",
        "export const OFFICIAL_CALIBRATION_CONFIG_BY_KEY = new Map(",
        "  OFFICIAL_RUNTIME_CATALOG.calibrationGlobalConfig.map((row) => [row.key, row]),",
        ");",
        "",
    ])


def main() -> int:
    cli = argparse.ArgumentParser(description="Generate recovered official gameplay data from bindict scan output.")
    cli.add_argument("scan_json", help="Path to bindict_scan.json")
    cli.add_argument("-o", "--output", required=True, help="Output TypeScript file")
    cli.add_argument("--json-output", help="Optional JSON output")
    args = cli.parse_args()

    source = Path(args.scan_json).resolve()
    scan = json.loads(source.read_text(encoding="utf-8"))
    tables = {name: find_table(scan, filename) for name, filename in TABLES.items()}

    catalog = {
        "generatedFrom": str(source),
        "sourceTables": TABLES,
        "weaponEquipments": weapon_equipment_rows(tables["weapon_equipment"]),
        "gunPresetStats": gun_preset_rows(tables["gun_preset"]),
        "gunRuntimeStats": gun_runtime_rows(tables["gun_runtime"]),
        "bulletRuntimeStats": bullet_runtime_rows(tables["bullet_runtime"]),
        "buffDefinitions": buff_definition_rows(tables["buff_definitions"]),
        "behaviorBuffLinks": behavior_buff_link_rows(tables["behavior_buff_links"]),
        "weaponBlueprintCalibrations": weapon_blueprint_calibration_rows(tables["weapon_blueprint_calibration"]),
        "calibrationGlobalConfig": calibration_global_config_rows(tables["calibration_global_config"]),
    }

    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(emit_ts(catalog, source), encoding="utf-8")

    if args.json_output:
        json_output = Path(args.json_output).resolve()
        json_output.parent.mkdir(parents=True, exist_ok=True)
        json_output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({
        "weaponEquipments": len(catalog["weaponEquipments"]),
        "gunPresetStats": len(catalog["gunPresetStats"]),
        "gunRuntimeStats": len(catalog["gunRuntimeStats"]),
        "bulletRuntimeStats": len(catalog["bulletRuntimeStats"]),
        "buffDefinitions": len(catalog["buffDefinitions"]),
        "behaviorBuffLinks": len(catalog["behaviorBuffLinks"]),
        "weaponBlueprintCalibrations": len(catalog["weaponBlueprintCalibrations"]),
        "calibrationGlobalConfig": len(catalog["calibrationGlobalConfig"]),
        "output": str(output),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
