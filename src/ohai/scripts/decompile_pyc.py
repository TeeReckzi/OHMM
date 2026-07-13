#!/usr/bin/env python3
"""
Decompile NeoX .pyc files (magic 3496) to Python source.

Strategy:
1. Patch the magic bytes from 3496 (NeoX) to 3425 (CPython 3.9a2) 
2. Use uncompyle6 to decompile
3. If that fails, try decompyle3
4. If both fail, fallback to dis-based extraction of constants/structure

NeoX uses Python 3.9-based bytecode with a custom magic number.
"""
from __future__ import annotations

import argparse
import io
import os
import struct
import sys
import time
import traceback
from pathlib import Path
from typing import Any

# Patch magic: NeoX 3496 → CPython 3.9
NEOX_MAGIC = 3496
# Try multiple target magics for compatibility
TARGET_MAGICS = [
    3425,  # Python 3.9a2
    3424,  # Python 3.9a1  
    3413,  # Python 3.8
]

CORPUS_ROOT = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\root_script_dictrained\raw")
OUTPUT_ROOT = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled_src")

# Priority files to decompile (most valuable for OHMM)
PRIORITY_FILES = [
    "game_common/data/formula_data/damage_formula.pyc",
    "dcs_extend/const/formula_const.pyc",
    "dcs_extend/component_server/CompDamageFormula.pyc",
    "dcs_extend/component_server/CompFormulaAdapter.pyc",
    "dcs_extend/common/damage_event_parser.pyc",
    "game_common/guncore/GunCoreHelper.pyc",
    "game_common/guncore/BluePrintHelper.pyc",
    "game_common/gunperk/GunPerkConst.pyc",
    "game_common/deviation/DeviationConst.pyc",
    "game_common/deviation/DeviationDataModel.pyc",
    "game_common/deviation/fusion/FusionResult.pyc",
    "game_common/deviation/fusion/FusionAdditive.pyc",
    "game_common/deviation/fusion/FusionNodeOutput.pyc",
    "game_common/helper/DeviationHelper.pyc",
    "dcs_extend/const/deviation_const.pyc",
    "dcs_extend/const/weapon_const.pyc",
    "dcs_extend/common/deviation_utility.pyc",
    "dcs_extend/component/shoot_new/keyword/SubCompKeywordBase.pyc",
    "dcs_extend/component/shoot_new/keyword/SubCompKeywordDianYong.pyc",
    "dcs_extend/component/shoot_new/keyword/SubCompKeywordBaoDan.pyc",
    "dcs_extend/component/shoot_new/keyword/SubCompKeywordBingShuangXuanWo.pyc",
    "dcs_extend/component/shoot_new/keyword/SubCompKeywordSuiDan.pyc",
    "dcs_extend/component/shoot_new/keyword/CompShootDamageSimulateClient.pyc",
    "game_common/Mod/ModV2IndexCache.pyc",
    "game_common/item/ItemSysConst.pyc",
    "game_common/item/ItemHelper.pyc",
    "game_common/item/ItemOpConst.pyc",
    "dcs_extend/component/spring/spring_types.pyc",
    "dcs_extend/component_server/CompDeviationSlotMgr.pyc",
    "entities/ClientDeviation.pyc",
    "entities/ClientDeviationMonster.pyc",
    "game_common/live_stock/LiveStockConst.pyc",
    "game_common/cradle/__init__.pyc",
    "game_common/data/gun_calibration_affix_option_data.pyc",
]


def patch_magic(data: bytes, target_magic: int) -> bytes:
    """Replace the NeoX magic with a standard CPython magic."""
    magic_bytes = struct.pack('<Hcc', target_magic, b'\r', b'\n')
    return magic_bytes + data[4:]


def try_uncompyle6(patched_data: bytes, filepath: str) -> str | None:
    """Attempt decompilation with uncompyle6."""
    try:
        import uncompyle6
        from uncompyle6.main import decompile
        import tempfile

        with tempfile.NamedTemporaryFile(suffix='.pyc', delete=False) as tmp:
            tmp.write(patched_data)
            tmp_path = tmp.name

        try:
            out = io.StringIO()
            decompile(bytecode_version=(3, 9), co=None, out=out,
                      source_size=0, code_objects={}, timestamp=0,
                      is_pypy=False, magic_int=3425)
        except Exception:
            pass

        # Alternative: use the file-based approach
        out = io.StringIO()
        try:
            uncompyle6.decompile_file(tmp_path, out)
            result = out.getvalue()
            if result and len(result) > 10:
                return result
        except Exception as e:
            pass
        finally:
            os.unlink(tmp_path)

    except ImportError:
        pass
    except Exception:
        pass
    return None


def try_decompyle3(patched_data: bytes, filepath: str) -> str | None:
    """Attempt decompilation with decompyle3."""
    try:
        import decompyle3
        import tempfile

        with tempfile.NamedTemporaryFile(suffix='.pyc', delete=False) as tmp:
            tmp.write(patched_data)
            tmp_path = tmp.name

        out = io.StringIO()
        try:
            decompyle3.decompile_file(tmp_path, out)
            result = out.getvalue()
            if result and len(result) > 10:
                return result
        except Exception:
            pass
        finally:
            os.unlink(tmp_path)

    except ImportError:
        pass
    except Exception:
        pass
    return None


