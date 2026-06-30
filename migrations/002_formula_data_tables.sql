-- Migration 002: Formula Data Tables
-- Adds Supabase-backed storage for configurable formula data.
-- This allows game patches to update leaf defaults, tag table entries,
-- and stat bridge mappings via Supabase without app redeploys.

-- ── Table: formula_leaf_defaults ──────────────────────────────────────────────
-- Stores default numeric values for formula leaves.
-- Overrides the hardcoded defaults in officialFormulaMetadata.ts.
-- Rows are fetched on app startup by supabaseFormulaService.ts.

CREATE TABLE IF NOT EXISTS formula_leaf_defaults (
  id SERIAL PRIMARY KEY,
  leaf_name TEXT NOT NULL UNIQUE,
  default_value DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL DEFAULT 'extra',
  confidence TEXT NOT NULL DEFAULT 'medium',
  evidence TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE formula_leaf_defaults IS
  'Configurable default values for official formula leaves. Supersedes hardcoded defaults in officialFormulaMetadata.ts.';

-- ── Table: formula_tag_table_entries ──────────────────────────────────────────
-- Stores tag → suffix mappings for dynamic leaf resolvers.
-- One row per (tag_table_type, tag_value) pair.
-- tag_table_type: attack_type, element_type, keyword_type, gun_type, species_type, debuff_type, armor_type, melee_type
-- tag_value: the input tag (numeric or string)
-- suffix: the resolved attribute name suffix
-- value: optional numeric value (V2+ record payload, null until recovered)

CREATE TABLE IF NOT EXISTS formula_tag_table_entries (
  id SERIAL PRIMARY KEY,
  tag_table_type TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  suffix TEXT NOT NULL,
  value DOUBLE PRECISION,
  confidence TEXT NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_table_type, tag_value)
);

CREATE INDEX IF NOT EXISTS idx_formula_tag_table_entries_type
  ON formula_tag_table_entries (tag_table_type);

COMMENT ON TABLE formula_tag_table_entries IS
  'Tag → suffix mappings for dynamic leaf resolvers. Overrides hardcoded tables in officialFormulaTagTables.ts.';

-- ── Table: formula_stat_bridge ────────────────────────────────────────────────
-- Maps resolved attribute names (leaf_name + suffix) to OHAI stat keys.
-- Used by resolveBridgeInjections() to extract player stat values.
-- Each row represents one bridge mapping, e.g.:
--   leaf_name='keyword_proc_dam_add_rate', suffix='scorch' → stat_key='burnDMGBonus'

CREATE TABLE IF NOT EXISTS formula_stat_bridge (
  id SERIAL PRIMARY KEY,
  leaf_name TEXT NOT NULL,
  suffix TEXT NOT NULL,
  stat_key TEXT NOT NULL,
  tag_table_type TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'high',
  evidence TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leaf_name, suffix)
);

CREATE INDEX IF NOT EXISTS idx_formula_stat_bridge_leaf
  ON formula_stat_bridge (leaf_name);

COMMENT ON TABLE formula_stat_bridge IS
  'Maps resolved attribute names to OHAI stat keys. Overrides hardcoded entries in officialFormulaStatBridge.ts.';

-- ── Seed data: formula_leaf_defaults ──────────────────────────────────────────
-- Mirrors getDefaultFormulaLeafValues() in officialFormulaMetadata.ts

