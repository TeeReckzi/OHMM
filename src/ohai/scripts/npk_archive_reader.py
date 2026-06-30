"""Standalone NeoX/NPK archive reader.

This adapts the portable parts of the pasted ``NPKFile`` implementation into a
project-local CLI. It reads NXPK/EXPK headers, index entries, optional name
tables, EXPK stream-XOR, and hash-mode-3 RC4 without depending on the original
``core.*`` package.
"""

from __future__ import annotations

import argparse
import io
import json
import struct
from dataclasses import asdict, dataclass
from enum import IntEnum
from pathlib import Path
from typing import Optional

from npk_decrypt_helpers import (
    CompressionType,
    DecryptionType,
    EXPKKeyGenerator,
    NPKEntry,
    NPKEntryDataFlags,
    decrypt_entry,
    decrypt_eggparty_index,
    decompress_payload,
    get_ext,
    get_file_category,
    get_zstd_frame_info,
    is_binary,
    unwrap_payload_layers,
)


class NPKFileType(IntEnum):
    NXPK = 1
    EXPK = 2


@dataclass
class NPKReadOptions:
    info_size: Optional[int] = None
    decryption_key: Optional[int] = None
    allow_eggparty_index_stub: bool = False


@dataclass
class NPKIndex:
    index: int
    file_signature: int
    file_offset: int
    file_length: int
    file_original_length: int
    zcrc: int
    crc: int
    zip_flag: int
    encrypt_flag: int
    filename: str
    file_structure: Optional[str] = None


@dataclass
class LoadedEntry:
    index: NPKIndex
    extension: str
    category: str
    encoding: str
    output: Optional[str]
    decoded_length: int
    length_matches: bool
    unwrap_layers: list[str]
    zstd_frame: Optional[dict[str, int]]
    error: Optional[str] = None


class RC4:
    """Tiny RC4 implementation used by hash_mode 3 archives."""

    def __init__(self, key: bytes):
        state = list(range(256))
        j = 0
        for i in range(256):
            j = (j + state[i] + key[i % len(key)]) & 0xFF
            state[i], state[j] = state[j], state[i]
        self.state = state
        self.i = 0
        self.j = 0

    def decrypt(self, data: bytes | bytearray) -> bytes:
        out = bytearray(data)
        state = self.state
        for n, value in enumerate(out):
            self.i = (self.i + 1) & 0xFF
            self.j = (self.j + state[self.i]) & 0xFF
            state[self.i], state[self.j] = state[self.j], state[self.i]
            k = state[(state[self.i] + state[self.j]) & 0xFF]
            out[n] = value ^ k
        return bytes(out)


def read_u16(buf: io.BufferedIOBase) -> int:
    return struct.unpack("<H", buf.read(2))[0]


def read_u32(buf: io.BufferedIOBase) -> int:
    return struct.unpack("<I", buf.read(4))[0]


def read_u64(buf: io.BufferedIOBase) -> int:
    return struct.unpack("<Q", buf.read(8))[0]


