#!/usr/bin/env python3
"""
Deep mining pass over the decompressed Once Human script corpus.

Phases:
1. Signature detection & format classification
2. Schema grouping (pyc/bindict, proto, json, sqlite, config)
3. Structure extraction (bindict tables, marshal constants, string pools)
4. Targeted search (deviant traits, slot IDs, fusion rules, weapon formulas, enums)
5. Dedup & version diffing of schemas
6. ID→name/icon/model path mapping

Output: structured JSON reports in a mining_output/ directory.
"""
from __future__ import annotations

import argparse
import collections
import faulthandler
import json
import marshal
import os
import re
import struct
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

faulthandler.enable()

# ── Config ──

sys.setrecursionlimit(3000)  # Reasonable limit for marshal

CORPUS_ROOT = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\root_script_dictrained\raw")
OUTPUT_DIR = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\mining_output")

# Targeted search patterns (case-insensitive)
SEARCH_TERMS = [
    # Deviant / Deviation
    r'deviant', r'deviation', r'morph', r'mutation', r'trait',
    # Slots & gear
    r'slot_?id', r'equip_?slot', r'armor_?slot', r'weapon_?slot',
    # Fusion / crafting
    r'fusion', r'blueprint', r'calibrat', r'starchrom', r'enhance',
    # Inheritance / composition
    r'inherit', r'parent_?id', r'base_?class', r'template_?id',
    # Weapon formulas
    r'damage_?formula', r'attack_?rate', r'fire_?rate', r'crit_?rate',
    r'weakspot', r'psi_?intensity', r'status_?dmg', r'elemental_?dmg',
    r'weapon_?dmg', r'bullet_?speed', r'reload',
    # Hidden enums
    r'enum', r'_type\b', r'_kind\b', r'_category\b', r'_class\b',
    # Mod system
    r'mod_?suffix', r'mod_?core', r'mod_?attr', r'keyword',
    # Localization / icon paths
    r'icon_?path', r'model_?path', r'locali[sz]', r'text_?id', r'string_?id',
    # IDs
    r'item_?id', r'unit_?id', r'buff_?id', r'skill_?id',
]
SEARCH_COMPILED = [re.compile(p, re.IGNORECASE) for p in SEARCH_TERMS]

# ── Data classes ──

@dataclass
class FileSignature:
    path: str
    extension: str
    format_type: str  # pyc, bindict_pyc, json, proto, sqlite, text, binary, empty
    size: int
    schema_group: str = ""
    pyc_magic: str = ""
    has_bindict: bool = False
    string_count: int = 0
    search_hits: list = field(default_factory=list)


# ── Phase 1: Signature detection ──

def detect_format(filepath: Path) -> FileSignature:
    """Detect file format from magic bytes and content."""
    size = filepath.stat().st_size
    ext = filepath.suffix.lower()
    rel = str(filepath.relative_to(CORPUS_ROOT)).replace('\\', '/')

    if size == 0:
        return FileSignature(path=rel, extension=ext, format_type='empty', size=0)

    try:
        head = filepath.read_bytes()[:64]
    except Exception:
        return FileSignature(path=rel, extension=ext, format_type='error', size=size)

    # SQLite
    if head[:16] == b'SQLite format 3\x00':
        return FileSignature(path=rel, extension=ext, format_type='sqlite', size=size)

    # JSON
    if head[:1] in (b'{', b'[') or (head[:3] == b'\xef\xbb\xbf' and head[3:4] in (b'{', b'[')):
        return FileSignature(path=rel, extension=ext, format_type='json', size=size)

    # Protobuf (heuristic: .proto extension or starts with syntax)
    if ext == '.proto' or head[:6] == b'syntax':
        return FileSignature(path=rel, extension=ext, format_type='proto', size=size)

    # Python bytecode
    if ext == '.pyc' or (len(head) >= 4 and head[2:4] == b'\r\n'):
        pyc_magic = head[:4].hex() if len(head) >= 4 else ''
        return FileSignature(path=rel, extension=ext, format_type='pyc', size=size, pyc_magic=pyc_magic)

    # Text heuristic
    try:
        sample = filepath.read_bytes()[:2048]
        if all(b < 128 or b in (0xC0, 0xC1, 0xE0, 0xF0) for b in sample[:512] if b > 127):
            sample.decode('utf-8')
            return FileSignature(path=rel, extension=ext, format_type='text', size=size)
    except (UnicodeDecodeError, Exception):
        pass

    return FileSignature(path=rel, extension=ext, format_type='binary', size=size)