INSERT INTO formula_leaf_defaults (leaf_name, default_value, category, confidence, evidence)
VALUES
  ('skill_rate', 1, 'skill', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL']),
  ('dis_dam_rate', 1, 'skill', 'medium', ARRAY['LEAF_NODE_DEFAULT_VAL']),
  ('cure_add_rate', 1, 'skill', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL']),
  ('use_final_ignore_dam_rate', 1, 'extra', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL', 'damage_formula final_attack_ignore_dam_rate']),
  ('use_final_dam_add_rate', 1, 'extra', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL', 'damage_formula final_attack_additional_rate']),
  ('pvp_adjust_factor', 1, 'extra', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL', 'target resolver get_pvp_adjust_factor']),
  ('special_regulate_factor', 1, 'extra', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL', 'damage_formula final_special_regulate_factor']),
  ('attack_type_crit_enable', 1, 'attacker', 'high', ARRAY['LEAF_NODE_DEFAULT_VAL', 'ATTACKER_LEAF_NODE_RELATED_ATTR']),
  ('dam_effect_rate', 1, 'extra', 'low', ARRAY['LEAF_NODE_DEFAULT_VAL']),
  ('crit_random_speed_factor', 0.8, 'extra', 'high', ARRAY['global_params_data fallback 0.8', 'crit_random_speed_factor generated key']),
  ('anomaly_random_speed_factor', 0.8, 'extra', 'high', ARRAY['global_params_data fallback 0.8', 'anomaly_random_speed_factor generated key']),
  ('weak_random_speed_factor', 0.8, 'extra', 'high', ARRAY['global_params_data fallback 0.8', 'weak_random_speed_factor generated key'])
ON CONFLICT (leaf_name) DO UPDATE SET
  default_value = EXCLUDED.default_value,
  updated_at = NOW();

-- ── Seed data: formula_tag_table_entries ─────────────────────────────────────
-- Mirrors ATTACK_TYPE_TAG_TABLE, ELEMENT_TYPE_TAG_TABLE, KEYWORD_TYPE_TAG_TABLE,
-- GUN_TYPE_TAG_TABLE, SPECIES_TYPE_TAG_TABLE, DEBUFF_TYPE_TAG_TABLE,
-- ARMOR_TYPE_TAG_TABLE, MELEE_TYPE_TAG_TABLE in officialFormulaTagTables.ts

INSERT INTO formula_tag_table_entries (tag_table_type, tag_value, suffix, confidence)
VALUES
  -- Attack type
  ('attack_type', '0', 'default', 'high'),
  ('attack_type', '1', 'melee', 'high'),
  ('attack_type', '2', 'remote', 'high'),
  ('attack_type', '3', 'bomb', 'high'),
  ('attack_type', '4', 'dot', 'high'),
  ('attack_type', '5', 'skill', 'high'),
  ('attack_type', '6', 'item', 'high'),
  ('attack_type', '7', 'facility', 'high'),
  -- Element type
  ('element_type', '0', 'physics', 'high'),
  ('element_type', '1', 'fire', 'high'),
  ('element_type', '2', 'ice', 'high'),
  ('element_type', '3', 'lightning', 'high'),
  ('element_type', '4', 'machine', 'high'),
  ('element_type', '5', 'carrier', 'high'),
  ('element_type', '6', 'explode', 'high'),
  ('element_type', '7', 'penetration', 'high'),
  ('element_type', '8', 'impact', 'high'),
  ('element_type', '9', 'suppression', 'high'),
  ('element_type', '10', 'stun', 'high'),
  ('element_type', 'fire', 'fire', 'high'),
  ('element_type', 'ice', 'ice', 'high'),
  ('element_type', 'lightning', 'lightning', 'high'),
  ('element_type', 'physics', 'physics', 'high'),
  ('element_type', 'blaze', 'fire', 'high'),
  ('element_type', 'frost', 'ice', 'high'),
  ('element_type', 'shock', 'lightning', 'high'),
  ('element_type', 'physical', 'physics', 'high'),
  -- Keyword type
  ('keyword_type', 'SCORCH', 'scorch', 'high'),
  ('keyword_type', 'VORTEX', 'vortex', 'high'),
  ('keyword_type', 'SURGE', 'surge', 'high'),
  ('keyword_type', 'BLAST', 'blast', 'high'),
  ('keyword_type', 'SHRAP', 'shrap', 'high'),
  ('keyword_type', 'PROJ', 'proj', 'high'),
  ('keyword_type', 'BLEEDING', 'bleeding', 'high'),
  ('keyword_type', 'ARMED', 'armed', 'high'),
  ('keyword_type', 'DRAW', 'draw', 'high'),
  ('keyword_type', 'MARK', 'mark', 'high'),
  -- Species type
  ('species_type', '0', 'default', 'high'),
  ('species_type', '1', 'ascender', 'high'),
  ('species_type', '2', 'alters', 'high'),
  ('species_type', '3', 'rosetta', 'high'),
  ('species_type', '4', 'vulcher', 'high'),
  ('species_type', '5', 'creatures', 'high'),
  ('species_type', '6', 'machina', 'high'),
  ('species_type', '7', 'master', 'high'),
  ('species_type', '8', 'deviation', 'high'),
  -- Debuff type
  ('debuff_type', 'vortex', 'vortex', 'high'),
  ('debuff_type', 'scorch', 'scorch', 'high'),
  ('debuff_type', 'surge', 'surge', 'high'),
  ('debuff_type', 'bleeding', 'bleeding', 'high'),
  ('debuff_type', 'mark', 'mark', 'high'),
  ('debuff_type', 'proj', 'proj', 'high'),
  ('debuff_type', 'shrap', 'shrap', 'high'),
  ('debuff_type', 'blast', 'blast', 'high'),
  ('debuff_type', 'armed', 'armed', 'high'),
  ('debuff_type', 'frozen', 'frozen', 'high'),
  ('debuff_type', 'fire', 'fire', 'high'),
  ('debuff_type', 'electric', 'electric', 'high'),
  ('debuff_type', 'wet', 'wet', 'high'),
  ('debuff_type', 'cut', 'cut', 'high'),
  ('debuff_type', 'blunt', 'blunt', 'high'),
  ('debuff_type', 'freeze', 'freeze', 'high'),
  ('debuff_type', 'echo', 'echo', 'high'),
  ('debuff_type', 'quick_draw', 'quick_draw', 'high'),
  -- Armor type
  ('armor_type', 'physics', 'physics', 'high'),
  ('armor_type', 'organic', 'organic', 'high'),
  ('armor_type', 'infested', 'infested', 'high'),
  ('armor_type', 'rosetta', 'rosetta', 'high'),
  ('armor_type', 'machine', 'machine', 'high'),
  ('armor_type', 'carrier', 'carrier', 'high'),
  ('armor_type', 'building', 'building', 'high'),
  ('armor_type', 'special', 'special', 'high'),
  -- Melee type
  ('melee_type', 'combo', 'combo', 'high'),
  ('melee_type', 'heavy', 'heavy', 'high'),
  ('melee_type', 'dash', 'dash', 'high'),
  ('melee_type', 'backstab', 'backstab', 'high')
ON CONFLICT (tag_table_type, tag_value) DO UPDATE SET
  suffix = EXCLUDED.suffix,
  updated_at = NOW();

-- ── Seed data: formula_stat_bridge ────────────────────────────────────────────
-- Mirrors BRIDGE_ENTRIES in officialFormulaStatBridge.ts

INSERT INTO formula_stat_bridge (leaf_name, suffix, stat_key, tag_table_type, confidence, evidence)
VALUES
  ('attack_type_dam_add_rate', 'melee', 'meleeDMGBonus', 'attack_type', 'high',
   ARRAY['force_attack_utility.py:203 confirms attack_type_dam_add_rate_melee']),
  ('element_type_dam_add_rate', 'fire', 'elementalDMGBonus', 'element_type', 'high',
   ARRAY['deviation_const.py:186 element_type_dam_add_rate_fire']),
  ('element_type_dam_add_rate', 'ice', 'elementalDMGBonus', 'element_type', 'high',
   ARRAY['deviation_const.py:186 element_type_dam_add_rate_ice']),
  ('element_type_dam_add_rate', 'lightning', 'elementalDMGBonus', 'element_type', 'high',
   ARRAY['deviation_const.py:186 element_type_dam_add_rate_lightning']),
  ('element_type_dam_add_rate', 'physics', 'weaponDMGBonus', 'element_type', 'medium',
   ARRAY['deviation_const.py:188 element_type_dam_add_rate_physics']),
  ('keyword_proc_dam_add_rate', 'scorch', 'burnDMGBonus', 'keyword_type', 'high',
   ARRAY['char_property_data.pyc: keyword_proc_dam_add_rate_scorch']),
  ('keyword_proc_dam_add_rate', 'vortex', 'frostVortexDMGBonus', 'keyword_type', 'high',
   ARRAY['char_property_data.pyc: keyword_proc_dam_add_rate_vortex']),
  ('keyword_proc_dam_add_rate', 'surge', 'powerSurgeDMGBonus', 'keyword_type', 'high',
   ARRAY['char_property_data.pyc: keyword_proc_dam_add_rate_surge']),
  ('keyword_proc_dam_add_rate', 'blast', 'unstableBomberDMGBonus', 'keyword_type', 'high',
   ARRAY['char_property_data.pyc: keyword_proc_dam_add_rate_blast']),
  ('keyword_proc_dam_add_rate', 'shrap', 'shrapnelDMGBonus', 'keyword_type', 'high',
   ARRAY['char_property_data.pyc: keyword_proc_dam_add_rate_shrap'])
ON CONFLICT (leaf_name, suffix) DO UPDATE SET
  stat_key = EXCLUDED.stat_key,
  updated_at = NOW();

-- ── RLS Policies ──────────────────────────────────────────────────────────────
-- Readable by anon key (client-side), writable by service role only.

ALTER TABLE formula_leaf_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_tag_table_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_stat_bridge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formula_leaf_defaults_select_anon"
  ON formula_leaf_defaults FOR SELECT USING (true);

CREATE POLICY "formula_tag_table_entries_select_anon"
  ON formula_tag_table_entries FOR SELECT USING (true);

CREATE POLICY "formula_stat_bridge_select_anon"
  ON formula_stat_bridge FOR SELECT USING (true);
