"""Scan game files for embedded zstd dictionaries.

Zstd dictionaries start with magic bytes 0x37 0xA4 0x30 0xEC followed by a u32 dict ID.
We scan for the magic + our target dict ID (1783285611 = 0x6A3F196B).

Also scans for the magic alone to find any embedded dictionaries.
"""

from __future__ import annotations

import mmap
import struct
import sys
import time
from pathlib import Path

from npk_config import TARGET_DICT_ID, ZSTD_DICT_MAGIC, GAME_ROOT

# Files to scan (large binaries, DLLs, other NPKs)
SCAN_PATTERNS = [
    '*.exe',
    '*.dll',
    '*.npk',
    '*.pak',
    '*.dat',
    '*.bin',
]

# Also scan specific known locations
SCAN_SUBDIRS = [
    '',  # root
    'Documents',
    'Binaries',
    'Binaries/Win64',
]


def scan_file_for_dict(filepath: Path, target_id: int = TARGET_DICT_ID) -> list[dict]:
    """Scan a file for zstd dictionary magic bytes."""
    results = []
    try:
        size = filepath.stat().st_size
        if size < 16:
            return []

        with filepath.open('rb') as f:
            with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as data:
                pos = 0
                while True:
                    pos = data.find(ZSTD_DICT_MAGIC, pos)
                    if pos == -1:
                        break

                    # Read dict ID at pos+4
                    if pos + 8 <= size:
                        dict_id = struct.unpack_from('<I', data, pos + 4)[0]
                        # Read some context around the find
                        context_start = max(0, pos - 16)
                        context_bytes = bytes(data[context_start:min(pos + 32, size)])

                        result = {
                            'file': str(filepath),
                            'offset': pos,
                            'dict_id': dict_id,
                            'is_target': dict_id == target_id,
                            'hex_offset': f'0x{pos:X}',
                            'context_hex': context_bytes.hex(),
                        }
                        results.append(result)

                        if dict_id == target_id:
                            # Found it! Try to determine dictionary size
                            # Scan forward for a reasonable dictionary size
                            # Typical zstd dicts are 32KB-1MB
                            print(f"  *** TARGET DICTIONARY FOUND at offset 0x{pos:X} in {filepath.name} ***")

                    pos += 4  # Continue searching

    except (PermissionError, OSError) as e:
        pass

    return results


def main() -> int:
    print(f"Scanning for zstd dictionary with ID {TARGET_DICT_ID} (0x{TARGET_DICT_ID:08X})")
    print(f"Game root: {GAME_ROOT}")
    print(f"Dict magic: {ZSTD_DICT_MAGIC.hex()}")
    print()

    all_results = []
    target_found = []
    files_scanned = 0
    t0 = time.time()

    # Collect files to scan
    files_to_scan: list[Path] = []

    # Direct pattern matches in root and subdirs
    for subdir in SCAN_SUBDIRS:
        search_dir = GAME_ROOT / subdir if subdir else GAME_ROOT
        if not search_dir.exists():
            continue
        for pattern in SCAN_PATTERNS:
            for f in search_dir.glob(pattern):
                if f.is_file() and f.stat().st_size > 1024:
                    files_to_scan.append(f)

    # Also scan any .npk files recursively
    for f in GAME_ROOT.rglob('*.npk'):
        if f not in files_to_scan:
            files_to_scan.append(f)

    # Scan Binaries recursively for DLLs/EXEs
    binaries_dir = GAME_ROOT / 'Binaries'
    if binaries_dir.exists():
        for f in binaries_dir.rglob('*'):
            if f.is_file() and f.suffix.lower() in ('.exe', '.dll', '.pyd', '.so') and f.stat().st_size > 1024:
                if f not in files_to_scan:
                    files_to_scan.append(f)

    # Deduplicate
    files_to_scan = sorted(set(files_to_scan), key=lambda p: str(p))
    print(f"Files to scan: {len(files_to_scan)}")
    print()

    for filepath in files_to_scan:
        files_scanned += 1
        rel = filepath.relative_to(GAME_ROOT) if filepath.is_relative_to(GAME_ROOT) else filepath
        size_mb = filepath.stat().st_size / 1024 / 1024

        if files_scanned % 50 == 0:
            print(f"  Scanning... {files_scanned}/{len(files_to_scan)} ({time.time() - t0:.0f}s elapsed)")

        results = scan_file_for_dict(filepath)
        if results:
            for r in results:
                all_results.append(r)
                marker = " *** TARGET ***" if r['is_target'] else ""
                print(f"  Found dict magic in {rel} at 0x{r['offset']:X} — dict_id={r['dict_id']} (0x{r['dict_id']:08X}){marker}")
                if r['is_target']:
                    target_found.append(r)

    elapsed = time.time() - t0
    print(f"\n{'='*60}")
    print(f"SCAN COMPLETE — {elapsed:.1f}s")
    print(f"{'='*60}")
    print(f"  Files scanned: {files_scanned}")
    print(f"  Dict magic occurrences: {len(all_results)}")
    print(f"  Target dict (ID={TARGET_DICT_ID}): {len(target_found)} occurrence(s)")

    if target_found:
        print(f"\n  TARGET DICTIONARY LOCATIONS:")
        for r in target_found:
            print(f"    {r['file']} @ offset 0x{r['offset']:X}")
    else:
        print(f"\n  Target dictionary NOT found in scanned files.")
        if all_results:
            print(f"  Other dict IDs found:")
            seen_ids = set()
            for r in all_results:
                if r['dict_id'] not in seen_ids:
                    seen_ids.add(r['dict_id'])
                    print(f"    ID={r['dict_id']} (0x{r['dict_id']:08X}) in {Path(r['file']).name} @ 0x{r['offset']:X}")

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