def try_marshal_disasm(data: bytes, filepath: str) -> str | None:
    """Fallback: marshal.loads + dis module to get a structured representation."""
    import marshal
    import dis

    for header_size in (16, 12, 8):
        try:
            code = marshal.loads(data[header_size:])
            out = io.StringIO()
            out.write(f"# Disassembly of {filepath}\n")
            out.write(f"# (marshal fallback — decompiler failed)\n\n")

            # Extract constants and names
            out.write("# === CO_NAMES ===\n")
            if hasattr(code, 'co_names'):
                for n in code.co_names:
                    out.write(f"#   {n}\n")

            out.write("\n# === CO_CONSTS ===\n")
            if hasattr(code, 'co_consts'):
                for i, c in enumerate(code.co_consts):
                    if isinstance(c, str) and len(c) > 2:
                        out.write(f"#   [{i}] str: {repr(c)[:200]}\n")
                    elif isinstance(c, (int, float)):
                        out.write(f"#   [{i}] num: {c}\n")
                    elif isinstance(c, tuple):
                        out.write(f"#   [{i}] tuple: {repr(c)[:200]}\n")
                    elif isinstance(c, bytes):
                        out.write(f"#   [{i}] bytes: len={len(c)}\n")
                    elif hasattr(c, 'co_name'):
                        out.write(f"#   [{i}] code: {c.co_name}\n")

            out.write("\n# === DISASSEMBLY ===\n")
            try:
                dis.dis(code, file=out)
            except Exception:
                out.write("# (dis failed on this code object)\n")

            return out.getvalue()
        except Exception:
            continue
    return None


def decompile_file(filepath: Path, output_path: Path) -> dict[str, Any]:
    """Try to decompile a single .pyc file."""
    data = filepath.read_bytes()
    if len(data) < 16:
        return {'status': 'skip', 'reason': 'too_small'}

    magic = struct.unpack_from('<H', data, 0)[0]
    if magic != NEOX_MAGIC:
        return {'status': 'skip', 'reason': f'unexpected_magic_{magic}'}

    result = {'status': 'failed', 'method': None, 'size': len(data)}

    # Try each target magic with uncompyle6 and decompyle3
    for target_magic in TARGET_MAGICS:
        patched = patch_magic(data, target_magic)

        source = try_uncompyle6(patched, str(filepath))
        if source:
            result = {'status': 'ok', 'method': f'uncompyle6_magic{target_magic}', 'size': len(source)}
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(source, encoding='utf-8')
            return result

        source = try_decompyle3(patched, str(filepath))
        if source:
            result = {'status': 'ok', 'method': f'decompyle3_magic{target_magic}', 'size': len(source)}
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(source, encoding='utf-8')
            return result

    # Fallback: marshal disassembly (won't crash because we only access safe attrs)
    source = try_marshal_disasm(data, str(filepath))
    if source:
        result = {'status': 'partial', 'method': 'marshal_disasm', 'size': len(source)}
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.with_suffix('.dis.py').write_text(source, encoding='utf-8')
        return result

    return result


def run_decompile(priority_only: bool = True, max_files: int = 0):
    """Run the decompilation pipeline."""
    t0 = time.time()
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    if priority_only:
        files_to_process = []
        for rel in PRIORITY_FILES:
            fp = CORPUS_ROOT / rel.replace('/', os.sep)
            if fp.exists():
                files_to_process.append((fp, rel))
            else:
                print(f"  [MISSING] {rel}")
    else:
        # Process all .pyc files in priority directories
        priority_dirs = [
            'game_common/data/formula_data',
            'game_common/deviation',
            'game_common/guncore',
            'game_common/gunperk',
            'game_common/Mod',
            'game_common/item',
            'game_common/cradle',
            'game_common/helper',
            'game_common/live_stock',
            'dcs_extend/const',
            'dcs_extend/common',
            'dcs_extend/component_server',
            'dcs_extend/component/shoot_new/keyword',
            'entities',
            'client_text/client_text_zh',
        ]
        files_to_process = []
        for d in priority_dirs:
            dir_path = CORPUS_ROOT / d.replace('/', os.sep)
            if dir_path.exists():
                for fp in sorted(dir_path.rglob('*.pyc')):
                    rel = str(fp.relative_to(CORPUS_ROOT)).replace('\\', '/')
                    files_to_process.append((fp, rel))

        if max_files:
            files_to_process = files_to_process[:max_files]

    total = len(files_to_process)
    print(f"Files to decompile: {total}")
    print()

    stats = {'ok': 0, 'partial': 0, 'failed': 0, 'skip': 0}
    results = []

    for i, (fp, rel) in enumerate(files_to_process):
        out_path = OUTPUT_ROOT / rel.replace('.pyc', '.py')

        try:
            result = decompile_file(fp, out_path)
        except Exception as e:
            result = {'status': 'failed', 'method': None, 'error': str(e)}

        stats[result.get('status', 'failed')] += 1
        results.append({'file': rel, **result})

        if (i + 1) % 50 == 0 or i == total - 1:
            print(f"  [{i+1}/{total}] ok={stats['ok']} partial={stats['partial']} failed={stats['failed']}")

    elapsed = time.time() - t0
    print(f"\n{'='*60}")
    print(f"DECOMPILATION COMPLETE — {elapsed:.1f}s")
    print(f"{'='*60}")
    print(f"  OK:      {stats['ok']}")
    print(f"  Partial: {stats['partial']}")
    print(f"  Failed:  {stats['failed']}")
    print(f"  Skipped: {stats['skip']}")
    print(f"  Output:  {OUTPUT_ROOT}")

    # Write report
    import json
    report = {
        'stats': stats,
        'duration_seconds': round(elapsed, 1),
        'results': results,
    }
    report_path = OUTPUT_ROOT / '_decompile_report.json'
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"  Report:  {report_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description='Decompile NeoX .pyc files to Python source')
    parser.add_argument('--all', action='store_true', help='Process all priority directories, not just key files')
    parser.add_argument('--max-files', type=int, default=0, help='Limit total files processed')
    args = parser.parse_args()

    run_decompile(priority_only=not args.all, max_files=args.max_files)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