class NPKArchive:
    def __init__(self, path: Path, options: Optional[NPKReadOptions] = None):
        self.path = path
        self.options = options or NPKReadOptions()
        self.file_type = NPKFileType.NXPK
        self.file_count = 0
        self.var1 = 0
        self.encrypt_mode = 0
        self.hash_mode = 0
        self.index_offset = 0
        self.info_size = 0
        self.compact_index_flags = False
        self.nxfn_files: list[bytes] = []
        self.indices: list[NPKIndex] = []
        self._expk_keys: Optional[EXPKKeyGenerator] = None

        with self.path.open("rb") as file:
            self._read_header(file)
            self._read_indices(file)

    def _read_header(self, file: io.BufferedReader) -> None:
        magic = file.read(4)
        if magic == b"NXPK":
            self.file_type = NPKFileType.NXPK
        elif magic == b"EXPK":
            self.file_type = NPKFileType.EXPK
        else:
            raise ValueError(f"Not a valid NPK archive: {self.path}")

        self.file_count = read_u32(file)
        self.var1 = read_u32(file)
        self.encrypt_mode = read_u32(file)
        self.hash_mode = read_u32(file)
        self.index_offset = read_u32(file)
        self.info_size = self.options.info_size or self._determine_info_size(file)

        if self.hash_mode == 2:
            file.seek(self.index_offset + (self.file_count * self.info_size))
            self.nxfn_files = [item for item in file.read().split(b"\x00") if item]
        elif self.encrypt_mode == 256:
            file.seek(self.index_offset + (self.file_count * self.info_size) + 16)
            self.nxfn_files = [item for item in file.read().split(b"\x00") if item]
        else:
            self._read_nxfn_name_table(file)

    def _determine_info_size(self, file: io.BufferedReader) -> int:
        if self.encrypt_mode == 256 or self.hash_mode == 2:
            return 0x1C
        if self.var1 == 1:
            return 0x20

        current = file.tell()
        file.seek(0, 2)
        size = file.tell()
        file.seek(current)
        remaining = size - self.index_offset
        if self.file_count <= 0 or remaining <= 0:
            raise ValueError(f"Invalid index position/count for {self.path}")

        if remaining >= self.file_count * 28 + 16:
            file.seek(self.index_offset + (self.file_count * 28))
            if file.read(4) == b"NXFN":
                file.seek(current)
                self.compact_index_flags = True
                return 28
            file.seek(current)

        return remaining // self.file_count

    def _read_nxfn_name_table(self, file: io.BufferedReader) -> None:
        name_offset = self.index_offset + (self.file_count * self.info_size)
        file.seek(0, 2)
        size = file.tell()
        if name_offset + 16 > size:
            return

        file.seek(name_offset)
        if file.read(4) != b"NXFN":
            return

        reserved = read_u32(file)
        table_length_a = read_u32(file)
        table_length_b = read_u32(file)
        table_length = min(table_length_a, table_length_b, size - file.tell())
        if reserved != 0 or table_length <= 0:
            return

        raw_names = file.read(table_length)
        self.nxfn_files = [item for item in raw_names.split(b"\x00") if item]

    def _read_indices(self, file: io.BufferedReader) -> None:
        if self.var1 == 1:
            file.seek(-self.info_size * self.file_count, 2)
        else:
            file.seek(self.index_offset)
        index_data = file.read(self.file_count * self.info_size)

        if self.file_type == NPKFileType.EXPK:
            self._expk_keys = EXPKKeyGenerator()
            index_data = self._expk_keys.decrypt(index_data)
        if self.hash_mode == 3:
            index_data = RC4(b"61ea476e-8201-11e5-864b-fcaa147137b7").decrypt(index_data)
        if self.encrypt_mode == 3:
            if not self.options.allow_eggparty_index_stub:
                index_data = decrypt_eggparty_index(index_data)

        with io.BytesIO(index_data) as buf:
            for index in range(self.file_count):
                if self.info_size == 28:
                    signature = read_u32(buf)
                elif self.info_size == 32:
                    signature = read_u64(buf)
                else:
                    raise ValueError(f"Unsupported index entry size {self.info_size}")

                file_offset = read_u32(buf)
                file_length = read_u32(buf)
                original_length = read_u32(buf)
                zcrc = read_u32(buf)
                crc = read_u32(buf)
                if self.compact_index_flags:
                    compact_flags = read_u32(buf)
                    zip_flag = int(CompressionType.NONE)
                    encrypt_flag = int(DecryptionType.NONE)
                    if compact_flags in {int(CompressionType.ZLIB), int(CompressionType.LZ4), int(CompressionType.ZSTD)}:
                        zip_flag = compact_flags
                else:
                    zip_flag = read_u16(buf)
                    if zip_flag == 5:
                        zip_flag = int(CompressionType.LZ4)
                    encrypt_flag = read_u16(buf)
                    if encrypt_flag == 3:
                        encrypt_flag = DecryptionType.ADVANCED_XOR

                structure = self.nxfn_files[index] if index < len(self.nxfn_files) else None
                filename = f"0x{signature:x}"
                if structure:
                    try:
                        filename = structure.decode("utf-8")
                    except UnicodeDecodeError:
                        pass

                self.indices.append(NPKIndex(
                    index=index,
                    file_signature=signature,
                    file_offset=file_offset,
                    file_length=file_length,
                    file_original_length=original_length,
                    zcrc=zcrc,
                    crc=crc,
                    zip_flag=int(zip_flag),
                    encrypt_flag=int(encrypt_flag),
                    filename=filename,
                    file_structure=structure.decode("utf-8", "replace") if structure else None,
                ))

    def manifest(self) -> dict[str, object]:
        return {
            "path": str(self.path),
            "fileType": self.file_type.name,
            "fileCount": self.file_count,
            "var1": self.var1,
            "encryptMode": self.encrypt_mode,
            "hashMode": self.hash_mode,
            "indexOffset": self.index_offset,
            "infoSize": self.info_size,
            "compactIndexFlags": self.compact_index_flags,
            "nameCount": len(self.nxfn_files),
            "indices": [asdict(item) for item in self.indices],
        }

    def load_entry(self, index: int, out_dir: Optional[Path] = None) -> LoadedEntry:
        idx = self.indices[index]
        with self.path.open("rb") as file:
            file.seek(idx.file_offset)
            data = file.read(idx.file_length)

        if self.file_type == NPKFileType.EXPK:
            data = EXPKKeyGenerator().decrypt(data)

        if idx.encrypt_flag != int(DecryptionType.NONE):
            helper_entry = NPKEntry(
                data=data,
                file_length=idx.file_length,
                file_original_length=idx.file_original_length,
                crc=idx.crc,
                encrypt_flag=DecryptionType(idx.encrypt_flag),
                zip_flag=idx.zip_flag,
            )
            data = decrypt_entry(helper_entry, key=self.options.decryption_key)

        decoded, encoding, error = decompress_payload(data, idx.zip_flag, idx.file_original_length)
        zstd_frame = get_zstd_frame_info(data)
        decoded, unwrap_layers, unwrap_error = unwrap_payload_layers(decoded)
        if unwrap_layers:
            encoding = f"{encoding}+{'+'.join(unwrap_layers)}"
        if error is None:
            error = unwrap_error

        flags = NPKEntryDataFlags.TEXT if not is_binary(decoded) else NPKEntryDataFlags.NONE
        extension = get_ext(decoded, flags)
        category = get_file_category(extension).name.lower()
        output = None
        if out_dir is not None:
            out_dir.mkdir(parents=True, exist_ok=True)
            stem = idx.filename.replace("\\", "_").replace("/", "_").replace(":", "_")
            if not stem:
                stem = f"entry_{index:05d}.{extension}"
            elif not stem.lower().endswith(f".{extension.lower()}"):
                stem = f"{stem}.{extension}"
            path = out_dir / f"{index:05d}_{stem}"
            path.write_bytes(decoded)
            output = str(path)

        return LoadedEntry(
            index=idx,
            extension=extension,
            category=category,
            encoding=encoding,
            output=output,
            decoded_length=len(decoded),
            length_matches=len(decoded) == idx.file_original_length,
            unwrap_layers=unwrap_layers,
            zstd_frame=zstd_frame,
            error=error,
        )


