"""
Shared configuration and utilities for OHMM NeoX/NPK extraction scripts.

Centralizes:
- Path resolution (relative to project root, overridable via env vars)
- NeoX/Zstd format constants
- Shared NPK parsing logic
- PYC raw string extraction
"""
from __future__ import annotations

import mmap
import os
import struct
from pathlib import Path
from typing import Any


# ── Path resolution ──
# All paths are relative to the project root (src/ohai/) by default.
# Override via environment variables for portability across machines.

def _project_root() -> Path:
    """Resolve the project root (src/ohai/) from this script's location."""
    return Path(__file__).resolve().parent.parent


PROJECT_ROOT = _project_root()

def _env_path(env_var: str, default: Path) -> Path:
    """Resolve a path from env var or use the default."""
    val = os.environ.get(env_var)
    return Path(val) if val else default


# Game installation path
GAME_ROOT = _env_path(
    "OHMM_GAME_ROOT",
    Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"))
    / "Steam" / "steamapps" / "common" / "Once Human",
)

# Extracted data paths (all under src/ohai/data/extracted/)
EXTRACTED_ROOT = PROJECT_ROOT / "data" / "extracted"
CORPUS_ROOT = _env_path("OHMM_CORPUS_ROOT", EXTRACTED_ROOT / "decompiled" / "root_script_dictrained" / "raw")
DOCUMENTS_CORPUS_ROOT = _env_path("OHMM_DOCUMENTS_CORPUS", EXTRACTED_ROOT / "decompiled" / "documents_script" / "raw")
MINING_OUTPUT_DIR = _env_path("OHMM_MINING_OUTPUT", EXTRACTED_ROOT / "mining_output")
STRUCTURED_OUTPUT_DIR = _env_path("OHMM_STRUCTURED_OUTPUT", EXTRACTED_ROOT / "structured")
DECOMPILED_SRC_DIR = _env_path("OHMM_DECOMPILED_SRC", EXTRACTED_ROOT / "decompiled_src")
DICT_PATH = _env_path("OHMM_DICT_PATH", EXTRACTED_ROOT / "decompiled" / "game_dict.zstd")

# Game file paths
ROOT_NPK_PATH = GAME_ROOT / "script.npk"
DOCUMENTS_NPK_PATH = GAME_ROOT / "Documents" / "script.npk"
EXE_PATH = GAME_ROOT / "ONCE_HUMAN.exe"


# ── NeoX / Zstd format constants ──

NEOX_MAGIC: int = 3496
"""NeoX custom Python bytecode magic number (0x0DA8)."""

NEOX_PYC_HEADER_SIZE: int = 16
"""NeoX .pyc header size: 4 magic + 4 flags + 4 timestamp + 4 source size."""

TARGET_DICT_ID: int = 1783285611
"""Zstd dictionary ID used by root script.npk (0x6A4AC76B)."""

ZSTD_DICT_MAGIC: bytes = b'\x37\xa4\x30\xec'
"""Zstd dictionary file magic bytes."""

DICT_OFFSET_IN_EXE: int = 0x4CA0EA0
"""Byte offset of the zstd dictionary inside ONCE_HUMAN.exe (discovered via scan)."""

DICT_SIZE_BYTES: int = 262144
"""Size of the extracted dictionary (256 KB, proven by decompression validation)."""

NPK_RECORD_SIZE: int = 0x1C
"""Size of one NPK index entry record (28 bytes)."""

PYC_MAX_BYTES: int = int(os.environ.get("OHMM_PYC_MAX_BYTES", "2000000"))
"""Maximum .pyc file size to analyze. Larger files are skipped to avoid marshal segfaults.
Override with OHMM_PYC_MAX_BYTES environment variable."""


# ── Shared NPK parsing ──

def parse_npk_names(data: bytes | mmap.mmap, files: int, names_off: int) -> list[str]:
    """Parse the NXFN name table from an NPK archive."""
    names_blob = data[names_off + 16:]
    names: list[str] = []
    current = bytearray()
    for byte in (names_blob[i] for i in range(len(names_blob))):
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
    """Parse all index entries from an NXPK archive.

    Returns a list of dicts with keys: index, name, offset, zsize, size, comp_type, misc2, misc3.
    """
    if data[:4] != b'NXPK':
        raise RuntimeError('Not an NXPK archive')
    files = struct.unpack_from('<I', data, 4)[0]
    entry_off = struct.unpack_from('<I', data, 0x14)[0]
    names_off = entry_off + files * NPK_RECORD_SIZE + 0x10
    names = parse_npk_names(data, files, names_off)
    entries: list[dict[str, Any]] = []
    for index, name in enumerate(names):
        rec_off = entry_off + index * NPK_RECORD_SIZE
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


# ── Shared PYC string extraction ──

def extract_strings_from_pyc(filepath: Path, min_len: int = 4, max_len: int = 500) -> list[str]:
    """Extract printable ASCII strings from a .pyc file (safe, no marshal).

    This avoids the segfault-prone marshal.loads path by scanning raw bytes
    for sequences of printable ASCII characters.
    """
    if not filepath.exists():
        return []
    data = filepath.read_bytes()
    return extract_strings_from_bytes(data, min_len=min_len, max_len=max_len)


def extract_strings_from_bytes(data: bytes, min_len: int = 4, max_len: int = 500) -> list[str]:
    """Extract printable ASCII strings from raw bytes."""
    strings: list[str] = []
    current = bytearray()
    for byte in data:
        if 32 <= byte < 127:
            current.append(byte)
        else:
            if len(current) >= min_len:
                s = bytes(current).decode('ascii')
                if len(s) <= max_len:
                    strings.append(s)
            current.clear()
    if len(current) >= min_len:
        s = bytes(current).decode('ascii')
        if len(s) <= max_len:
            strings.append(s)
    return strings


def safe_output_path(root: Path, relative_name: str) -> Path:
    """Construct a safe output path from a relative archive entry name."""
    parts = [p for p in relative_name.replace('/', '\\').split('\\') if p not in ('', '.', '..')]
    return root.joinpath(*parts)