# ── Phase 2: PYC deep analysis (bindict, constants, strings) ──

def analyze_pyc(filepath: Path, sig: FileSignature) -> dict[str, Any]:
    """Deep-analyze a .pyc file using raw string extraction instead of marshal.
    NeoX bytecode causes segfaults with marshal.loads on standard CPython,
    so we extract strings directly from the raw bytes."""
    result: dict[str, Any] = {
        'is_bindict': False,
        'bindict_string_count': 0,
        'bindict_strings_sample': [],
        'co_names': [],
        'constants_summary': {},
        'interesting_strings': [],
        'numeric_constants': [],
    }

    try:
        raw = filepath.read_bytes()
    except Exception:
        return result
    if len(raw) < 20 or len(raw) > 10_000_000:
        return result

    # Check for bindict pattern via raw bytes (look for the marker string)
    if b'bindict' in raw[:200]:
        result['is_bindict'] = True
        sig.has_bindict = True
        # Try to extract bindict blob directly from raw bytes
        # Bindict blobs have: u32 count, then count*u32 offsets, then string data
        # Look for the pattern after the pyc header
        for offset in range(16, min(len(raw) - 12, 500)):
            count = struct.unpack_from('<I', raw, offset)[0]
            if 10 < count < 100000:
                table_end = offset + 8 + count * 4
                if table_end < len(raw):
                    try:
                        blob = raw[offset:]
                        strings = extract_bindict_strings(blob)
                        if strings and len(strings) > 5:
                            result['bindict_string_count'] = len(strings)
                            result['bindict_strings_sample'] = strings[:50]
                            sig.string_count = len(strings)
                            break
                    except Exception:
                        continue

    # Extract strings directly from raw bytes (safe — no code object traversal)
    all_strings = extract_raw_strings(raw)
    result['interesting_strings'] = all_strings[:200]

    # Extract numeric patterns (4-byte floats that look like game constants)
    numerics = extract_raw_numerics(raw)
    result['numeric_constants'] = numerics[:100]

    return result


def extract_raw_strings(data: bytes, min_len: int = 4, max_len: int = 500) -> list[str]:
    """Extract printable ASCII/UTF-8 strings from raw bytes."""
    strings = set()
    # Pattern: sequences of printable chars
    current = bytearray()
    for byte in data:
        if 32 <= byte < 127 or byte in (9, 10, 13):
            current.append(byte)
        else:
            if len(current) >= min_len:
                s = bytes(current).decode('ascii', 'ignore').strip()
                if len(s) >= min_len and len(s) <= max_len:
                    # Filter out obvious garbage
                    if not all(c == s[0] for c in s):
                        strings.add(s)
            current.clear()
    # Last segment
    if len(current) >= min_len:
        s = bytes(current).decode('ascii', 'ignore').strip()
        if len(s) >= min_len and len(s) <= max_len:
            strings.add(s)

    return sorted(strings)[:500]


def extract_raw_numerics(data: bytes) -> list:
    """Extract float constants that look like game balance values."""
    numerics = []
    # Skip if too small
    if len(data) < 100:
        return numerics
    # Look for IEEE 754 floats in the typical game-data range
    for i in range(0, min(len(data) - 4, 10000), 4):
        try:
            val = struct.unpack_from('<f', data, i)[0]
            if 0.001 < abs(val) < 100000 and val != 1.0 and val != 0.0:
                # Rough filter for "interesting" values
                if abs(val - round(val)) > 0.001 or 1 < abs(val) < 10000:
                    numerics.append(round(val, 4))
        except Exception:
            continue
    # Deduplicate
    return sorted(set(numerics))[:100]


def extract_bindict_strings(blob: bytes) -> list[str]:
    """Extract string table from a bindict blob."""
    if len(blob) < 8:
        return []
    count = struct.unpack_from('<I', blob, 0)[0]
    if count <= 0 or count > 100000:
        return []
    if len(blob) < 8 + count * 4:
        return []
    offsets = [struct.unpack_from('<I', blob, 8 + i * 4)[0] for i in range(count)]
    data_start = 8 + count * 4
    prev = 0
    strings: list[str] = []
    for end in offsets:
        if data_start + end > len(blob) or end < prev:
            break
        try:
            s = blob[data_start + prev:data_start + end].decode('utf-8', 'ignore')
            strings.append(s)
        except Exception:
            break
        prev = end
    return strings


