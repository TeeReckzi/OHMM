"""Train a zstd dictionary from successfully extracted Documents/script.npk entries,
then attempt to decompress root script.npk entries using the trained dictionary.

Strategy:
1. Collect all decompressed .pyc payloads from documents_script/raw/ as training samples
2. Train a zstd dictionary using zstandard.train_dictionary()
3. Patch the dictionary's ID to match the target dict ID (1783285611)
4. Attempt decompression of root script.npk entries using the trained dict
5. Report success rate and write extracted files

Usage:
    python train_zstd_dict.py --train
    python train_zstd_dict.py --extract --limit 200
    python train_zstd_dict.py --train --extract --limit 500
"""

from __future__ import annotations

import argparse
import json
import mmap
import struct
import sys
import time
from pathlib import Path
from typing import Any, Optional

import zstandard as zstd

# ── Constants ──

TARGET_DICT_ID = 1783285611
DOCUMENTS_RAW = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\documents_script\raw")
ROOT_NPK = Path(r"C:\Program Files (x86)\Steam\steamapps\common\Once Human\script.npk")
OUTPUT_DIR = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\root_script_dictrained")
DICT_OUTPUT = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\trained_dict.zstd")
RECORD_SIZE = 0x1C


# ── NPK Parsing (from decompile_once_human.py) ──

def parse_names(data: bytes, files: int, names_off: int) -> list[str]:
    names_blob = data[names_off + 16:]
    names: list[str] = []
    current = bytearray()
    for byte in names_blob:
        if byte == 0:
            if current:
                name = bytes(current).decode('utf-8', 'ignore').replace('/', '\\')
                if name:
                    names.append(name)
                    if len(names) == files:
                        break
                current.clear()
            continue
        current.append(byte)
    if len(names) != files:
        raise RuntimeError(f'Failed to recover all entry names: got {len(names)} of {files}')
    return names


def parse_npk_entries(data: bytes | mmap.mmap) -> list[dict[str, Any]]:
    if data[:4] != b'NXPK':
        raise RuntimeError('Not an NXPK archive')
    files = struct.unpack_from('<I', data, 4)[0]
    entry_off = struct.unpack_from('<I', data, 0x14)[0]
    names_off = entry_off + files * RECORD_SIZE + 0x10
    names = parse_names(data, files, names_off)
    entries = []
    for index, name in enumerate(names):
        rec_off = entry_off + index * RECORD_SIZE
        misc1, offset, zsize, size, misc2, misc3, comp_type = struct.unpack_from('<7I', data, rec_off)
        entries.append({
            'index': index,
            'name': name,
            'offset': offset,
            'zsize': zsize,
            'size': size,
            'comp_type': comp_type,
            'misc2': misc2,
            'misc3': misc3,
        })
    return entries


# ── Training ──

def collect_training_samples(max_samples: int = 5000, max_size: int = 64 * 1024) -> list[bytes]:
    """Collect decompressed .pyc files from the documents archive as training data."""
    samples = []
    total_bytes = 0

    pyc_files = sorted(DOCUMENTS_RAW.rglob('*.pyc'))
    print(f"Found {len(pyc_files)} .pyc files in documents archive")

    for f in pyc_files[:max_samples]:
        data = f.read_bytes()
        if 64 < len(data) <= max_size:  # Skip tiny/empty and oversized files
            samples.append(data)
            total_bytes += len(data)

    print(f"Collected {len(samples)} training samples ({total_bytes / 1024 / 1024:.1f} MB)")
    return samples


def train_dictionary(samples: list[bytes], dict_size: int = 1024 * 1024) -> bytes:
    """Train a zstd dictionary from sample data."""
    print(f"Training zstd dictionary (target size: {dict_size // 1024} KB) from {len(samples)} samples...")
    t0 = time.time()

    trained = zstd.train_dictionary(
        dict_size,
        samples,
        level=3,
    )

    elapsed = time.time() - t0
    dict_bytes = trained.as_bytes()
    print(f"Dictionary trained in {elapsed:.1f}s — {len(dict_bytes)} bytes (ID: {trained.dict_id()})")
    return dict_bytes


