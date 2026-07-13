"""Extract the zstd dictionary from ONCE_HUMAN.exe at the discovered offset.

The dictionary was found at offset 0x4CA0EA0 with dict ID 1783285611.
Zstd dictionaries have:
  - Magic: 37 A4 30 EC (4 bytes)
  - Dict ID: u32 LE (4 bytes)
  - Content: variable length

We need to determine where the dictionary ends. Strategy:
1. Read from the magic offset
2. Try progressively larger chunks until zstd accepts it as a valid dictionary
3. Validate by attempting to decompress a known entry from script.npk
"""

from __future__ import annotations

import mmap
import struct
import sys
import time
from pathlib import Path

import zstandard as zstd

EXE_PATH = Path(r"C:\Program Files (x86)\Steam\steamapps\common\Once Human\ONCE_HUMAN.exe")
DICT_OFFSET = 0x4CA0EA0
TARGET_DICT_ID = 1783285611
ROOT_NPK = Path(r"C:\Program Files (x86)\Steam\steamapps\common\Once Human\script.npk")
OUTPUT_DICT = Path(r"C:\Users\tyr3x\Downloads\OHMM\OHMM\src\ohai\data\extracted\decompiled\game_dict.zstd")

# Known sizes to try (zstd dicts are typically 32KB-256KB in games)
CANDIDATE_SIZES = [
    16 * 1024,      # 16 KB
    32 * 1024,      # 32 KB
    64 * 1024,      # 64 KB
    96 * 1024,      # 96 KB
    112 * 1024,     # 112 KB
    128 * 1024,     # 128 KB
    160 * 1024,     # 160 KB
    192 * 1024,     # 192 KB
    224 * 1024,     # 224 KB
    256 * 1024,     # 256 KB
    384 * 1024,     # 384 KB
    512 * 1024,     # 512 KB
    768 * 1024,     # 768 KB
    1024 * 1024,    # 1 MB
]

RECORD_SIZE = 0x1C


def parse_npk_first_entries(npk_path: Path, count: int = 20) -> list[dict]:
    """Parse first N entries from root script.npk for validation."""
    with npk_path.open('rb') as f:
        with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as data:
            if data[:4] != b'NXPK':
                raise RuntimeError('Not NXPK')
            files = struct.unpack_from('<I', data, 4)[0]
            entry_off = struct.unpack_from('<I', data, 0x14)[0]

            entries = []
            for i in range(min(count, files)):
                rec_off = entry_off + i * RECORD_SIZE
                misc1, offset, zsize, size, misc2, misc3, comp_type = struct.unpack_from('<7I', data, rec_off)
                if comp_type == 10 and zsize != size:
                    chunk = bytes(data[offset:offset + zsize])
                    entries.append({
                        'index': i,
                        'offset': offset,
                        'zsize': zsize,
                        'size': size,
                        'comp_type': comp_type,
                        'data': chunk,
                    })
            return entries


def try_decompress_with_dict(dict_bytes: bytes, test_entries: list[dict]) -> tuple[int, int]:
    """Try to decompress test entries with given dictionary. Returns (success, total)."""
    try:
        dict_obj = zstd.ZstdCompressionDict(dict_bytes)
        dctx = zstd.ZstdDecompressor(dict_data=dict_obj)
    except Exception as e:
        return 0, len(test_entries)

    success = 0
    for entry in test_entries:
        try:
            decoded = dctx.decompress(entry['data'], max_output_size=entry['size'])
            if len(decoded) == entry['size']:
                success += 1
        except Exception:
            pass

    return success, len(test_entries)


