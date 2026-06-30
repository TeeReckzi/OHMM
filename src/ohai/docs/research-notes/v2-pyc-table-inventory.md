# V2 PYC Table Inventory — Cross-Table Validation Candidates

> **CANDIDATE ANALYSIS — NOT CANONICAL — REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Objective

Systematically scan all `*_data.pyc` files in
`recovered_mobile_pyc_OFF/game_common/data/` to identify
new candidate tables for formula validation. Tables are
scored on:

- **Anchor values** (5.0 each): occurrences of known constants
  like 0.4 (0x66666666), 0.2 (0x33333333), 0.5/0.6/0.8
- **Semantic strings** (2.0 each): schema field names matching
  game concepts (modifier, dmg, crit, element, etc.)
- **Markers** (0.5 each): structured data layout signals
- **Clean u32 values** (0.3 each): additional fixed-point hits
- **Clean f64 values** (0.1 each): additional f64 decode hits
- **Size bonus**: smaller tables score higher (easier to validate)

**Total tables scanned**: 1644
**Interesting tables** (anchors or semantic or markers or 5+ clean u32): 1082
**Already processed in earlier sprints**: 7

## Top 30 by Validation Score

| Rank | Table | Score | Anchors | Semantic | Markers | Size | Processed? |
|------|-------|-------|---------|----------|---------|------|------------|
| 1 | cam_viewkick_data | 254099.1 | 46862 | 21 | 75 | 629828 |  |
| 2 | combat_property_inner_data | 190902.7 | 35319 | 7 | 55 | 2477616 |  |
| 3 | season_drop_rule_data | 96438.3 | 17746 | 2 | 4 | 478608 |  |
| 4 | item_data | 71677.9 | 10570 | 105 | 119 | 9318800 |  |
| 5 | build_part_mode_data | 71569.1 | 13377 | 2 | 5 | 627472 |  |
| 6 | combat_prototype_data | 51579.6 | 9388 | 2 | 2 | 338408 |  |
| 7 | gun_base_params_data | 51446.2 | 9439 | 2 | 43 | 158060 |  |
| 8 | equip_data | 35863.5 | 6565 | 2 | 2 | 573460 |  |
| 9 | equip_blueprint_attr_data | 18787.2 | 3422 | 1 | 2 | 70484 |  |
| 10 | gun_blueprint_attr_data | 18189.2 | 3348 | 1 | 2 | 76964 |  |
| 11 | build_part_geo_data | 16528.2 | 2945 | 0 | 2 | 92744 |  |
| 12 | static_weather_info_data | 16259.0 | 2933 | 0 | 0 | 200896 |  |
| 13 | gun_accessory_muzzle_params_data | 16182.7 | 2964 | 1 | 3 | 118784 |  |
| 14 | gun_accessory_sights_params_data | 15016.3 | 2789 | 1 | 5 | 124332 |  |
| 15 | airdrop_route_data | 13208.8 | 2436 | 1 | 0 | 82852 |  |
| 16 | equip_combine_data | 12054.8 | 2082 | 8 | 13 | 965468 |  |
| 17 | interact_res_data | 11857.6 | 2168 | 1 | 0 | 108376 |  |
| 18 | season_review_item_data | 11394.1 | 7 | 5250 | 6 | 633744 |  |
| 19 | gun_accessory_under_barrel_params_data | 10598.5 | 1967 | 1 | 5 | 86028 |  |
| 20 | equip_origin_data | 9543.4 | 1732 | 2 | 42 | 161816 |  |
| 21 | build_part_data | 9415.5 | 1494 | 1 | 92 | 1025432 |  |
| 22 | collect_res_tool_reflect_data | 8265.5 | 1541 | 1 | 1 | 76776 |  |
| 23 | bullet_scatter_data | 7987.2 | 1478 | 1 | 1 | 15484 |  |
| 24 | area_mask_define_data | 7818.6 | 1447 | 1 | 43 | 54916 |  |
| 25 | dungeon_config_data | 7205.3 | 1251 | 1 | 0 | 117932 |  |
| 26 | item_forge_dis_data | 5759.0 | 1023 | 1 | 77 | 205104 |  |
| 27 | fashion_model_data | 5473.2 | 958 | 7 | 11 | 567640 |  |
| 28 | char_property_data | 5188.1 | 927 | 2 | 2 | 125556 |  |
| 29 | lottery_new_pool_data | 4852.8 | 905 | 1 | 5 | 64824 |  |
| 30 | forge_data | 4593.7 | 413 | 9 | 20 | 1532840 |  |