def main() -> int:
    cli = argparse.ArgumentParser(description="List or sample-extract NeoX NXPK/EXPK archives.")
    cli.add_argument("npk", help="Path to .npk archive")
    cli.add_argument("--out", help="Write manifest JSON here")
    cli.add_argument("--extract-out", help="Directory for sampled entry payloads")
    cli.add_argument("--sample", type=int, default=0, help="Load/extract the first N entries")
    cli.add_argument("--info-size", type=int, choices=(28, 32), help="Override index entry size")
    cli.add_argument("--decryption-key", type=lambda value: int(value, 0), help="BASIC_XOR key")
    args = cli.parse_args()

    archive = NPKArchive(
        Path(args.npk).resolve(),
        NPKReadOptions(info_size=args.info_size, decryption_key=args.decryption_key),
    )
    manifest = archive.manifest()

    samples = []
    if args.sample:
        out_dir = Path(args.extract_out).resolve() if args.extract_out else None
        for index in range(min(args.sample, len(archive.indices))):
            samples.append(asdict(archive.load_entry(index, out_dir=out_dir)))
    manifest["samples"] = samples

    if args.out:
        out_path = Path(args.out).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({
        "fileType": manifest["fileType"],
        "fileCount": manifest["fileCount"],
        "infoSize": manifest["infoSize"],
        "nameCount": manifest["nameCount"],
        "samples": len(samples),
        "manifest": str(Path(args.out).resolve()) if args.out else None,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
