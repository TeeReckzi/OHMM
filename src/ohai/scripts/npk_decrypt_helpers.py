"""NPK decryption helpers for recovered NeoX / NetEase archive entries.

This is a standalone project-local adaptation of the wuqu223 snippet pasted into
the Codex thread on 2026-06-28. It intentionally avoids importing the original
`core.*` package so it can be used in OHMM recovery scripts.

The Eggy Party index routine still requires the external `decrypt_mode3_block`
implementation; only the round-key wrapper was present in the pasted source.
"""

from __future__ import annotations

import argparse
import json
import struct
import zlib
from dataclasses import dataclass
from enum import IntEnum, IntFlag
from pathlib import Path
from typing import Callable, Optional, Union

import zstandard as zstd

MASK32 = 0xFFFFFFFF
ZSTD_MAGIC_NUMBER = 0xFD2FB528
ONCE_HUMAN_ZSTD_DICT_ID = 0x6A4AC76B


class Rotor:
    """Rotor cipher used by some NeoX ROTOR-packed payloads."""

    def __init__(self, key: str, n_rotors: int = 6):
        self.n_rotors = n_rotors
        self.key = key
        self.rotors: tuple = ()
        self.positions: list[Optional[list[int]]] = [None, None]

    def encrypt(self, buf: bytes) -> bytes:
        self.positions[0] = None
        return self.cryptmore(buf, False)

    def decrypt(self, buf: bytes) -> bytes:
        self.positions[1] = None
        return self.cryptmore(buf, True)

    def cryptmore(self, buf: bytes, do_decrypt: bool) -> bytes:
        size, nr, rotors, pos = self.get_rotors(do_decrypt)
        outbuf = bytearray()
        for value in buf:
            c = value
            if do_decrypt:
                for i in range(nr - 1, -1, -1):
                    c = pos[i] ^ rotors[i][c]
            else:
                for i in range(nr):
                    c = rotors[i][c ^ pos[i]]
            outbuf.append(c)

            pnew = 0
            for i in range(nr):
                pnew = ((pos[i] + (pnew >= size)) & 0xFF) + rotors[i][size]
                pos[i] = pnew % size

        return bytes(outbuf)

    def get_rotors(self, do_decrypt: bool) -> tuple[int, int, tuple[tuple[int, ...], ...], list[int]]:
        nr = self.n_rotors
        rotors = self.rotors
        positions = self.positions[int(do_decrypt)]

        if positions is None:
            if rotors:
                positions = list(rotors[3])
            else:
                size = 256
                id_rotor = list(range(size + 1))
                rand = self.random_func(self.key)
                encrypt_rotors: list[tuple[int, ...]] = []
                decrypt_rotors: list[tuple[int, ...]] = []
                positions = []
                for _ in range(nr):
                    i = size
                    positions.append(rand(i))
                    erotor = id_rotor[:]
                    drotor = id_rotor[:]
                    drotor[i] = erotor[i] = 1 + 2 * rand(i // 2)
                    while i > 1:
                        r = rand(i)
                        i -= 1
                        er = erotor[r]
                        erotor[r] = erotor[i]
                        erotor[i] = er
                        drotor[er] = i
                    drotor[erotor[0]] = 0
                    encrypt_rotors.append(tuple(erotor))
                    decrypt_rotors.append(tuple(drotor))
                self.rotors = rotors = (tuple(encrypt_rotors), tuple(decrypt_rotors), size, tuple(positions))
            self.positions[int(do_decrypt)] = positions
        return rotors[2], nr, rotors[int(do_decrypt)], positions

    def random_func(self, key: str):
        mask = 0xFFFF
        x = 995
        y = 576
        z = 767
        for char in map(ord, key):
            x = ((x << 3 | x >> 13) + char) & mask
            y = ((y << 3 | y >> 13) ^ char) & mask
            z = ((z << 3 | z >> 13) - char) & mask

        maxpos = mask >> 1
        mask += 1
        if x > maxpos:
            x -= mask
        if y > maxpos:
            y -= mask
        if z > maxpos:
            z -= mask

        y |= 1
        x = 171 * (int(x) % 177) - 2 * (int(x) // 177)
        y = 172 * (int(y) % 176) - 35 * (int(y) // 176)
        z = 170 * (int(z) % 178) - 63 * (int(z) // 178)
        if x < 0:
            x += 30269
        if y < 0:
            y += 30307
        if z < 0:
            z += 30323

        def rand(n: int, seed: list[tuple[int, int, int]] = [(x, y, z)]) -> int:
            sx, sy, sz = seed[0]
            seed[0] = ((171 * sx) % 30269, (172 * sy) % 30307, (170 * sz) % 30323)
            return int((sx / 30269 + sy / 30307 + sz / 30323) * n) % n

        return rand


class DecryptionType(IntEnum):
    """Known NPK entry decryption modes."""

    NONE = 0
    BASIC_XOR = 1
    ADVANCED_XOR = 2
    INCREMENTAL_XOR = 3


class CompressionType(IntEnum):
    """Known NPK entry compression modes."""

    NONE = 0
    ZLIB = 1
    LZ4 = 2
    ZSTD = 10


class NPKEntryDataFlags(IntFlag):
    """Minimal flags used by this standalone helper."""

    NONE = 0
    ENCRYPTED = 1 << 0
    TEXT = 1 << 1


class NPKEntryFileCategory(IntEnum):
    """Coarse recovered asset categories."""

    OTHER = 0
    TEXTURE = 1
    MESH = 2
    BANK = 3
    XML = 4
    CSB = 5


def mesh_hash(text: str) -> int:
    """Default NPK mesh/path hashing algorithm reimplemented by aexadev."""
    raw = text.encode("ascii", "ignore")
    length = (len(raw) + 3) >> 2
    padded = raw + b"\x00" * (length * 4 - len(raw))

    data = list(struct.unpack("<" + "I" * length, padded))
    data += [0x9BE74448, 0x66F42C48]
    hash_ = 0xF4FA8928
    state = 0x37A8470E
    tweak = 0x7758B42B

    for chunk in data:
        e = 0x267B0B11
        hash_ = ((hash_ << 1) | (hash_ >> 31)) & MASK32
        e ^= hash_

        a = chunk & MASK32
        state ^= a
        tweak ^= a

        b = ((e + tweak) | 0x02040801) & 0xBFEF7FDF
        f = (b * state) & 0xFFFFFFFFFFFFFFFF
        a = f & MASK32
        b = f >> 32
        if b:
            a = (a + 1) & MASK32

        f = (a + b) & 0xFFFFFFFFFFFFFFFF
        a = f & MASK32
        g = f >> 32
        if g:
            a = (a + 1) & MASK32

        b = ((e + state) | 0x00804021) & 0x7DFEFBFF
        state = a
        f = (tweak * b) & 0xFFFFFFFFFFFFFFFF
        a = f & MASK32
        b = f >> 32

        f = (b + b) & 0xFFFFFFFFFFFFFFFF
        b = f & MASK32
        g = f >> 32
        if g:
            a = (a + 1) & MASK32

        f = (a + b) & 0xFFFFFFFFFFFFFFFF
        a = f & MASK32
        g = f >> 32
        if g:
            a = (a + 2) & MASK32

        tweak = a

    return (state ^ tweak) & MASK32


def is_binary(data: bytes) -> bool:
    """Return True when a payload looks binary rather than UTF-8 text."""
    if b"\x00" in data[:4000]:
        return True
    try:
        data[:2048].decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return True
    return False


def _get_binary_ext(data: bytes, flags: NPKEntryDataFlags) -> Optional[str]:
    """Detect common NeoX/NPK binary file signatures."""
    if data[:4] in (
        bytes([0xA8, 0x0D, 0x0D, 0x0A]),
        bytes([0xA7, 0x0D, 0x0D, 0x0A]),
        bytes([0xCB, 0x0D, 0x0D, 0x0A]),
        bytes([0x03, 0xF3, 0x0D, 0x0A]),
        bytes([0xE3, 0x00, 0x00, 0x00]),
        bytes([0x63, 0x00, 0x00, 0x00]),
        bytes([0x4C, 0x0F, 0x00, 0x00]),
        bytes([0x27, 0xE3, 0x00, 0x01]),
    ):
        return "pyc"
    if data[:4] == bytes([0x13, 0xAB, 0xA1, 0x5C]):
        return "astc"
    if data[:3] == b"PVR":
        return "pvr"
    if data[:4] == bytes([0x34, 0x80, 0xC8, 0xBB]):
        return "mesh"
    if data[:3] == b"DDS":
        return "dds"
    if data[1:4] == b"KTX":
        return "ktx"
    if data[:4] == b"RIFF":
        if b"FEV" in data:
            return "fev"
        if b"WAVE" in data:
            return "wem"
    if data[0x34:0x3B] == b"2.1.0.0" or data[:8] == bytes([0x38, 0x00, 0x00, 0x00, 0x34, 0x00, 0x64, 0x00]):
        return "csb"
    if data[4:8] == b"ftyp":
        return "mp4"
    if data[:6] == bytes([0x01, 0x00, 0x05, 0x00, 0x00, 0x00]):
        return "foliage"
    if data[:8] == b"NEOXMESH":
        return "uimesh"
    if data[-18:-2] == b"TRUEVISION-XFILE" or data[:3] in (bytes([0x00, 0x00, 0x02]), bytes([0x0D, 0x00, 0x02])):
        return "tga"
    if data[:4] == b"NFXO":
        return "nfx"
    if data[:4] == bytes([0xC1, 0x59, 0x41, 0x0D]):
        if b"Material" in data:
            return "mtg"
        if b"SubMesh" in data:
            return "gim"
        if b"Anim" in data:
            return "ags"
        return "unknown1"
    if data[:8] == b"RAWANIMA":
        return "cpdanimation"
    if data[:8] == b"NEOXBIN1":
        return "uiprefab"
    if data[:8] == b"SKELETON":
        return "skeleton"
    if data[:8] == b"CompBlks":
        return "cbk"
    if data[:2] == b"BM":
        return "bmp"
    if data[:9] == b"blastmesh":
        return "blastmesh"
    if data[:33] == b"NVidia(r) GameWorks Blast(tm) v.1":
        return "blast"
    if data[:12] == b"CocosStudio-UI":
        return "coc"
    if data[:3] == b"hit":
        return "hit"
    if data[:3] == b"PKM":
        return "pkm"
    if data[:10] == b"clothasset":
        return "clothasset"
    if data[1:4] == b"PNG":
        return "png"
    if data[:4] == b"FSB5":
        return "fsb"
    if data[:4] == b"VANT":
        return "vant"
    if data[:4] == b"MDMP":
        return "mdmp"
    if data[:4] == b"RGIS":
        return "gis"
    if data[:4] == b"NTRK":
        return "trk"
    if data[:4] == b"OggS":
        return "ogg"
    if data[:4] == bytes([0xFF, 0xD8, 0xFF, 0xE1]):
        return "jpg"
    if data[:4] == b"BKHD":
        return "bnk"
    if data[:4] == b"8BPS":
        return "psd"
    if data[:4] == b"#HLB":
        return "hlb"
    if data[:4] == b"NXBI":
        return "npse"
    if data[:4] == b"NSXC":
        return "nsxc"
    if data[:4] == b"TZif":
        return "tzif"
    if data[6:10] == b"JFIF":
        return "jfif"
    if data[0x3B:0x40] == bytes([0xC5, 0x00, 0x00, 0x80, 0x3F]):
        return "slpb"
    if bytes([0x00, 0x00, 0x00, 0x00, 0x00, 0x55, 0x55]) in data:
        return "animation"
    return None


def _get_text_ext(data: bytes, flags: NPKEntryDataFlags) -> Optional[str]:
    """Detect common NeoX/NPK text and XML-ish signatures."""
    if data[:18] == b"from typing import ":
        return "pyi"
    if data[:27] == b"-----BEING PUBLIC KEY-----":
        return "pem"
    if len(data) >= 100_000_000:
        return None
    checks: list[tuple[bytes, str]] = [
        (b"<Material", "mtl"),
        (b'"ctype": "', "cjson"),
        (b"<MaterialGroup", "mtg"),
        (b"<MetaInfo", "pvr.meta"),
        (b"<Section", "sec"),
        (b"<SubMesh", "gim"),
        (b"<FxGroup", "sfx"),
        (b'"AssetType" : "Animation"', "animation"),
        (b"<Track", "trackgroup"),
        (b"<Instances", "decal"),
        (b"<Physics", "col"),
        (b'Type="Animation"', "animation"),
        (b"DisableBakeLightProbe=", "prefab"),
        (b"<Scene", "scn"),
        (b'"ParticleSystemTemplate"', "pse"),
        (b"<MainBody", "nxcompute"),
        (b"<MapSkeletonToMeshBone", "skeletonextra"),
        (b"<ShadingModel", "nxshader"),
        (b"<BlastDynamic", "blt"),
        (b'"ParticleAudio"', "psemusic"),
        (b"<AnimationConfig", "animconfig"),
        (b"<AnimationGraph", "animgraph"),
        (b'<Head Type="Timeline"', "timeline"),
        (b"<Chain", "physicalbone"),
        (b"<PostProcess", "postprocess"),
        (b'"mesh_import_options":{', "nxmeta"),
        (b"<SceneConfig", "scnex"),
        (b"<LocalPoints", "localweather"),
        (b'GeoBatchHint="0"', "gimext"),
        (b'"AssetType":"HapticsData"', "haptic"),
        (b"<LocalFogParams", "localfogparams"),
        (b'"ReferenceSkeleton', "featureschema"),
        (b"<Relationships", "xml.rels"),
        (b"<Waterfall", "waterfall"),
        (b'"ReferenceSkeletonPath"', "mirrortable"),
        (b"<ClothAsset", "clt"),
        (b"<plist", "plist"),
        (b"<SkeletonRig", "skeletonrig"),
        (b"<ShaderCache", "cache"),
        (b"<AllCaches", "info"),
        (b"<AllPreloadCaches", "list"),
        (b"<Remove_Files", "map"),
        (b'<HLSL File="', "md5"),
        (b"<EnvParticle", "envp"),
        (b"<TextureGroup", "txg"),
        (b"?xml", "xml"),
        (b'"AssetType" : "Skeleton"', "skeleton"),
        (b'"Type" : "NewSpringAnimData"', "stb"),
    ]
    if b"SHEX" in data and b"OSGN" in data:
        return "binary"
    if b"<LODPolicy" in data or b"<LODProfile" in data:
        return "lod"
    if b"<Audios" in data or b"<AudioSource" in data:
        return "prefabaudio"
    if b"<ShaderCompositor" in data or b"<ShaderFeature" in data or b"<ShaderIndexes" in data or b"<RenderTrigger" in data:
        return "render"
    if b"format: " in data and b"filter: " in data:
        return "atlas"
    if b"char" in data and b"width=" in data and b"height=" in data:
        return "fnt"
    if b"<BlendSpace" in data:
        return "blendspace1d" if b'is2D="false"' in data else "blendspace"
    for needle, extension in checks:
        if needle in data:
            return extension
    return None


def get_ext(data: bytes, flags: NPKEntryDataFlags = NPKEntryDataFlags.NONE) -> str:
    """Return the likely extension for a recovered NPK payload."""
    if len(data) == 0:
        return "empty"
    if flags & NPKEntryDataFlags.TEXT:
        return _get_text_ext(data, flags) or "dat"
    return _get_binary_ext(data, flags) or _get_text_ext(data, flags) or "dat"


def get_file_category(extension: str) -> NPKEntryFileCategory:
    """Categorize a recovered file by extension."""
    extension = extension.lower()
    if extension in {
        "bmp", "gif", "jpg", "jpeg", "png", "pbm", "pgm", "ppm", "xbm", "xpm", "tga", "ico", "tiff",
        "dds", "pvr", "astc", "ktx", "ktx_low", "cbk", "psd",
    }:
        return NPKEntryFileCategory.TEXTURE
    if extension in {"mesh"}:
        return NPKEntryFileCategory.MESH
    if extension in {"bnk"}:
        return NPKEntryFileCategory.BANK
    if extension in {"gim", "mtg", "ags", "unknown1"}:
        return NPKEntryFileCategory.XML
    if extension in {"csb"}:
        return NPKEntryFileCategory.CSB
    return NPKEntryFileCategory.OTHER


@dataclass
class NPKEntry:
    """Minimal NPK entry shape required by decrypt_entry."""

    data: bytes
    file_length: int
    file_original_length: int
    crc: int
    encrypt_flag: DecryptionType
    data_flags: NPKEntryDataFlags = NPKEntryDataFlags.NONE
    zip_flag: int = int(CompressionType.NONE)


def decompress_entry(entry: NPKEntry) -> bytes:
    """Decompress an NPK entry by its zip flag."""

    if entry.zip_flag == int(CompressionType.ZLIB):
        return zlib.decompress(entry.data, bufsize=entry.file_original_length)

    if entry.zip_flag == int(CompressionType.LZ4):
        try:
            import lz4.block  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError("lz4.block is required to decompress LZ4 NPK entries") from exc
        return lz4.block.decompress(entry.data, uncompressed_size=entry.file_original_length)

    if entry.zip_flag == int(CompressionType.ZSTD):
        return zstd.ZstdDecompressor().decompress(entry.data, max_output_size=entry.file_original_length)

    if entry.data.startswith(b"\x28\xb5\x2f\xfd"):
        return zstd.ZstdDecompressor().decompress(entry.data, max_output_size=entry.file_original_length)

    return entry.data


def strip_none_wrapper(data: bytes) -> bytes:
    """Strip a simple NONE wrapper header if present."""
    if data[:4] == b"NONE":
        return data[4:]
    return data


def strip_enon_wrapper(data: bytes) -> bytes:
    """Strip a simple ENON wrapper header if present."""
    if data[:4] == b"ENON":
        return data[4:]
    return data


def check_dtsz(data: bytes) -> bool:
    """Check for DTSZ, a 4-byte wrapper before a Zstd frame."""
    return len(data) >= 8 and data[:4] == b"DTSZ" and data[4:8] == b"\x28\xb5\x2f\xfd"


def unpack_dtsz(data: bytes) -> bytes:
    """Unpack a DTSZ-wrapped Zstd frame."""
    if not check_dtsz(data):
        return data
    return zstd.ZstdDecompressor().decompress(data[4:])


def check_lz4_like(data: bytes) -> bool:
    """Check for the custom LZ4-like stream seen in some payloads."""
    return len(data) >= 4 and data[:4] == b"\x27\xe3\x00\x01"


def unpack_lz4_like(data: bytes) -> bytes:
    """Decode the custom LZ4-like stream used by some payloads."""
    if not data:
        return b""

    in_ptr = 0
    out_buf = bytearray()
    data_len = len(data)

    while in_ptr < data_len:
        token = data[in_ptr]
        in_ptr += 1

        literal_len = token >> 4
        match_len = token & 0x0F

        if literal_len == 15:
            while in_ptr < data_len:
                byte_val = data[in_ptr]
                in_ptr += 1
                literal_len += byte_val
                if byte_val != 0xFF:
                    break

        if in_ptr + literal_len > data_len:
            break

        out_buf.extend(data[in_ptr : in_ptr + literal_len])
        in_ptr += literal_len

        if in_ptr >= data_len:
            break
        if in_ptr + 2 > data_len:
            break

        offset = struct.unpack("<H", data[in_ptr : in_ptr + 2])[0]
        in_ptr += 2

        if match_len == 15:
            while in_ptr < data_len:
                byte_val = data[in_ptr]
                in_ptr += 1
                match_len += byte_val
                if byte_val != 0xFF:
                    break

        match_len += 4
        start_pos = len(out_buf) - offset
        if start_pos < 0:
            break

        for i in range(match_len):
            if start_pos + i >= len(out_buf):
                break
            out_buf.append(out_buf[start_pos + i])

    return bytes(out_buf)


def check_stzb(data: bytes) -> bool:
    return data[:4] == b"STZB"


def unpack_stzb(data: bytes) -> bytes:
    """Unpack STZB encrypted data using the pasted XOR key."""
    if data[:4] != b"STZB":
        return data

    encrypted_len = struct.unpack("<I", data[12:16])[0]
    xor_key = b"\x8e\x50\x9f\xe8\x59\x67\x91\xfb"
    encrypted_data = data[16 : 16 + encrypted_len]
    return bytes(byte ^ xor_key[i % len(xor_key)] for i, byte in enumerate(encrypted_data))


def init_rotor() -> Rotor:
    """Initialize the fixed-key ROTOR instance used by NeoXtractor."""
    asdf_dn = "j2h56ogodh3se"
    asdf_dt = "=dziaq."
    asdf_df = '|os=5v7!"-234'
    asdf_tm = (
        asdf_dn * 4
        + (asdf_dt + asdf_dn + asdf_df) * 5
        + "!"
        + "#"
        + asdf_dt * 7
        + asdf_df * 2
        + "*"
        + "&"
        + "'"
    )
    return Rotor(asdf_tm)


def _reverse_rotor_string(data: bytes) -> bytes:
    spin = list(data)
    spin = [value ^ 154 for value in spin[:128]] + spin[128:]
    spin.reverse()
    return bytes(spin)


def unpack_rotor(data: bytes) -> bytes:
    """Unpack ROTOR-wrapped data with ROTOR decrypt, zlib, and reverse/XOR post-process."""
    return _reverse_rotor_string(zlib.decompress(init_rotor().decrypt(data)))


def derive_wpd1_stage1_key(length: int, tag_param: int) -> bytes:
    """Derive the 16-byte AES key used by WPD1 stage-1 payload encoding."""
    v10 = (tag_param + (length & 0xFFFFFFFF)) & 0xFF
    v28 = (
        0x7C2E6B6A00000000
        | (((length & 0xFFFFFFFF) << 8) & 0xFFFF0000)
        | (v10 << 8)
        | (length % 0xFD)
    )
    v29 = (
        0x5C74656E00003630
        | (((v10 ^ 0x33) << 16) & 0xFFFFFFFF00FFFFFF)
        | ((v10 | 0x2E) << 24)
    )
    return struct.pack("<QQ", v28 & 0xFFFFFFFFFFFFFFFF, v29 & 0xFFFFFFFFFFFFFFFF)


def _aes_decrypt_prefix(buf: bytearray, length: int, key16: bytes) -> int:
    if length <= 0:
        return 0
    done = (length // 16) * 16
    if done <= 0:
        return 0

    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    cipher = Cipher(algorithms.AES(key16), modes.ECB(), backend=default_backend())
    decryptor = cipher.decryptor()
    buf[:done] = decryptor.update(bytes(buf[:done])) + decryptor.finalize()
    return done


def _wpd1_xor_offset(buf: bytearray, offset: int, want: int, seed: int) -> None:
    if want <= 0:
        return
    mirror_len = min(offset, want)
    for i in range(mirror_len):
        buf[offset + i] ^= ((seed + i) + buf[i]) & 0xFF
    for i in range(want - mirror_len):
        buf[offset + mirror_len + i] ^= (seed + mirror_len + i) & 0xFF


def _wpd1_xor_linear(buf: bytearray, want: int, seed: int) -> None:
    for i in range(want):
        buf[i] ^= (seed + i) & 0xFF


def _wpd1_header_decode(buf: bytearray) -> None:
    n = min(64, len(buf))
    i, j = 0, n - 1
    while i < j:
        left = buf[i] ^ 0x5A
        right = buf[j] ^ 0x5A
        buf[i], buf[j] = right, left
        i += 1
        j -= 1
    if i == j:
        buf[i] ^= 0x5A


def decode_wpd1_payload_stage1(payload: bytes, *, skip_header_decode: bool = False) -> Optional[tuple[bytes, int]]:
    """Decode one WPD1/WPK payload using stage-1 AES/XOR rules."""
    if len(payload) < 8:
        return None

    stage_tag = int.from_bytes(payload[0:2], "little")
    prefix_power = payload[2]
    tag_param = payload[3]
    body = bytearray(payload[8:])
    body_len = len(body)
    prefix_len = min(body_len, 128 << (prefix_power - 1)) if body_len > 0 and prefix_power != 0 else 0
    seed = (tag_param + body_len) & 0xFFFFFFFF

    if stage_tag in (0x4341, 0x4350):
        key = derive_wpd1_stage1_key(body_len, tag_param)
        done = _aes_decrypt_prefix(body, prefix_len, key)
        remain = max(0, prefix_len - done)
        if remain > 0:
            _wpd1_xor_offset(body, done, remain, seed)
    elif stage_tag == 0x4358:
        _wpd1_xor_linear(body, prefix_len, seed)
    else:
        return None

    if not skip_header_decode:
        _wpd1_header_decode(body)
    return bytes(body), stage_tag


def try_decode_wpd1_payload_stage1(payload: bytes, *, skip_header_decode: bool = False) -> tuple[bytes, bool, Optional[int]]:
    """Best-effort WPD1 stage-1 decode. Returns (data, decoded, tag)."""
    try:
        result = decode_wpd1_payload_stage1(payload, skip_header_decode=skip_header_decode)
    except Exception:
        return payload, False, None
    if result is None:
        return payload, False, None
    decoded, stage_tag = result
    return decoded, True, stage_tag


def check_cobl(data: bytes) -> bool:
    """Check for COBL/LBOC block-concat wrapper."""
    return len(data) >= 16 and data[:4] in (b"COBL", b"LBOC")


def deobfuscate_cobl_probe_region(data: bytes) -> tuple[bytes, int]:
    """Undo the probe-region obfuscation used before COBL block tags."""
    if not data:
        return data, 0

    probe_len = min(64, len(data))
    if probe_len <= 3:
        return data, 0

    fixed = bytes((byte ^ 0x5A) for byte in data[:probe_len][::-1])
    patched = bytearray(data)
    patched[:probe_len] = fixed
    return bytes(patched), probe_len


def decode_cobl_block(data: bytes) -> bytes:
    """Decode one COBL block after deobfuscating its tag region."""
    if not data:
        return b""

    patched, probe_len = deobfuscate_cobl_probe_region(data)
    if probe_len < 4 or len(patched) < 4:
        return data

    tag = struct.unpack_from("<I", patched, 0)[0]
    payload = patched[4:]

    if tag in (0x4E4F4E45, 0x454E4F4E):  # NONE / ENON byte spellings
        return payload
    if tag in (0x5A4C4942, 0x42494C5A):  # ZLIB
        return zlib.decompress(payload)
    if tag in (0x5A535444, 0x4454535A):  # ZSTD
        return zstd.ZstdDecompressor().decompress(payload)
    if tag in (0x4C5A3446, 0x46345A4C):  # LZ4F
        try:
            import lz4.frame as lz4f  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError("lz4.frame is required to decompress COBL LZ4F blocks") from exc
        return lz4f.decompress(payload)
    if tag in (0x4F4F444C, 0x4C444F4F):  # OODL
        raise RuntimeError("COBL block uses unsupported Oodle codec")

    return data


def unpack_cobl(data: bytes) -> bytes:
    """Decode a COBL block table into a concatenated payload."""
    if not check_cobl(data):
        return data

    magic, _field04, _field08, block_count = struct.unpack_from("<4I", data, 0)
    if magic not in (0x434F424C, 0x4C424F43):
        raise ValueError(f"bad COBL magic 0x{magic:08X}")

    data_base = 16 + block_count * 8
    if len(data) < data_base:
        raise ValueError(f"COBL truncated block table: need >= {data_base}, got {len(data)}")

    rel_offset = 0
    out = bytearray()

    for block_index in range(block_count):
        size, extra, _unk = struct.unpack_from("<IHH", data, 16 + block_index * 8)
        start = data_base + rel_offset
        end = start + size
        if end > len(data):
            raise ValueError(f"COBL block {block_index} out of range: start={start} end={end} size={len(data)}")

        out.extend(decode_cobl_block(data[start:end]))
        rel_offset += size + extra

    return bytes(out)


def check_rotor(data: bytes) -> bool:
    """Detect ROTOR-wrapped data. The standalone Rotor class is not available yet."""
    return data[:2] in (bytes([0x1D, 0x04]), bytes([0x15, 0x23]))


def check_nxs3(data: bytes) -> bool:
    """Check if the data is wrapped in old NXS3 or newer NXS."""
    return data[:8] == b"NXS3\x03\x00\x00\x01" or data[:8] == b"\x4e\x58\x5a\x00\x47\x38\x36\x00"


def rsa_public_decrypt(signature: bytes, pem_key: bytes) -> bytes:
    """Perform the RSA public operation used by NXS wrappers."""
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = serialization.load_pem_public_key(pem_key, backend=default_backend())
    if not isinstance(key, rsa.RSAPublicKey):
        raise ValueError("NXS key is not an RSA public key")

    public_numbers = key.public_numbers()
    e = public_numbers.e
    n = public_numbers.n
    k = (n.bit_length() + 7) // 8
    if len(signature) != k:
        raise ValueError("Signature length does not match key size")

    decrypted = pow(int.from_bytes(signature, "big"), e, n).to_bytes(k, "big")
    if decrypted[0] != 0x00 or decrypted[1] != 0x01:
        raise ValueError("Incorrect RSA padding")
    try:
        padding_end = decrypted.index(0x00, 2)
    except ValueError as exc:
        raise ValueError("RSA padding end not found") from exc
    return decrypted[padding_end + 1 :]


def _nxs_logic(data: bytes, pem_key: bytes, key_size: int) -> bytes:
    wrapped_key = rsa_public_decrypt(data[20 : 20 + key_size], pem_key)[:4]
    if len(wrapped_key) != 4:
        raise ValueError("NXS wrapped key did not produce 4 bytes")

    ephemeral_key = int.from_bytes(wrapped_key, "little")
    decrypted = bytearray()
    payload = data[20 + key_size :]

    for i, value in enumerate(payload):
        decrypted.append(value ^ ((ephemeral_key >> (i % 4 * 8)) & 0xFF))
        if i % 4 == 3:
            ror = (ephemeral_key >> 19) | ((ephemeral_key << 13) & 0xFFFFFFFF)
            ephemeral_key = (ror + ((ror << 2) & 0xFFFFFFFF) + 0xE6546B64) & 0xFFFFFFFF

    return bytes(decrypted)


def unpack_nxs3(data: bytes) -> bytes:
    """Unpack old NXS3 or newer NXS wrappers from the pasted implementation."""
    old_key = b"""-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAOZAaZe2qB7dpT9Y8WfZIdDv+ooS1HsFEDW2hFnnvcuFJ4vIuPgKhISm
pY4/jT3aipwPNVTjM6yHbzOLhrnGJh7Ec3CQG/FZu6VKoCqVEtCeh15hjcu6QYtn
YWIEf8qgkylqsOQ3IIn76udV6m0AWC2jDlmLeRcR04w9NNw7+9t9AgMBAAE=
-----END RSA PUBLIC KEY-----"""
    new_key = b"""-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAu5/HBdUwY37hJbm3ri9h/fHJqsx6PeLTEqP2tIYoV3+qn0lI4Kht
wi03S2wf6CrwWXuf8Dp4L/MRsFi/Cxqe53m6Dhx8Zy9nzStaBUzp0DeL/M+HWI+r
fDUPybKfJx9qlTNxUyvIQZkSh83YdkhVC4pqiOt0nGCS44Xs88DEkYOjRydLa4uK
JQIZAuUSsC5Cu9FjBzGHW3Pc9ene9HJai+8ipvi8bhLc1hnvlER7GtzQce/Ubjq2
D79KXLCjZKYr0L+9h7hfOQk+R2VqVthRvuf2ql9H13Wbnukm6ijg8+mamB6esNTo
OPdjQkuMj5wUEfPqRK3GZibW92QilOvFt9cx0JBjjs3k8ax7u9iOnsVEqUqgX9bE
FoZiwUfV1wJAcfEzJqJ4/wMe8FIV35Pg9UE/tQ4M9YX+PDUTnaWXksK8kDqa96NG
d9xqy+MntsUcKf7UsEExtkm6GDxtpIokUYplUAMPQDo/04eBOP6J5YdjOv2Dxjd5
OM832KIu1uYdO81xRGmyiSsavtzkQJbePWVFq1iW/1+nmaodzgi/esbLFM5T6xan
iOvQK1rRaJgE2NdU0EOAOhDAJu+1JfiB60nJw20gSM6Wl3s9N+UmXrR+xJxxcgnK
P0VB60qOgnlYmNwld5muJazI9P7sbtFRuEVLoN5Y+P9PCIXQ/RrZVLMCAwEAAQ==
-----END RSA PUBLIC KEY-----"""

    if data[:8] == b"NXS3\x03\x00\x00\x01":
        return _nxs_logic(data, old_key, 128)
    if data[:8] == b"\x4e\x58\x5a\x00\x47\x38\x36\x00":
        decoded = _nxs_logic(data, new_key, 512)
        if decoded[:4] == b"\x28\xb5\x2f\xfd":
            return zstd.ZstdDecompressor().decompress(decoded)
        return decoded
    return data


def unwrap_payload_layers(data: bytes, max_layers: int = 32) -> tuple[bytes, list[str], Optional[str]]:
    """Strip nested NeoX payload wrappers where possible."""
    layers: list[str] = []
    seen: set[tuple[int, bytes]] = set()

    for _ in range(max_layers):
        signature = (len(data), data[:16])
        if signature in seen:
            break
        seen.add(signature)

        stripped = strip_none_wrapper(data)
        if stripped != data:
            data = stripped
            layers.append("NONE")
            continue

        stripped = strip_enon_wrapper(data)
        if stripped != data:
            data = stripped
            layers.append("ENON")
            continue

        if check_dtsz(data):
            try:
                unpacked = unpack_dtsz(data)
            except Exception as exc:
                return data, layers, f"DTSZ unwrap failed: {exc}"
            if unpacked != data:
                data = unpacked
                layers.append("DTSZ")
                continue

        if check_cobl(data):
            try:
                unpacked = unpack_cobl(data)
            except Exception as exc:
                return data, layers, f"COBL unwrap failed: {exc}"
            if unpacked and unpacked != data:
                data = unpacked
                layers.append("COBL")
                continue

        if check_lz4_like(data):
            unpacked = unpack_lz4_like(data)
            if unpacked and unpacked != data:
                data = unpacked
                layers.append("LZ4_LIKE")
                continue

        if check_stzb(data):
            unpacked = unpack_stzb(data)
            if unpacked != data:
                data = unpacked
                layers.append("STZB")
                continue

        if check_nxs3(data):
            try:
                unpacked = unpack_nxs3(data)
            except Exception as exc:
                return data, layers, f"NXS unwrap failed: {exc}"
            if unpacked != data:
                data = unpacked
                layers.append("NXS")
                continue

        if check_rotor(data):
            try:
                unpacked = unpack_rotor(data)
            except Exception as exc:
                return data, layers, f"ROTOR unwrap failed: {exc}"
            if unpacked != data:
                data = unpacked
                layers.append("ROTOR")
                continue

        break

    return data, layers, None


def decompress_payload(data: bytes, zip_flag: int, original_length: int) -> tuple[bytes, str, Optional[str]]:
    """Best-effort decompression for a raw payload and NPK zip flag."""
    if zip_flag == int(CompressionType.NONE) and not data.startswith(b"\x28\xb5\x2f\xfd"):
        return data, "raw", None

    entry = NPKEntry(
        data=data,
        file_length=len(data),
        file_original_length=original_length,
        crc=0,
        encrypt_flag=DecryptionType.NONE,
        zip_flag=zip_flag,
    )
    try:
        decoded = decompress_entry(entry)
    except Exception as exc:
        if data.startswith(b"\x28\xb5\x2f\xfd"):
            return data, "zstd-unresolved", str(exc)
        return data, f"compression-{zip_flag}-unresolved", str(exc)

    if decoded == data:
        return decoded, "raw", None
    if zip_flag == int(CompressionType.ZLIB):
        return decoded, "zlib", None
    if zip_flag == int(CompressionType.LZ4):
        return decoded, "lz4", None
    if zip_flag == int(CompressionType.ZSTD) or data.startswith(b"\x28\xb5\x2f\xfd"):
        return decoded, "zstd", None
    return decoded, f"compression-{zip_flag}", None


def get_zstd_frame_info(data: bytes) -> Optional[dict[str, int]]:
    """Return Zstd frame metadata when the payload starts with the Zstd magic."""
    if not data.startswith(b"\x28\xb5\x2f\xfd"):
        return None
    params = zstd.get_frame_parameters(data)
    return {
        "magic": ZSTD_MAGIC_NUMBER,
        "dictId": params.dict_id,
        "contentSize": params.content_size,
        "windowSize": params.window_size,
    }


EGGPARTY_INDEX_ROUND_KEYS = [
    1466294906,
    1460669224,
    2458039086,
    3599020919,
    687260292,
    2570908058,
    1885258245,
    245923009,
    1693573352,
    2982818590,
    3915527071,
    2130099908,
    448182585,
    3577467894,
    1487405185,
    2543095131,
    909181480,
    3482151631,
    2375275383,
    3476852186,
    4146422541,
    4189874407,
    1109309880,
    1118789293,
    1149249532,
    244911082,
    3148009823,
    11659029,
    2003874988,
    1243163670,
    3040598709,
    3138598474,
    3914532381,
    1030330554,
    4280481443,
    237563135,
    1147416806,
    3560611495,
    3259723289,
    4043971164,
    2557374349,
    813845727,
    4047979994,
    2489865706,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
]

MOBA_XOR_KEY = [
    0x48, 0x5A, 0xC5, 0xFD, 0x8F, 0x70, 0xA6, 0xDD, 0x1C, 0x6F, 0xB8, 0x86, 0x83, 0x78, 0xB7, 0xF7,
    0xF2, 0xB4, 0x76, 0x7F, 0xAB, 0x5C, 0x40, 0x84, 0xCC, 0xF8, 0x60, 0x9C, 0x12, 0x5B, 0x80, 0x15,
    0x72, 0x9D, 0x99, 0x42, 0x92, 0x39, 0xD3, 0xBA, 0xA7, 0xC4, 0xA9, 0xC7, 0xD4, 0x47, 0xE3, 0x31,
    0x43, 0xEC, 0x20, 0xB3, 0x4C, 0x14, 0x04, 0xD8, 0xA4, 0x8D, 0x73, 0x19, 0xF3, 0xD7, 0x79, 0x36,
    0xF1, 0x2D, 0xFB, 0x68, 0xF6, 0x8E, 0xAF, 0xA0, 0xE4, 0x9B, 0x2E, 0x49, 0x53, 0xB2, 0x65, 0x3B,
    0x0A, 0x3A, 0xC8, 0x54, 0xED, 0x00, 0xB5, 0x1D, 0xEA, 0x7B, 0x24, 0x71, 0x82, 0xC9, 0x26, 0x95,
    0x56, 0x5F, 0xB1, 0x17, 0x74, 0x44, 0xBB, 0x52, 0xF4, 0x21, 0xAC, 0x96, 0x05, 0x1A, 0x10, 0x9E,
    0xD9, 0xFF, 0x64, 0xC3, 0x4A, 0x62, 0xE2, 0x50, 0x97, 0xCA, 0xA1, 0x6A, 0x27, 0xBD, 0x6D, 0x5D,
    0xF5, 0xA8, 0x32, 0x0F, 0x9F, 0x07, 0xFC, 0xCB, 0x8B, 0x4B, 0x37, 0x55, 0x0D, 0x41, 0xCE, 0xB6,
    0x3E, 0x34, 0x8A, 0x18, 0x13, 0xBC, 0x87, 0x58, 0x46, 0x28, 0x5E, 0x2B, 0xEB, 0x63, 0x23, 0xDE,
    0x30, 0x8C, 0xA5, 0x06, 0x02, 0x57, 0xDA, 0x98, 0x7A, 0x93, 0x38, 0x03, 0xE1, 0x66, 0xE7, 0xF0,
    0x35, 0xD1, 0x6B, 0xDB, 0x08, 0xE6, 0xCD, 0x59, 0x01, 0xEE, 0x7C, 0x88, 0x33, 0xD2, 0xFA, 0x25,
    0x89, 0xD0, 0x0C, 0x3D, 0xAA, 0xDC, 0xD6, 0xC6, 0xDF, 0xE0, 0x4F, 0x3F, 0x1F, 0x77, 0xA2, 0x75,
    0xB0, 0xE8, 0x94, 0xAD, 0x7D, 0x6C, 0xC2, 0x22, 0xF9, 0xBE, 0xBF, 0x0B, 0xC1, 0x1B, 0x69, 0xEF,
    0x29, 0x3C, 0xE9, 0xC0, 0x61, 0xE5, 0x6E, 0x2F, 0x9A, 0x51, 0xD5, 0x11, 0x67, 0x16, 0xCF, 0x1E,
    0xAE, 0x4E, 0x0E, 0x81, 0x45, 0x2A, 0x91, 0x90, 0xFE, 0xA3, 0x09, 0x2C, 0x85, 0x4D, 0xB9, 0x7E,
]


class EXPKKeyGenerator:
    """MOBA/EXPK stream-XOR key generator for NPK data."""

    def __init__(self):
        self.keys: list[int] = []

    def generate_keys(self, length: int) -> list[int]:
        key_stream = []
        key_data = MOBA_XOR_KEY.copy()
        key_index = 0
        key_tmp_index = 0

        for _ in range(length):
            key_index += 1
            tmp_data = key_data[key_index % 256]
            key_tmp_index += tmp_data
            key_tmp_index %= 256
            key_data[key_index % 256] = key_data[key_tmp_index]
            key_data[key_tmp_index] = tmp_data
            key_i = key_data[(key_data[key_index % 256] + tmp_data) % 256 & 0xFF]
            key_stream.append(key_i)

        self.keys = key_stream
        return key_stream

    def ensure_keys(self, length: int) -> None:
        if length > len(self.keys):
            self.generate_keys(max(length, 2_000_000))

    def decrypt(self, data: bytes | bytearray) -> bytes:
        self.ensure_keys(len(data))
        result = bytearray(data)
        for i, value in enumerate(result):
            result[i] = value ^ self.keys[i]
        return bytes(result)


def decrypt_eggparty_index(
    index_data: bytes | bytearray,
    decrypt_mode3_block: Optional[Callable[[bytes, list[int]], bytes]] = None,
) -> bytes:
    """Decrypt 16-byte Eggy Party index blocks; leave a short tail unchanged.

    The pasted source called `.eggyparty_codes.decrypt_mode3_block`, but did not
    include that implementation. Pass it explicitly when available.
    """

    if decrypt_mode3_block is None:
        raise NotImplementedError(
            "decrypt_mode3_block was not included in the pasted source; pass it to decrypt_eggparty_index()."
        )

    buffer = bytearray(index_data)
    block_count = len(buffer) >> 4
    for block_index in range(block_count):
        offset = block_index * 16
        buffer[offset : offset + 16] = decrypt_mode3_block(
            bytes(buffer[offset : offset + 16]),
            EGGPARTY_INDEX_ROUND_KEYS,
        )
    return bytes(buffer)


def decrypt_entry(entry: NPKEntry, key: int | None = None) -> bytes:
    """Decrypt an NPK entry using the known XOR modes from the pasted source."""

    data = bytearray(entry.data)

    if entry.encrypt_flag == DecryptionType.BASIC_XOR:
        if key is None:
            entry.data_flags |= NPKEntryDataFlags.ENCRYPTED
            return entry.data

        size = min(entry.file_length, 0x80)
        key_array = [(key + x) & 0xFF for x in range(0, 0x100)]
        for j in range(size):
            data[j] ^= key_array[j % 0xFF]

    elif entry.encrypt_flag == DecryptionType.ADVANCED_XOR:
        b = entry.crc ^ entry.file_original_length
        start = 0
        size = entry.file_length

        if size > 0x80:
            start = (entry.crc >> 1) % (size - 0x80)
            size = 2 * entry.file_original_length % 0x60 + 0x20

        key_array = [(x + b) & 0xFF for x in range(0, 0x81)]
        for j in range(size):
            data[start + j] ^= key_array[j % 0x80]

    elif entry.encrypt_flag == DecryptionType.INCREMENTAL_XOR:
        original_length = int(entry.file_original_length)
        crc = int(entry.crc)
        crc_key = (original_length ^ crc) & 0xFF
        offset = 0

        if entry.file_length <= 0x80:
            length = entry.file_length
        else:
            offset = (original_length >> 1) % (entry.file_length - 0x80)
            length = ((crc << 1) & 0xFFFFFFFF) % 0x60 + 0x20

        for index in range(offset, offset + length):
            data[index] ^= crc_key
            crc_key = (crc_key + 1) & 0xFF

    return bytes(data)


def _mode_from_cli(value: str) -> Union[DecryptionType, str]:
    normalized = value.strip().lower().replace("-", "_")
    aliases = {
        "0": DecryptionType.NONE,
        "none": DecryptionType.NONE,
        "1": DecryptionType.BASIC_XOR,
        "basic": DecryptionType.BASIC_XOR,
        "basic_xor": DecryptionType.BASIC_XOR,
        "2": DecryptionType.ADVANCED_XOR,
        "advanced": DecryptionType.ADVANCED_XOR,
        "advanced_xor": DecryptionType.ADVANCED_XOR,
        "3": DecryptionType.INCREMENTAL_XOR,
        "incremental": DecryptionType.INCREMENTAL_XOR,
        "incremental_xor": DecryptionType.INCREMENTAL_XOR,
    }
    if normalized in {"moba", "moba_xor", "expk", "expk_xor"}:
        return normalized
    if normalized not in aliases:
        raise argparse.ArgumentTypeError(f"Unknown decryption mode: {value}")
    return aliases[normalized]


def main() -> int:
    cli = argparse.ArgumentParser(description="Decrypt raw NPK entry payloads or compute default NPK mesh/path hashes.")
    cli.add_argument("input", help="Encrypted entry bytes, or text to hash when using hash mode.")
    cli.add_argument("fallback", nargs="*", help="Optional fallback form: output mode [metadata].")
    cli.add_argument("-o", "--output", help="Output path for decrypted bytes.")
    cli.add_argument("--mode", type=_mode_from_cli, help="none, basic_xor, advanced_xor, incremental_xor, or moba_xor/expk.")
    cli.add_argument("--key", type=lambda value: int(value, 0), help="BASIC_XOR key, decimal or 0x-prefixed.")
    cli.add_argument("--crc", type=lambda value: int(value, 0), default=0, help="Entry CRC, decimal or 0x-prefixed.")
    cli.add_argument("--original-length", type=int, help="Original uncompressed entry length. Defaults to input size.")
    cli.add_argument("--metadata", help="Optional JSON metadata output path.")
    args = cli.parse_args()

    if str(args.input).lower() in {"hash", "mesh_hash", "mesh-hash"}:
        if not args.fallback:
            cli.error("hash mode requires text: npk_decrypt_helpers.py hash TEXT")
        text = " ".join(args.fallback)
        print(json.dumps({"text": text, "hash": mesh_hash(text), "hex": f"0x{mesh_hash(text):08X}"}))
        return 0

    if str(args.input).lower() in {"detect", "identify", "ext"}:
        if not args.fallback:
            cli.error("detect mode requires a file path: npk_decrypt_helpers.py detect FILE")
        target = Path(args.fallback[0]).resolve()
        data = target.read_bytes()
        flags = NPKEntryDataFlags.TEXT if not is_binary(data) else NPKEntryDataFlags.NONE
        extension = get_ext(data, flags)
        category = get_file_category(extension)
        print(json.dumps({
            "path": str(target),
            "sizeBytes": len(data),
            "isBinary": is_binary(data),
            "extension": extension,
            "category": category.name.lower(),
        }))
        return 0

    if (args.output is None or args.mode is None) and len(args.fallback) >= 2:
        args.output = args.output or args.fallback[0]
        args.mode = args.mode or _mode_from_cli(args.fallback[1])
        if args.metadata is None and len(args.fallback) >= 3:
            args.metadata = args.fallback[2]

    if args.output is None or args.mode is None:
        cli.error("output and mode are required. Use -o OUT --mode MODE, or fallback form: input OUT MODE [metadata].")

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    data = input_path.read_bytes()
    entry = None
    if isinstance(args.mode, str):
        decrypted = EXPKKeyGenerator().decrypt(data)
        mode_name = args.mode.upper()
        data_flags = NPKEntryDataFlags.NONE
        original_length = args.original_length if args.original_length is not None else len(data)
    else:
        entry = NPKEntry(
            data=data,
            file_length=len(data),
            file_original_length=args.original_length if args.original_length is not None else len(data),
            crc=args.crc,
            encrypt_flag=args.mode,
        )
        decrypted = decrypt_entry(entry, key=args.key)
        mode_name = args.mode.name
        data_flags = entry.data_flags
        original_length = entry.file_original_length
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(decrypted)

    if args.metadata:
        metadata_path = Path(args.metadata).resolve()
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        metadata_path.write_text(
            json.dumps(
                {
                    "input": str(input_path),
                    "output": str(output_path),
                    "mode": mode_name,
                    "sizeBytes": len(data),
                    "crc": args.crc,
                    "originalLength": original_length,
                    "dataFlags": int(data_flags),
                    "needsExternalKey": data_flags & NPKEntryDataFlags.ENCRYPTED == NPKEntryDataFlags.ENCRYPTED,
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