def patch_dict_id(dict_bytes: bytes, target_id: int) -> bytes:
    """Patch the dictionary's ID field to match the target archive's expected dict ID.

    Zstd dictionary format:
    - Bytes 0-3: magic (0xEC30A437)
    - Bytes 4-7: dict_id (u32 LE)
    """
    ZSTD_DICT_MAGIC = b'\x37\xa4\x30\xec'
    if dict_bytes[:4] != ZSTD_DICT_MAGIC:
        print(f"WARNING: Dictionary doesn't start with expected magic. Got: {dict_bytes[:4].hex()}")
        # Try to patch anyway
        return dict_bytes

    original_id = struct.unpack_from('<I', dict_bytes, 4)[0]
    print(f"Patching dict ID: {original_id} -> {target_id}")
    patched = bytearray(dict_bytes)
    struct.pack_into('<I', patched, 4, target_id)
    return bytes(patched)


# ── Extraction with trained dict ──

def attempt_extraction(
    dict_bytes: bytes,
    limit: Optional[int] = None,
    filter_pattern: Optional[str] = None,
) -> dict[str, Any]:
    """Try to decompress root script.npk entries using the trained dictionary."""

    # Create decompressor with trained dictionary
    dict_obj = zstd.ZstdCompressionDict(dict_bytes)
    dctx = zstd.ZstdDecompressor(dict_data=dict_obj)
    # Also create one without dict for comp_type == 3
    dctx_nodict = zstd.ZstdDecompressor()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_dir = OUTPUT_DIR / 'raw'
    raw_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nOpening root script.npk: {ROOT_NPK}")
    with ROOT_NPK.open('rb') as handle, mmap.mmap(handle.fileno(), 0, access=mmap.ACCESS_READ) as data:
        entries = parse_npk_entries(data)
        print(f"Parsed {len(entries)} entries")

        # Filter entries
        target_entries = entries
        if filter_pattern:
            target_entries = [e for e in entries if filter_pattern.lower() in e['name'].lower()]
            print(f"Filtered to {len(target_entries)} entries matching '{filter_pattern}'")

        if limit:
            target_entries = target_entries[:limit]

        success = 0
        fail_dict_mismatch = 0
        fail_other = 0
        fail_corrupt = 0
        skipped = 0
        results: list[dict[str, Any]] = []

        for i, entry in enumerate(target_entries):
            if i % 1000 == 0 and i > 0:
                print(f"  Progress: {i}/{len(target_entries)} (success={success}, fail={fail_dict_mismatch + fail_other + fail_corrupt})")

            name = entry['name']
            offset = entry['offset']
            zsize = entry['zsize']
            size = entry['size']
            comp_type = entry['comp_type']

            chunk = bytes(data[offset:offset + zsize])

            # Skip entries where stored == original (raw, no compression)
            if zsize == size:
                out_path = safe_path(raw_dir, name)
                out_path.parent.mkdir(parents=True, exist_ok=True)
                out_path.write_bytes(chunk)
                success += 1
                results.append({'name': name, 'status': 'raw', 'size': size})
                continue

            # Try decompression
            try:
                if comp_type == 3:
                    # Standard zstd without dictionary
                    decoded = dctx_nodict.decompress(chunk, max_output_size=size)
                elif comp_type == 10:
                    # Zstd with dictionary
                    decoded = dctx.decompress(chunk, max_output_size=size)
                else:
                    skipped += 1
                    results.append({'name': name, 'status': 'skipped', 'reason': f'comp_type={comp_type}'})
                    continue

                out_path = safe_path(raw_dir, name)
                out_path.parent.mkdir(parents=True, exist_ok=True)
                out_path.write_bytes(decoded)
                success += 1
                results.append({'name': name, 'status': 'ok', 'size': len(decoded)})

            except zstd.ZstdError as e:
                err_str = str(e)
                if 'Dictionary mismatch' in err_str:
                    fail_dict_mismatch += 1
                    results.append({'name': name, 'status': 'dict_mismatch'})
                elif 'Corrupted' in err_str or 'corrupted' in err_str:
                    fail_corrupt += 1
                    results.append({'name': name, 'status': 'corrupt', 'error': err_str})
                else:
                    fail_other += 1
                    results.append({'name': name, 'status': 'error', 'error': err_str})
            except Exception as e:
                fail_other += 1
                results.append({'name': name, 'status': 'error', 'error': str(e)})

    summary = {
        'total_attempted': len(target_entries),
        'success': success,
        'fail_dict_mismatch': fail_dict_mismatch,
        'fail_corrupt': fail_corrupt,
        'fail_other': fail_other,
        'skipped': skipped,
        'success_rate': f"{success / max(1, len(target_entries)) * 100:.1f}%",
    }

    # Write report
    report = {
        'summary': summary,
        'dict_size': len(dict_bytes),
        'target_dict_id': TARGET_DICT_ID,
        'filter': filter_pattern,
        'limit': limit,
        'sample_results': results[:100],  # First 100 for inspection
    }
    report_path = OUTPUT_DIR / 'extraction_report.json'
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f"\n{'='*60}")
    print(f"EXTRACTION RESULTS")
    print(f"{'='*60}")
    print(f"  Total attempted:      {len(target_entries)}")
    print(f"  Success:              {success}")
    print(f"  Dict mismatch:        {fail_dict_mismatch}")
    print(f"  Corrupt data:         {fail_corrupt}")
    print(f"  Other errors:         {fail_other}")
    print(f"  Skipped (comp_type):  {skipped}")
    print(f"  Success rate:         {summary['success_rate']}")
    print(f"\n  Report: {report_path}")
    print(f"  Output: {raw_dir}")

    return summary