def harvest_code_strings(code, strings: set, numerics: list, depth: int = 0):
    """Safely harvest string and numeric constants from a code object tree.
    Uses only direct attribute access with explicit type checks to avoid segfaults
    from NeoX's modified bytecode objects."""
    # Only process the top-level code object — no traversal into nested code objects.
    # The access violation comes from iterating nested objects that have corrupted pointers.
    try:
        consts = code.co_consts
        if not isinstance(consts, tuple):
            return
    except Exception:
        return

    for const in consts:
        try:
            if isinstance(const, str) and 2 < len(const) < 1000:
                strings.add(const)
            elif isinstance(const, int) and const != 0 and const != 1 and abs(const) > 10:
                if len(numerics) < 200:
                    numerics.append(const)
            elif isinstance(const, float) and const != 0.0 and const != 1.0:
                if len(numerics) < 200:
                    numerics.append(const)
            # Do NOT recurse into nested code objects — causes segfault on NeoX bytecode
        except (TypeError, ValueError):
            continue

    try:
        names = code.co_names
        if isinstance(names, tuple):
            for name in names:
                if isinstance(name, str) and 2 < len(name) < 200:
                    strings.add(name)
    except Exception:
        pass

    try:
        varnames = code.co_varnames
        if isinstance(varnames, tuple):
            for name in varnames:
                if isinstance(name, str) and 2 < len(name) < 200:
                    strings.add(name)
    except Exception:
        pass


# ── Phase 3: Targeted search ──

def search_strings(strings: list[str], filepath_rel: str) -> list[dict]:
    """Search extracted strings against target patterns."""
    hits = []
    searchable = '\n'.join(strings)
    for i, pattern in enumerate(SEARCH_COMPILED):
        matches = pattern.findall(searchable)
        if matches:
            # Find the actual strings that matched
            matched_strings = []
            for s in strings:
                if pattern.search(s):
                    matched_strings.append(s)
            if matched_strings:
                hits.append({
                    'pattern': SEARCH_TERMS[i],
                    'file': filepath_rel,
                    'count': len(matched_strings),
                    'samples': matched_strings[:10],
                })
    return hits


# ── Phase 4: Schema grouping ──

def compute_schema_group(filepath: Path) -> str:
    """Compute schema group from directory structure."""
    rel = filepath.relative_to(CORPUS_ROOT)
    parts = rel.parts
    if len(parts) >= 2:
        return '/'.join(parts[:2])
    return parts[0] if parts else 'root'


# ── Phase 5: ID mapping extraction ──

LOCALIZATION_PATTERNS = [
    r'client_text',
    r'translate',
    r'text_',
    r'_text\b',
    r'locali',
]

ICON_MODEL_PATTERNS = [
    r'icon',
    r'model',
    r'texture',
    r'mesh',
    r'asset_?path',
    r'res_?path',
]

def is_localization_file(rel_path: str) -> bool:
    return any(re.search(p, rel_path, re.IGNORECASE) for p in LOCALIZATION_PATTERNS)

def is_icon_model_file(rel_path: str) -> bool:
    return any(re.search(p, rel_path, re.IGNORECASE) for p in ICON_MODEL_PATTERNS)


# ── Main mining pipeline ──

