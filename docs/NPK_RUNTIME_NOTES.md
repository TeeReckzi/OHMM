# NetEase / Once Human NPK Runtime Notes

These notes consolidate the pasted NetEase NPK matrix and the local findings from
`C:\Users\tyr3x\Downloads\oncehuman_neox\NeoX_full`.

## NetEase Matrix

The posted matrix says there is no single universal NPK setup across NetEase
games. For Once Human:

| Game | Unknown | Encrypt | Hash | Index | ZFlag | File Flag | Extra |
| --- | ---: | ---: | ---: | --- | ---: | ---: | --- |
| Once Human (`ONCE`) | 0 | 256 | 0 | default | 2 | 0 | Nothing |

Important notes from the same source:

- Use the general config unless a game-specific config exists.
- XOR keys only apply when `FILEFLAG` is `1`.
- `script.npk` files may use ROTOR, NXS, or both in some NetEase games.
- Eggy Party uses `encrypt_mode=3`, which still requires the missing mode-3 block decryptor.

## Verified Once Human Dump

Observed files:

- `Documents\patch.npk`
  - Header: `NXPK`
  - `file_count=479`
  - `encrypt_mode=256`
  - `hash_mode=0`
  - `index_offset=0x1B65E0`
  - `info_size=28`
  - Embedded name table recovered: `479` names
- `Documents\script.npk`
  - Header: `NXPK`
  - `file_count=7388`
  - `encrypt_mode=0`
  - `hash_mode=0`
  - Companion mapping works:
    `Documents\index_mapping\script\Documents_script.npk.mapping`

## Zstandard Frames

Python `zstandard.MAGIC_NUMBER` reports the Zstd magic as `0xfd2fb528`.
On disk, little-endian bytes are:

```text
28 b5 2f fd
```

That is the standard Zstd frame magic. In this dump, unresolved frames are not
currently evidence of a new encryption layer by themselves. They are valid Zstd
frames that require a dictionary.

Verified frame metadata:

- Dictionary id: `0x6A4AC76B` (`1783285611`)
- `script.npk`: all `2446` unresolved Zstd frames use this dictionary id.
- `patch.npk`: sampled unresolved frames use the same dictionary id.

Current blocker:

- Need the Zstd dictionary with id `0x6A4AC76B`, or a way to derive/recover it.
- `zstandard` version differences (`0.21.0` vs local `0.25.0`) do not change the
  frame magic or dictionary-id finding.

## NeoXtractor Source Drop

`NeoXtractor-438da76b8335bf48e027b04f45e2c2fae86f02a7.zip` contains the local
`neoxtractor 3.0.1` source referenced by the lockfile as `source = { virtual = "." }`.
The project dependency set includes `arc4`, `cryptography`, `lz4`, `pycryptodome`,
and `zstandard`.

Useful recovered modules:

- `core\rotor.py`: ROTOR cipher implementation.
- `core\wpk\decryption.py`: WPD1/WPK stage-1 AES/XOR payload decoder.
- `core\npk\eggyparty_codes.py`: full Eggy Party `encrypt_mode=3` block decoder.

## Tooling Status

Project-local tools:

- `scripts\npk_archive_reader.py`
  - Generic `NXPK` / `EXPK` reader for standard embedded-index archives.
  - Works on `patch.npk`.
  - Emits Zstd frame metadata in sample manifests.
- `scripts\extract_script_npk.py`
  - Mapping-driven extractor for `script.npk`.
  - Emits Zstd frame metadata and wrapper layers in manifests.
- `scripts\npk_decrypt_helpers.py`
  - Shared decryption, compression, wrapper, hash, and file-type helpers.
  - Supports Zlib, Zstd, optional LZ4, `NONE`, `ENON`, `DTSZ`, `COBL`/`LBOC`, STZB, NXS, and custom LZ4-like wrappers.
  - Supports ROTOR unpacking using the NeoXtractor `core\rotor.py` implementation.
  - Supports WPD1/WPK stage-1 AES/XOR decoding from NeoXtractor `core\wpk\decryption.py`.
  - Eggy Party mode-3 source is available in the NeoXtractor drop, but is not copied into the Once Human helper because it is unrelated to the observed Once Human archives.