## Unprocessed Formula-Family Candidates

Filtered to tables with formula-related names (pvp_, modifier,
adjust, param, global, tier_base) and not yet processed.

| Rank | Table | Score | Anchors | Semantic | Size |
|------|-------|-------|---------|----------|------|
| 1 | gun_base_params_data | 51446.2 | 9439 | 2 | 158060 |
| 2 | gun_accessory_muzzle_params_data | 16182.7 | 2964 | 1 | 118784 |
| 3 | gun_accessory_sights_params_data | 15016.3 | 2789 | 1 | 124332 |
| 4 | gun_accessory_under_barrel_params_data | 10598.5 | 1967 | 1 | 86028 |
| 5 | gun_skin_params_data | 1863.4 | 315 | 1 | 38296 |
| 6 | season_monster_difficulty_adjustment_data | 1423.0 | 256 | 2 | 11432 |
| 7 | glide_fashion_param | 738.3 | 136 | 2 | 8056 |
| 8 | global_params_data | 676.8 | 121 | 2 | 62300 |
| 9 | ai_shoot_random_hit_params_data | 576.7 | 106 | 2 | 1740 |
| 10 | post_effect_param_data | 562.1 | 103 | 2 | 4368 |
| 11 | lottery_new_param_data | 477.8 | 84 | 2 | 5344 |
| 12 | deviation_monster_capture_params_data | 390.2 | 71 | 2 | 3548 |
| 13 | vehicle_contact_params | 371.6 | 68 | 2 | 1184 |
| 14 | bullet_base_params_data | 369.8 | 28 | 1 | 42136 |
| 15 | combat_unit_property_auto_adjust_data | 344.9 | 63 | 2 | 1080 |
| 16 | build_storage_param_data | 338.9 | 60 | 2 | 11032 |
| 17 | stardust_skill_sys_param_data | 315.2 | 56 | 2 | 2952 |
| 18 | hit_ring_params | 265.0 | 48 | 2 | 1696 |
| 19 | deviation_global_data | 254.1 | 46 | 2 | 7848 |
| 20 | medium_stronghold_battlefield_parameter_data | 162.7 | 27 | 3 | 12272 |

## Tables with Anchor Value Hits

Tables containing the 0.4, 0.2, 0.5, 0.6, 0.8, 1.0, etc.
constants in any u32-LE or f32 form.