def find_dict_boundary(exe_data: mmap.mmap, start_offset: int, test_entries: list[dict]) -> tuple[int, bytes]:
    """Find the correct dictionary size by looking for the next dictionary or section boundary."""

    # First approach: look for the next zstd dict magic after our dictionary
    # The scan showed dict at 0x4CA0EA0, previous dicts at 0x4C60EA0 (spacing ~0x40000 = 256KB)
    # and 0x4C456A0, 0x4C056A0. Let's check the spacing pattern.

    print(f"Dictionary starts at offset 0x{start_offset:X}")

    # Check what comes after in the exe - look for next section markers
    # Try sizes based on the spacing between known dictionaries
    # 0x4C056A0 -> 0x4C456A0 = 0x40000 (256KB)
    # 0x4C456A0 -> 0x4C60EA0 = 0x1B800 (~110KB)
    # 0x4C60EA0 -> 0x4CA0EA0 = 0x40000 (256KB)

    # The dictionary at 0x4CA0EA0 is likely 256KB (0x40000) based on spacing
    # Let's try that first, then binary search

    # Also: look for the next magic or null region
    best_size = 0
    best_success = 0

    for candidate_size in CANDIDATE_SIZES:
        if start_offset + candidate_size > len(exe_data):
            break

        dict_bytes = bytes(exe_data[start_offset:start_offset + candidate_size])

        # Verify it starts with the magic
        if dict_bytes[:4] != b'\x37\xa4\x30\xec':
            print(f"  ERROR: Data at offset doesn't start with dict magic!")
            return 0, b''

        success, total = try_decompress_with_dict(dict_bytes, test_entries)
        print(f"  Size {candidate_size // 1024:>4d} KB: {success}/{total} entries decompressed")

        if success > best_success:
            best_success = success
            best_size = candidate_size

        if success == total:
            print(f"  *** PERFECT MATCH at {candidate_size // 1024} KB ***")
            return candidate_size, dict_bytes

    # If we found a partial match, try to refine
    if best_success > 0 and best_size > 0:
        print(f"\n  Best so far: {best_size // 1024} KB with {best_success} successes. Refining...")
        # Try sizes around the best
        for delta in range(-8192, 8193, 1024):
            refined_size = best_size + delta
            if refined_size <= 0 or start_offset + refined_size > len(exe_data):
                continue
            dict_bytes = bytes(exe_data[start_offset:start_offset + refined_size])
            success, total = try_decompress_with_dict(dict_bytes, test_entries)
            if success > best_success:
                best_success = success
                best_size = refined_size
                print(f"    Refined: {refined_size} bytes → {success}/{total}")
                if success == total:
                    return best_size, dict_bytes

    if best_size > 0:
        return best_size, bytes(exe_data[start_offset:start_offset + best_size])

    return 0, b''


def main() -> int:
    print(f"Extracting zstd dictionary from {EXE_PATH.name}")
    print(f"Offset: 0x{DICT_OFFSET:X}")
    print(f"Target dict ID: {TARGET_DICT_ID}")
    print()

    # Get test entries from root script.npk
    print("Loading test entries from root script.npk...")
    test_entries = parse_npk_first_entries(ROOT_NPK, count=50)
    print(f"  Got {len(test_entries)} comp_type=10 entries for validation")
    print()

    # Open the exe and extract
    print(f"Opening {EXE_PATH.name} ({EXE_PATH.stat().st_size / 1024 / 1024:.0f} MB)...")
    with EXE_PATH.open('rb') as f:
        with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as exe_data:
            # Verify magic at offset
            magic = bytes(exe_data[DICT_OFFSET:DICT_OFFSET + 4])
            dict_id = struct.unpack_from('<I', exe_data, DICT_OFFSET + 4)[0]
            print(f"  Magic at offset: {magic.hex()} (expected: 37a430ec)")
            print(f"  Dict ID: {dict_id} (expected: {TARGET_DICT_ID})")

            if magic != b'\x37\xa4\x30\xec' or dict_id != TARGET_DICT_ID:
                print("ERROR: Magic/ID mismatch at expected offset!")
                return 1

            print(f"\n  Confirmed! Searching for dictionary boundary...\n")

            dict_size, dict_bytes = find_dict_boundary(exe_data, DICT_OFFSET, test_entries)

    if dict_size == 0:
        print("\nFailed to determine dictionary size.")
        return 1

    print(f"\nDictionary size: {dict_size} bytes ({dict_size // 1024} KB)")

    # Save dictionary
    OUTPUT_DICT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_DICT.write_bytes(dict_bytes)
    print(f"Saved to: {OUTPUT_DICT}")

    # Final validation
    print("\nFinal validation with full test set...")
    success, total = try_decompress_with_dict(dict_bytes, test_entries)
    print(f"  Result: {success}/{total} entries successfully decompressed")

    if success > 0:
        print(f"\n✓ Dictionary extraction successful! Use this dict to extract the full root script.npk.")
    else:
        print(f"\n✗ Dictionary extraction failed — could not decompress any entries.")

    return 0 if success > 0 else 1


if __name__ == '__main__':
    raise SystemExit(main())