def safe_path(root: Path, relative_name: str) -> Path:
    parts = [p for p in relative_name.replace('/', '\\').split('\\') if p not in ('', '.', '..')]
    return root.joinpath(*parts)


# ── Main ──

def main() -> int:
    parser = argparse.ArgumentParser(description="Train zstd dict from Documents archive, extract root script.npk")
    parser.add_argument('--train', action='store_true', help='Train dictionary from documents archive samples')
    parser.add_argument('--extract', action='store_true', help='Attempt extraction using trained dictionary')
    parser.add_argument('--limit', type=int, help='Only attempt first N entries during extraction')
    parser.add_argument('--filter', type=str, help='Only extract entries whose path contains this string')
    parser.add_argument('--dict-size', type=int, default=1024 * 1024, help='Dictionary size in bytes (default: 1MB)')
    parser.add_argument('--max-samples', type=int, default=5000, help='Max training samples to use')
    parser.add_argument('--dict-path', type=Path, default=DICT_OUTPUT, help='Path to save/load trained dictionary')
    parser.add_argument('--no-patch-id', action='store_true', help='Do not patch dictionary ID to target ID')
    args = parser.parse_args()

    if not args.train and not args.extract:
        parser.error("Specify --train, --extract, or both")

    dict_bytes: Optional[bytes] = None

    if args.train:
        samples = collect_training_samples(max_samples=args.max_samples)
        if not samples:
            print("ERROR: No training samples found")
            return 1

        dict_bytes = train_dictionary(samples, dict_size=args.dict_size)

        if not args.no_patch_id:
            dict_bytes = patch_dict_id(dict_bytes, TARGET_DICT_ID)

        args.dict_path.parent.mkdir(parents=True, exist_ok=True)
        args.dict_path.write_bytes(dict_bytes)
        print(f"Dictionary saved to: {args.dict_path}")

    if args.extract:
        if dict_bytes is None:
            if not args.dict_path.exists():
                print(f"ERROR: No trained dictionary found at {args.dict_path}")
                print("Run with --train first")
                return 1
            dict_bytes = args.dict_path.read_bytes()
            print(f"Loaded dictionary from {args.dict_path} ({len(dict_bytes)} bytes)")

        summary = attempt_extraction(
            dict_bytes,
            limit=args.limit,
            filter_pattern=args.filter,
        )

        if summary['success'] == 0 and summary['fail_dict_mismatch'] > 0:
            print("\n⚠ All entries failed with dictionary mismatch.")
            print("  The trained dictionary does not match the game's original dictionary.")
            print("  The real dictionary must be extracted from the game binary or another archive.")
            return 1

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
