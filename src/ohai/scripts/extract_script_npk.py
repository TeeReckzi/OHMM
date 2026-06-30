"""Extract Once Human / NeoX script.npk entries using companion mapping files.

This handles the script archive layout observed in:
  NeoX_full/Documents/script.npk
  NeoX_full/Documents/index_mapping/script/Documents_script.npk.mapping

Mapping records are 36 bytes:
  u32 path/hash-ish id
  u32 payload offset
  u32 stored length
  u32 original length
  u32 crc/stored checksum
  u32 original checksum
  u32 flags
  u32 hash part A
  u32 hash part B

Observed flags:
  0x10000 = raw payload, often .pyc
  0x1000a = Zstandard-compressed payload
"""

from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path
from typing import Any, Optional

from bindict_parser import BindictParser
from npk_decrypt_helpers import (
    NPKEntryDataFlags,
    decompress_payload,
    get_ext,
    get_file_category,
    get_zstd_frame_info,
    is_binary,
    unwrap_payload_layers,
)


RECORD_SIZE = 36


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(_json_safe(k)): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    if isinstance(value, set):
        return [_json_safe(v) for v in sorted(value, key=lambda item: str(item))]
    if isinstance(value, bytes):
        return value.hex()
    return value


def read_mapping_records(mapping_path: Path) -> list[dict[str, int]]:
    data = mapping_path.read_bytes()
    if len(data) % RECORD_SIZE != 0:
        raise ValueError(f"Mapping size {len(data)} is not divisible by {RECORD_SIZE}")

    records = []
    for index in range(len(data) // RECORD_SIZE):
        values = struct.unpack_from("<9I", data, index * RECORD_SIZE)
        records.append({
            "index": index,
            "id": values[0],
            "offset": values[1],
            "storedLength": values[2],
            "originalLength": values[3],
            "crcStored": values[4],
            "crcOriginal": values[5],
            "flags": values[6],
            "hashA": values[7],
            "hashB": values[8],
        })
    return records


def decode_payload(blob: bytes, flags: int, original_length: int) -> tuple[bytes, str, list[str], Optional[str]]:
    zip_flag = flags & 0xFFFF
    decoded, encoding, decode_error = decompress_payload(blob, zip_flag, original_length)
    decoded, unwrap_layers, unwrap_error = unwrap_payload_layers(decoded)
    if unwrap_layers:
        encoding = f"{encoding}+{'+'.join(unwrap_layers)}"
    return decoded, encoding, unwrap_layers, decode_error or unwrap_error


def extract_script_npk(
    npk_path: Path,
    mapping_path: Path,
    output_dir: Path,
    limit: Optional[int] = None,
    parse_bindict: bool = False,
) -> dict[str, Any]:
    archive = npk_path.read_bytes()
    if archive[:4] != b"NXPK":
        raise ValueError(f"{npk_path} does not start with NXPK")

    declared_count = struct.unpack_from("<I", archive, 4)[0]
    records = read_mapping_records(mapping_path)
    if limit is not None:
        records = records[:limit]

    output_dir.mkdir(parents=True, exist_ok=True)
    files_dir = output_dir / "files"
    files_dir.mkdir(parents=True, exist_ok=True)
    bindict_dir = output_dir / "bindict_json"
    if parse_bindict:
        bindict_dir.mkdir(parents=True, exist_ok=True)

    bindict_parser = BindictParser()
    manifest_entries = []
    counts: dict[str, int] = {}

    for record in records:
        offset = record["offset"]
        stored_length = record["storedLength"]
        blob = archive[offset : offset + stored_length]
        decoded, encoding, unwrap_layers, decode_error = decode_payload(blob, record["flags"], record["originalLength"])
        zstd_frame = get_zstd_frame_info(blob)

        flags = NPKEntryDataFlags.TEXT if not is_binary(decoded) else NPKEntryDataFlags.NONE
        extension = get_ext(decoded, flags)
        category = get_file_category(extension)
        counts[extension] = counts.get(extension, 0) + 1

        file_name = f"{record['index']:05d}_{record['id']:08x}.{extension}"
        out_path = files_dir / file_name
        out_path.write_bytes(decoded)

        bindict_output = None
        if parse_bindict and extension == "pyc":
            parsed = bindict_parser.extract_from_pyc(decoded)
            if parsed:
                bindict_output = bindict_dir / f"{record['index']:05d}_{record['id']:08x}.json"
                bindict_output.write_text(json.dumps(_json_safe(parsed), ensure_ascii=False, indent=2), encoding="utf-8")

        manifest_entries.append({
            **record,
            "encoding": encoding,
            "decodeError": decode_error,
            "extension": extension,
            "category": category.name.lower(),
            "unwrapLayers": unwrap_layers,
            "zstdFrame": zstd_frame,
            "output": str(out_path),
            "bindictJson": str(bindict_output) if bindict_output else None,
            "decodedLength": len(decoded),
            "lengthMatches": len(decoded) == record["originalLength"],
        })

    manifest = {
        "npkPath": str(npk_path),
        "mappingPath": str(mapping_path),
        "declaredCount": declared_count,
        "mappingCount": len(read_mapping_records(mapping_path)),
        "extractedCount": len(manifest_entries),
        "extensionCounts": dict(sorted(counts.items())),
        "entries": manifest_entries,
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> int:
    cli = argparse.ArgumentParser(description="Extract script.npk payloads with a 36-byte NeoX mapping file.")
    cli.add_argument("--npk", required=True, help="Path to script.npk")
    cli.add_argument("--mapping", required=True, help="Path to Documents_script.npk.mapping")
    cli.add_argument("--out", required=True, help="Output directory")
    cli.add_argument("--limit", type=int, help="Only extract the first N entries")
    cli.add_argument("--parse-bindict", action="store_true", help="Parse decoded .pyc bindict payloads into JSON when possible")
    args = cli.parse_args()

    manifest = extract_script_npk(
        npk_path=Path(args.npk).resolve(),
        mapping_path=Path(args.mapping).resolve(),
        output_dir=Path(args.out).resolve(),
        limit=args.limit,
        parse_bindict=args.parse_bindict,
    )
    print(json.dumps({
        "extractedCount": manifest["extractedCount"],
        "declaredCount": manifest["declaredCount"],
        "extensionCounts": manifest["extensionCounts"],
        "manifest": str(Path(args.out).resolve() / "manifest.json"),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