def run_mining(max_files: int = 0, focus_dirs: list[str] | None = None):
    """Run the full mining pipeline."""
    t0 = time.time()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Mining corpus at: {CORPUS_ROOT}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Collect all files
    all_files = sorted(CORPUS_ROOT.rglob('*'))
    all_files = [f for f in all_files if f.is_file()]

    if focus_dirs:
        all_files = [f for f in all_files if any(
            d.lower() in str(f.relative_to(CORPUS_ROOT)).lower() for d in focus_dirs
        )]
        print(f"Focused on dirs: {focus_dirs}")

    if max_files:
        all_files = all_files[:max_files]

    total = len(all_files)
    print(f"Files to process: {total}")
    print()

    # Phase 1: Signature detection
    print("═══ Phase 1: Signature Detection ═══")
    signatures: list[FileSignature] = []
    format_counts: dict[str, int] = collections.Counter()

    for i, fp in enumerate(all_files):
        sig = detect_format(fp)
        sig.schema_group = compute_schema_group(fp)
        signatures.append(sig)
        format_counts[sig.format_type] += 1
        if (i + 1) % 10000 == 0:
            print(f"  [{i+1}/{total}] signatures detected...")

    print(f"  Format distribution:")
    for fmt, cnt in sorted(format_counts.items(), key=lambda x: -x[1]):
        print(f"    {fmt:15s} {cnt:>6d}")
    print()

    # Phase 2: Schema grouping
    print("═══ Phase 2: Schema Grouping ═══")
    schema_groups: dict[str, list[str]] = collections.defaultdict(list)
    for sig in signatures:
        schema_groups[sig.schema_group].append(sig.path)

    top_groups = sorted(schema_groups.items(), key=lambda x: -len(x[1]))[:50]
    print(f"  Top schema groups ({len(schema_groups)} total):")
    for group, files in top_groups[:20]:
        print(f"    {group:50s} {len(files):>5d} files")
    print()

    # Write schema groups index
    schema_index = {g: {'count': len(fs), 'sample_files': fs[:5]} for g, fs in top_groups}
    write_json(OUTPUT_DIR / 'schema_groups.json', schema_index)

    # Phase 3: Deep PYC analysis + string extraction + targeted search
    print("═══ Phase 3: Deep Analysis (PYC + Strings + Search) ═══")
    all_search_hits: list[dict] = []
    bindict_files: list[dict] = []
    localization_maps: list[dict] = []
    icon_model_maps: list[dict] = []
    all_strings_index: dict[str, list[str]] = {}  # file → strings
    formula_files: list[dict] = []
    enum_candidates: list[dict] = []

    pyc_files = [s for s in signatures if s.format_type == 'pyc']
    print(f"  PYC files to deep-analyze: {len(pyc_files)}")
    sys.stdout.flush()

    for i, sig in enumerate(pyc_files):
        filepath = CORPUS_ROOT / sig.path.replace('/', os.sep)
        if not filepath.exists():
            continue
        if filepath.stat().st_size > 2_000_000:
            continue  # Skip files > 2MB to avoid segfaults in marshal

        try:
            analysis = analyze_pyc(filepath, sig)
        except (MemoryError, RecursionError, Exception) as e:
            continue
        except BaseException:
            continue

        if (i + 1) % 5000 == 0:
            print(f"  [{i+1}/{len(pyc_files)}] analyzed... (hits so far: {len(all_search_hits)})")

        # Collect bindict files
        if analysis['is_bindict'] and analysis['bindict_string_count'] > 0:
            bindict_files.append({
                'path': sig.path,
                'string_count': analysis['bindict_string_count'],
                'sample': analysis['bindict_strings_sample'][:20],
            })

        # Targeted search on all harvested strings
        all_strs = analysis['interesting_strings']
        if all_strs:
            hits = search_strings(all_strs, sig.path)
            if hits:
                all_search_hits.extend(hits)
                sig.search_hits = [h['pattern'] for h in hits]

        # Localization mapping
        if is_localization_file(sig.path) and all_strs:
            localization_maps.append({
                'path': sig.path,
                'strings': all_strs[:100],
            })

        # Icon/model path mapping
        if is_icon_model_file(sig.path) and all_strs:
            path_strings = [s for s in all_strs if '/' in s or '\\' in s or s.endswith(('.png', '.jpg', '.dds', '.mesh', '.fbx'))]
            if path_strings:
                icon_model_maps.append({
                    'path': sig.path,
                    'asset_paths': path_strings[:50],
                })

        # Formula detection
        formula_indicators = ['damage', 'formula', 'attack', 'crit', 'multiplier', 'coefficient']
        if any(ind in sig.path.lower() for ind in formula_indicators):
            formula_files.append({
                'path': sig.path,
                'strings': all_strs[:100],
                'numerics': analysis['numeric_constants'][:50],
            })
        elif analysis['numeric_constants'] and any(
            any(fi in s.lower() for fi in formula_indicators) for s in all_strs[:50]
        ):
            formula_files.append({
                'path': sig.path,
                'strings': [s for s in all_strs if any(fi in s.lower() for fi in formula_indicators)][:50],
                'numerics': analysis['numeric_constants'][:50],
            })

        # Enum detection (files with many short uppercase constants)
        if analysis['co_names']:
            upper_names = [n for n in analysis['co_names'] if n.isupper() and len(n) > 2]
            if len(upper_names) >= 3:
                enum_candidates.append({
                    'path': sig.path,
                    'names': analysis['co_names'][:50],
                    'upper_constants': upper_names[:30],
                })

        # Build string index for high-value files
        if len(all_strs) > 10 and any(sig.path.startswith(p) for p in [
            'game_common/', 'dcs_extend/', 'entities/', 'ui/', 'client_data/'
        ]):
            all_strings_index[sig.path] = all_strs[:200]

    print(f"  Analysis complete.")
    print(f"    Bindict files:     {len(bindict_files)}")
    print(f"    Search hits:       {len(all_search_hits)}")
    print(f"    Localization maps: {len(localization_maps)}")
    print(f"    Icon/model maps:   {len(icon_model_maps)}")
    print(f"    Formula files:     {len(formula_files)}")
    print(f"    Enum candidates:   {len(enum_candidates)}")
    print(f"    Indexed files:     {len(all_strings_index)}")
    print()

    # Phase 4: Aggregate search hits by category
    print("═══ Phase 4: Search Aggregation ═══")
    hits_by_pattern: dict[str, list[dict]] = collections.defaultdict(list)
    for hit in all_search_hits:
        hits_by_pattern[hit['pattern']].append(hit)

    print(f"  Hits by search pattern:")
    for pattern, hits in sorted(hits_by_pattern.items(), key=lambda x: -len(x[1])):
        unique_files = len(set(h['file'] for h in hits))
        print(f"    {pattern:30s} → {len(hits):>5d} hits in {unique_files:>4d} files")
    print()

    # Phase 5: Write all outputs
    print("═══ Phase 5: Writing Reports ═══")

    write_json(OUTPUT_DIR / 'format_signatures.json', {
        'total_files': total,
        'format_distribution': dict(format_counts),
        'files_by_format': {
            fmt: [s.path for s in signatures if s.format_type == fmt][:500]
            for fmt in format_counts.keys()
        },
    })

    write_json(OUTPUT_DIR / 'bindict_files.json', {
        'count': len(bindict_files),
        'files': sorted(bindict_files, key=lambda x: -x['string_count'])[:500],
    })

    write_json(OUTPUT_DIR / 'search_hits.json', {
        'total_hits': len(all_search_hits),
        'by_pattern': {
            p: sorted(hits, key=lambda x: -x['count'])[:100]
            for p, hits in hits_by_pattern.items()
        },
    })

    write_json(OUTPUT_DIR / 'localization_maps.json', {
        'count': len(localization_maps),
        'files': localization_maps[:200],
    })

    write_json(OUTPUT_DIR / 'icon_model_maps.json', {
        'count': len(icon_model_maps),
        'files': icon_model_maps[:200],
    })

    write_json(OUTPUT_DIR / 'formula_files.json', {
        'count': len(formula_files),
        'files': formula_files[:200],
    })

    write_json(OUTPUT_DIR / 'enum_candidates.json', {
        'count': len(enum_candidates),
        'files': enum_candidates[:500],
    })

    write_json(OUTPUT_DIR / 'string_index.json', {
        'indexed_files': len(all_strings_index),
        'index': dict(list(all_strings_index.items())[:2000]),
    })

    # Summary
    elapsed = time.time() - t0
    summary = {
        'corpus_root': str(CORPUS_ROOT),
        'total_files': total,
        'pyc_analyzed': len(pyc_files),
        'format_distribution': dict(format_counts),
        'bindict_count': len(bindict_files),
        'search_hits_total': len(all_search_hits),
        'localization_count': len(localization_maps),
        'icon_model_count': len(icon_model_maps),
        'formula_count': len(formula_files),
        'enum_count': len(enum_candidates),
        'string_index_count': len(all_strings_index),
        'duration_seconds': round(elapsed, 1),
        'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
    }
    write_json(OUTPUT_DIR / 'mining_summary.json', summary)

    print(f"\n{'='*60}")
    print(f"MINING COMPLETE — {elapsed:.0f}s")
    print(f"{'='*60}")
    print(f"  Reports written to: {OUTPUT_DIR}")
    for k, v in summary.items():
        if k not in ('corpus_root', 'generated_at'):
            print(f"    {k}: {v}")

    return summary


def write_json(path: Path, data: Any):
    """Write JSON with safe serialization."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, default=str) + '\n',
        encoding='utf-8',
    )


# ── CLI ──

def main() -> int:
    parser = argparse.ArgumentParser(description='Deep mining pass over decompressed Once Human corpus')
    parser.add_argument('--max-files', type=int, default=0, help='Limit files to process (0=all)')
    parser.add_argument('--focus', nargs='*', help='Focus on specific directory prefixes (e.g. game_common dcs_extend)')
    args = parser.parse_args()

    run_mining(max_files=args.max_files, focus_dirs=args.focus)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