| Rank | Table | Total Anchors | Anchor Breakdown |
|------|-------|---------------|------------------|
| — | cam_viewkick_data | 46862 | pvp_tier_modifier_0.2_0x33333333=25305, f32_1.0_0x3f800000=7340, f32_0.6_0x99999999=7794, f32_0.8_0xcccccccd=760, f32_1.5_0x3fc00000=512, pvp_star_modifier_0.4_0x66666666=1130, f32_0.5_0x3f000000=3013, f32_0.25_0x3e800000=121, f32_0.75_0x3f400000=774, f32_2.0_0x40000000=98, f32_3.0_0x40400000=15 |
| — | combat_property_inner_data | 35319 | f32_2.0_0x40000000=135, f32_0.6_0x99999999=8384, f32_0.5_0x3f000000=9540, pvp_star_modifier_0.4_0x66666666=16296, f32_1.0_0x3f800000=171, f32_3.0_0x40400000=104, f32_0.8_0xcccccccd=130, f32_0.25_0x3e800000=11, pvp_tier_modifier_0.2_0x33333333=548 |
| — | season_drop_rule_data | 17746 | f32_1.0_0x3f800000=16427, f32_0.6_0x99999999=12, f32_0.8_0xcccccccd=6, f32_1.5_0x3fc00000=964, f32_2.0_0x40000000=172, f32_3.0_0x40400000=24, pvp_tier_modifier_0.2_0x33333333=141 |
| — | item_data | 10570 | f32_1.0_0x3f800000=1091, f32_0.5_0x3f000000=441, f32_0.6_0x99999999=2098, f32_1.5_0x3fc00000=1337, pvp_tier_modifier_0.2_0x33333333=5056, pvp_star_modifier_0.4_0x66666666=78, f32_2.0_0x40000000=448, f32_3.0_0x40400000=13, f32_0.8_0xcccccccd=7, f32_0.25_0x3e800000=1 |
| — | build_part_mode_data | 13377 | f32_0.6_0x99999999=6530, f32_1.5_0x3fc00000=84, pvp_star_modifier_0.4_0x66666666=6468, f32_0.75_0x3f400000=4, pvp_tier_modifier_0.2_0x33333333=204, f32_0.5_0x3f000000=17, f32_0.25_0x3e800000=11, f32_0.8_0xcccccccd=32, f32_1.0_0x3f800000=15, f32_2.0_0x40000000=9, f32_3.0_0x40400000=3 |
| — | combat_prototype_data | 9388 | f32_1.0_0x3f800000=1450, f32_0.8_0xcccccccd=60, f32_1.5_0x3fc00000=243, pvp_tier_modifier_0.2_0x33333333=1455, f32_3.0_0x40400000=1374, f32_0.25_0x3e800000=995, f32_2.0_0x40000000=1917, f32_0.6_0x99999999=1222, f32_0.5_0x3f000000=460, pvp_star_modifier_0.4_0x66666666=207, f32_0.75_0x3f400000=5 |
| — | gun_base_params_data | 9439 | pvp_star_modifier_0.4_0x66666666=1322, f32_0.25_0x3e800000=48, f32_1.0_0x3f800000=1731, f32_1.5_0x3fc00000=328, pvp_tier_modifier_0.2_0x33333333=2241, f32_0.6_0x99999999=2738, f32_0.8_0xcccccccd=292, f32_2.0_0x40000000=312, f32_0.75_0x3f400000=315, f32_3.0_0x40400000=19, f32_0.5_0x3f000000=93 |
| — | equip_data | 6565 | f32_1.0_0x3f800000=6225, pvp_star_modifier_0.4_0x66666666=87, f32_0.6_0x99999999=136, f32_2.0_0x40000000=45, f32_0.8_0xcccccccd=43, pvp_tier_modifier_0.2_0x33333333=24, f32_0.25_0x3e800000=1, f32_0.5_0x3f000000=3, f32_1.5_0x3fc00000=1 |
| — | equip_blueprint_attr_data | 3422 | f32_0.5_0x3f000000=1, f32_1.0_0x3f800000=1819, pvp_star_modifier_0.4_0x66666666=534, f32_0.8_0xcccccccd=178, f32_0.6_0x99999999=356, pvp_tier_modifier_0.2_0x33333333=534 |
| — | gun_blueprint_attr_data | 3348 | pvp_tier_modifier_0.2_0x33333333=933, f32_0.6_0x99999999=954, f32_1.0_0x3f800000=748, f32_0.25_0x3e800000=204, pvp_star_modifier_0.4_0x66666666=330, f32_0.5_0x3f000000=46, f32_0.8_0xcccccccd=93, f32_2.0_0x40000000=20, f32_0.75_0x3f400000=20 |
| — | build_part_geo_data | 2945 | f32_1.0_0x3f800000=768, f32_0.8_0xcccccccd=192, pvp_star_modifier_0.4_0x66666666=376, pvp_tier_modifier_0.2_0x33333333=705, f32_0.6_0x99999999=681, f32_0.5_0x3f000000=67, f32_1.5_0x3fc00000=76, f32_2.0_0x40000000=51, f32_3.0_0x40400000=27, f32_0.75_0x3f400000=1, f32_0.25_0x3e800000=1 |
| — | static_weather_info_data | 2933 | f32_0.6_0x99999999=798, f32_3.0_0x40400000=5, f32_0.8_0xcccccccd=180, pvp_tier_modifier_0.2_0x33333333=561, pvp_star_modifier_0.4_0x66666666=624, f32_1.0_0x3f800000=370, f32_0.75_0x3f400000=49, f32_0.5_0x3f000000=40, f32_2.0_0x40000000=268, f32_0.25_0x3e800000=38 |
| — | gun_accessory_muzzle_params_data | 2964 | f32_0.6_0x99999999=621, f32_1.0_0x3f800000=919, pvp_tier_modifier_0.2_0x33333333=666, f32_0.8_0xcccccccd=299, pvp_star_modifier_0.4_0x66666666=411, f32_1.5_0x3fc00000=42, f32_2.0_0x40000000=6 |
| — | gun_accessory_sights_params_data | 2789 | f32_1.0_0x3f800000=1117, pvp_tier_modifier_0.2_0x33333333=306, f32_0.8_0xcccccccd=94, pvp_star_modifier_0.4_0x66666666=303, f32_0.6_0x99999999=922, f32_2.0_0x40000000=34, f32_0.75_0x3f400000=7, f32_3.0_0x40400000=3, f32_1.5_0x3fc00000=3 |
| — | airdrop_route_data | 2436 | f32_1.5_0x3fc00000=609, pvp_tier_modifier_0.2_0x33333333=1827 |
| — | equip_combine_data | 2082 | pvp_tier_modifier_0.2_0x33333333=363, pvp_star_modifier_0.4_0x66666666=510, f32_1.0_0x3f800000=392, f32_0.6_0x99999999=474, f32_0.5_0x3f000000=106, f32_2.0_0x40000000=218, f32_0.8_0xcccccccd=19 |
| — | interact_res_data | 2168 | pvp_star_modifier_0.4_0x66666666=135, f32_2.0_0x40000000=616, f32_0.6_0x99999999=656, pvp_tier_modifier_0.2_0x33333333=210, f32_3.0_0x40400000=23, f32_0.8_0xcccccccd=92, f32_1.0_0x3f800000=45, f32_1.5_0x3fc00000=384, f32_0.5_0x3f000000=5, f32_0.75_0x3f400000=2 |
| — | season_review_item_data | 7 | f32_0.6_0x99999999=4, pvp_tier_modifier_0.2_0x33333333=3 |
| — | gun_accessory_under_barrel_params_data | 1967 | f32_1.0_0x3f800000=844, pvp_tier_modifier_0.2_0x33333333=504, f32_0.6_0x99999999=330, f32_0.8_0xcccccccd=81, pvp_star_modifier_0.4_0x66666666=198, f32_0.75_0x3f400000=10 |
| — | equip_origin_data | 1732 | f32_0.8_0xcccccccd=213, f32_0.6_0x99999999=516, f32_1.0_0x3f800000=630, f32_2.0_0x40000000=114, f32_3.0_0x40400000=79, pvp_tier_modifier_0.2_0x33333333=123, f32_1.5_0x3fc00000=37, f32_0.5_0x3f000000=20 |
| — | build_part_data | 1494 | f32_0.6_0x99999999=202, f32_0.5_0x3f000000=1109, f32_1.0_0x3f800000=22, pvp_star_modifier_0.4_0x66666666=33, f32_0.8_0xcccccccd=21, pvp_tier_modifier_0.2_0x33333333=96, f32_2.0_0x40000000=3, f32_0.25_0x3e800000=3, f32_0.75_0x3f400000=4, f32_1.5_0x3fc00000=1 |
| — | collect_res_tool_reflect_data | 1541 | f32_0.6_0x99999999=882, f32_1.0_0x3f800000=106, pvp_star_modifier_0.4_0x66666666=198, pvp_tier_modifier_0.2_0x33333333=204, f32_0.5_0x3f000000=115, f32_0.8_0xcccccccd=27, f32_2.0_0x40000000=4, f32_3.0_0x40400000=5 |
| — | bullet_scatter_data | 1478 | f32_2.0_0x40000000=19, pvp_tier_modifier_0.2_0x33333333=909, f32_0.6_0x99999999=287, f32_1.0_0x3f800000=68, f32_0.5_0x3f000000=30, pvp_star_modifier_0.4_0x66666666=120, f32_1.5_0x3fc00000=6, f32_0.8_0xcccccccd=36, f32_0.25_0x3e800000=2, f32_3.0_0x40400000=1 |
| — | area_mask_define_data | 1447 | f32_0.8_0xcccccccd=363, pvp_star_modifier_0.4_0x66666666=1081, pvp_tier_modifier_0.2_0x33333333=3 |
| — | dungeon_config_data | 1251 | f32_1.0_0x3f800000=1212, f32_0.6_0x99999999=36, f32_2.0_0x40000000=3 |
| — | item_forge_dis_data | 1023 | f32_1.0_0x3f800000=322, f32_2.0_0x40000000=274, f32_3.0_0x40400000=204, f32_0.5_0x3f000000=29, f32_1.5_0x3fc00000=14, f32_0.6_0x99999999=77, f32_0.75_0x3f400000=11, f32_0.25_0x3e800000=11, pvp_tier_modifier_0.2_0x33333333=78, pvp_star_modifier_0.4_0x66666666=3 |
| — | fashion_model_data | 958 | pvp_star_modifier_0.4_0x66666666=66, f32_0.6_0x99999999=248, f32_0.5_0x3f000000=93, f32_1.0_0x3f800000=334, pvp_tier_modifier_0.2_0x33333333=198, f32_0.8_0xcccccccd=19 |
| — | char_property_data | 927 | f32_2.0_0x40000000=58, f32_3.0_0x40400000=41, f32_1.0_0x3f800000=379, f32_0.8_0xcccccccd=108, pvp_tier_modifier_0.2_0x33333333=102, f32_0.6_0x99999999=139, f32_1.5_0x3fc00000=2, pvp_star_modifier_0.4_0x66666666=92, f32_0.5_0x3f000000=5, f32_0.25_0x3e800000=1 |
| — | lottery_new_pool_data | 905 | pvp_tier_modifier_0.2_0x33333333=231, f32_0.6_0x99999999=512, pvp_star_modifier_0.4_0x66666666=159, f32_1.0_0x3f800000=2, f32_0.8_0xcccccccd=1 |
| — | forge_data | 413 | f32_1.0_0x3f800000=219, f32_3.0_0x40400000=152, f32_2.0_0x40000000=36, f32_0.5_0x3f000000=6 |
| — | script_register_open_server_rule_data | 713 | f32_0.5_0x3f000000=466, f32_1.0_0x3f800000=122, f32_2.0_0x40000000=85, f32_3.0_0x40400000=24, f32_0.6_0x99999999=16 |
| — | deviation_fusion_furniture_data | 710 | f32_0.6_0x99999999=318, pvp_tier_modifier_0.2_0x33333333=204, f32_1.0_0x3f800000=12, f32_0.5_0x3f000000=17, f32_0.25_0x3e800000=10, f32_0.8_0xcccccccd=30, pvp_star_modifier_0.4_0x66666666=102, f32_3.0_0x40400000=4, f32_2.0_0x40000000=9, f32_1.5_0x3fc00000=4 |
| — | live_stock_tip_camera_data | 691 | f32_1.5_0x3fc00000=17, pvp_star_modifier_0.4_0x66666666=81, f32_0.6_0x99999999=388, pvp_tier_modifier_0.2_0x33333333=117, f32_0.8_0xcccccccd=21, f32_1.0_0x3f800000=17, f32_3.0_0x40400000=21, f32_0.5_0x3f000000=12, f32_2.0_0x40000000=13, f32_0.25_0x3e800000=1, f32_0.75_0x3f400000=3 |
| — | deviation_base_data | 649 | f32_1.0_0x3f800000=44, f32_0.6_0x99999999=432, pvp_star_modifier_0.4_0x66666666=21, pvp_tier_modifier_0.2_0x33333333=126, f32_0.25_0x3e800000=10, f32_0.8_0xcccccccd=14, f32_1.5_0x3fc00000=1, f32_0.5_0x3f000000=1 |
| — | vehicle_chassis_config | 638 | f32_0.6_0x99999999=204, f32_0.8_0xcccccccd=18, pvp_star_modifier_0.4_0x66666666=123, f32_0.5_0x3f000000=10, pvp_tier_modifier_0.2_0x33333333=153, f32_2.0_0x40000000=17, f32_1.0_0x3f800000=109, f32_0.25_0x3e800000=1, f32_3.0_0x40400000=1, f32_0.75_0x3f400000=2 |
| — | containment_preference_config_data | 596 | f32_0.5_0x3f000000=1, f32_0.6_0x99999999=544, pvp_tier_modifier_0.2_0x33333333=51 |
| — | plant_graft_ret_data | 589 | f32_1.0_0x3f800000=589 |
| — | diy_forge_choice_material_data | 46 | f32_0.6_0x99999999=16, pvp_tier_modifier_0.2_0x33333333=15, f32_0.8_0xcccccccd=3, pvp_star_modifier_0.4_0x66666666=9, f32_0.25_0x3e800000=2, f32_0.5_0x3f000000=1 |
| — | text_common_config_data | 27 | f32_2.0_0x40000000=1, pvp_star_modifier_0.4_0x66666666=26 |
| — | unit_die_drop_data | 464 | f32_0.5_0x3f000000=63, pvp_star_modifier_0.4_0x66666666=327, f32_2.0_0x40000000=6, pvp_tier_modifier_0.2_0x33333333=39, f32_1.5_0x3fc00000=4, f32_0.6_0x99999999=4, f32_1.0_0x3f800000=7, f32_3.0_0x40400000=13, f32_0.8_0xcccccccd=1 |
| — | buff_level_data | 98 | f32_2.0_0x40000000=3, f32_1.0_0x3f800000=4, f32_3.0_0x40400000=8, f32_0.5_0x3f000000=9, f32_0.6_0x99999999=10, f32_0.8_0xcccccccd=2, pvp_tier_modifier_0.2_0x33333333=60, f32_0.25_0x3e800000=2 |
| — | equip_posture_data | 452 | f32_2.0_0x40000000=1, f32_1.0_0x3f800000=368, f32_0.6_0x99999999=66, pvp_tier_modifier_0.2_0x33333333=12, f32_0.8_0xcccccccd=5 |
| — | deviation_quality_data | 371 | f32_2.0_0x40000000=102, f32_3.0_0x40400000=90, f32_1.0_0x3f800000=104, pvp_tier_modifier_0.2_0x33333333=27, f32_0.6_0x99999999=38, f32_0.25_0x3e800000=2, f32_0.5_0x3f000000=2, pvp_star_modifier_0.4_0x66666666=6 |
| — | vehicle_repair_data | 432 | pvp_tier_modifier_0.2_0x33333333=432 |
| — | private_server_deviation_entry_group_data | 1 | f32_3.0_0x40400000=1 |
| — | season_review_design_data | 303 | f32_1.0_0x3f800000=303 |
| — | character_makeup_data | 347 | f32_1.0_0x3f800000=347 |
| — | trans_orig_data | 346 | f32_0.6_0x99999999=252, f32_3.0_0x40400000=13, pvp_tier_modifier_0.2_0x33333333=69, f32_2.0_0x40000000=12 |
| — | build_plant_data | 339 | f32_0.25_0x3e800000=26, f32_0.6_0x99999999=262, f32_0.5_0x3f000000=9, pvp_tier_modifier_0.2_0x33333333=36, f32_0.8_0xcccccccd=6 |
| — | gun_skin_params_data | 315 | f32_1.0_0x3f800000=305, f32_0.8_0xcccccccd=2, pvp_tier_modifier_0.2_0x33333333=6, f32_0.6_0x99999999=2 |

## Blockers

1. **No field naming attempted** (per scope). All relationships
   are inferred from string presence, value presence, and
   marker counts.
2. **No leaf mapping attempted** (per scope). Anchor hits do not
   establish which value maps to which field.
3. **No semantic mapping of strings**. We only check substring
   matches against a list of game keywords.
4. **String region detection uses 4+ printable chars**; some
   schemas may have shorter field names missed.
5. **Trailer exclusion is fixed at last 30 bytes**; tables with
   longer bytecode may have false trailer boundaries.

## Safe-to-Commit Verdict

**Status**: All deliverables are candidate-only inventory.
**No production code was modified.**
**No field naming or canonical claims are made.**
