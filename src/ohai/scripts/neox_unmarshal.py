#!/usr/bin/env python3
"""
Custom NeoX marshal parser for Once Human .pyc files (magic 3496).

NeoX extends CPython 3.9's marshal with custom type codes:
  'V' (0x56) = likely variant/NeoX code object  
  'J' (0x4A) = likely jump table or NeoX-specific const
  'M' (0x4D) = likely module reference or NeoX metadata

This parser extracts all readable data (strings, numbers, tuples, lists,
code object metadata) without attempting full bytecode decompilation.
It produces a structured JSON representation of each .pyc file.
"""
from __future__ import annotations

import argparse
import io
import json
import struct
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, BinaryIO

from npk_config import NEOX_MAGIC, NEOX_PYC_HEADER_SIZE as HEADER_SIZE

# Standard CPython marshal type codes
TYPE_NULL = ord('0')       # 0x30
TYPE_NONE = ord('N')       # 0x4E
TYPE_FALSE = ord('F')      # 0x46
TYPE_TRUE = ord('T')       # 0x54
TYPE_STOPITER = ord('S')   # 0x53
TYPE_ELLIPSIS = ord('.')   # 0x2E
TYPE_INT = ord('i')        # 0x69
TYPE_INT64 = ord('I')      # 0x49
TYPE_FLOAT = ord('f')      # 0x66
TYPE_BINARY_FLOAT = ord('g') # 0x67
TYPE_COMPLEX = ord('x')    # 0x78
TYPE_BINARY_COMPLEX = ord('y') # 0x79
TYPE_LONG = ord('l')       # 0x6C
TYPE_STRING = ord('s')     # 0x73
TYPE_INTERNED = ord('t')   # 0x74
TYPE_REF = ord('r')        # 0x72
TYPE_TUPLE = ord('(')      # 0x28
TYPE_LIST = ord('[')       # 0x5B
TYPE_DICT = ord('{')       # 0x7B
TYPE_CODE = ord('c')       # 0x63
TYPE_UNICODE = ord('u')    # 0x75
TYPE_UNKNOWN = ord('?')    # 0x3F
TYPE_SET = ord('<')        # 0x3C
TYPE_FROZENSET = ord('>')  # 0x3E
TYPE_ASCII = ord('a')      # 0x61
TYPE_ASCII_INTERNED = ord('A') # 0x41
TYPE_SMALL_TUPLE = ord(')')  # 0x29
TYPE_SHORT_ASCII = ord('z')  # 0x7A
TYPE_SHORT_ASCII_INTERNED = ord('Z') # 0x5A

# NeoX custom type codes (observed)
TYPE_NEOX_V = ord('V')     # 0x56 - NeoX variant code?
TYPE_NEOX_J = ord('J')     # 0x4A - NeoX jump/const?
TYPE_NEOX_M = ord('M')     # 0x4D - NeoX module ref?

FLAG_REF = 0x80  # Flag bit indicating the object should be stored in refs


class NeoXUnmarshalError(Exception):
    pass


class NeoXUnmarshaller:
    """Custom unmarshaller that handles NeoX's extended type codes."""

    def __init__(self, data: bytes, verbose: bool = False):
        self.fp = io.BytesIO(data)
        self.refs: list[Any] = []
        self.strings: list[str] = []
        self.numbers: list = []
        self.code_objects: list[dict] = []
        self.unknown_types: list[dict] = []
        self.verbose = verbose
        self.depth = 0
        self.max_depth = 50

    def read_byte(self) -> int:
        b = self.fp.read(1)
        if not b:
            raise NeoXUnmarshalError("Unexpected EOF")
        return b[0]

    def read_short(self) -> int:
        data = self.fp.read(2)
        if len(data) < 2:
            raise NeoXUnmarshalError("Unexpected EOF reading short")
        return struct.unpack('<h', data)[0]

    def read_long(self) -> int:
        data = self.fp.read(4)
        if len(data) < 4:
            raise NeoXUnmarshalError("Unexpected EOF reading long")
        return struct.unpack('<i', data)[0]

    def read_long_unsigned(self) -> int:
        data = self.fp.read(4)
        if len(data) < 4:
            raise NeoXUnmarshalError("Unexpected EOF reading ulong")
        return struct.unpack('<I', data)[0]

    def read_float64(self) -> float:
        data = self.fp.read(8)
        if len(data) < 8:
            raise NeoXUnmarshalError("Unexpected EOF reading float64")
        return struct.unpack('<d', data)[0]

    def read_bytes(self, n: int) -> bytes:
        data = self.fp.read(n)
        if len(data) < n:
            raise NeoXUnmarshalError(f"Unexpected EOF reading {n} bytes (got {len(data)})")
        return data

    def read_object(self) -> Any:
        """Read a single marshalled object."""
        if self.depth > self.max_depth:
            return '<MAX_DEPTH>'
        self.depth += 1

        try:
            type_byte = self.read_byte()
            flag = type_byte & FLAG_REF
            type_code = type_byte & ~FLAG_REF

            ref_idx = -1
            if flag:
                ref_idx = len(self.refs)
                self.refs.append(None)  # Placeholder

            obj = self._read_typed(type_code)

            if flag and ref_idx >= 0 and ref_idx < len(self.refs):
                self.refs[ref_idx] = obj

            return obj
        finally:
            self.depth -= 1

    def _read_typed(self, type_code: int) -> Any:
        if type_code == TYPE_NULL:
            return None
        elif type_code == TYPE_NONE:
            return None
        elif type_code == TYPE_FALSE:
            return False
        elif type_code == TYPE_TRUE:
            return True
        elif type_code == TYPE_STOPITER:
            return '<StopIteration>'
        elif type_code == TYPE_ELLIPSIS:
            return '...'
        elif type_code == TYPE_INT:
            return self.read_long()
        elif type_code == TYPE_INT64:
            lo = self.read_long_unsigned()
            hi = self.read_long()
            return hi * (2**32) + lo
        elif type_code == TYPE_FLOAT:
            n = self.read_byte()
            s = self.read_bytes(n).decode('ascii')
            return float(s)
        elif type_code == TYPE_BINARY_FLOAT:
            v = self.read_float64()
            self.numbers.append(v)
            return v
        elif type_code == TYPE_LONG:
            n = self.read_long()
            if n == 0:
                return 0
            sign = 1 if n > 0 else -1
            n = abs(n)
            digits = []
            for _ in range(n):
                digits.append(self.read_short() & 0xFFFF)
            result = 0
            for d in reversed(digits):
                result = result * 32768 + d
            return sign * result
        elif type_code in (TYPE_STRING, TYPE_INTERNED):
            n = self.read_long()
            if n < 0 or n > 10_000_000:
                return f'<bad_string_len:{n}>'
            s = self.read_bytes(n)
            try:
                decoded = s.decode('utf-8')
                self.strings.append(decoded)
                return decoded
            except:
                return s
        elif type_code in (TYPE_ASCII, TYPE_ASCII_INTERNED, TYPE_SHORT_ASCII, TYPE_SHORT_ASCII_INTERNED):
            if type_code in (TYPE_SHORT_ASCII, TYPE_SHORT_ASCII_INTERNED):
                n = self.read_byte()
            else:
                n = self.read_long()
            if n < 0 or n > 10_000_000:
                return f'<bad_ascii_len:{n}>'
            s = self.read_bytes(n).decode('ascii', 'replace')
            self.strings.append(s)
            return s
        elif type_code == TYPE_UNICODE:
            n = self.read_long()
            if n < 0 or n > 10_000_000:
                return f'<bad_unicode_len:{n}>'
            s = self.read_bytes(n).decode('utf-8', 'replace')
            self.strings.append(s)
            return s
        elif type_code == TYPE_SMALL_TUPLE:
            n = self.read_byte()
            return tuple(self.read_object() for _ in range(n))
        elif type_code == TYPE_TUPLE:
            n = self.read_long()
            if n < 0 or n > 100000:
                return f'<bad_tuple_len:{n}>'
            return tuple(self.read_object() for _ in range(min(n, 1000)))
        elif type_code == TYPE_LIST:
            n = self.read_long()
            if n < 0 or n > 100000:
                return f'<bad_list_len:{n}>'
            return [self.read_object() for _ in range(min(n, 1000))]
        elif type_code == TYPE_DICT:
            d = {}
            while True:
                key = self.read_object()
                if key is None:
                    break
                val = self.read_object()
                d[str(key)] = val
                if len(d) > 10000:
                    break
            return d
        elif type_code == TYPE_SET:
            n = self.read_long()
            return {self.read_object() for _ in range(min(n, 1000))}
        elif type_code == TYPE_FROZENSET:
            n = self.read_long()
            return frozenset(self.read_object() for _ in range(min(n, 1000)))
        elif type_code == TYPE_REF:
            idx = self.read_long()
            if 0 <= idx < len(self.refs):
                return self.refs[idx]
            return f'<ref:{idx}>'
        elif type_code == TYPE_CODE:
            return self._read_code_object()
        # NeoX custom types
        elif type_code == TYPE_NEOX_V:
            return self._read_neox_v()
        elif type_code == TYPE_NEOX_J:
            return self._read_neox_j()
        elif type_code == TYPE_NEOX_M:
            return self._read_neox_m()
        else:
            self.unknown_types.append({'type': type_code, 'char': chr(type_code) if 32 <= type_code < 127 else '?', 'pos': self.fp.tell()})
            return f'<unknown_type:0x{type_code:02X}>'

    def _read_code_object(self) -> dict:
        """Read a standard Python 3.9 code object."""
        co = {}
        co['co_argcount'] = self.read_long()
        co['co_posonlyargcount'] = self.read_long()
        co['co_kwonlyargcount'] = self.read_long()
        co['co_nlocals'] = self.read_long()
        co['co_stacksize'] = self.read_long()
        co['co_flags'] = self.read_long()
        co['co_code'] = self.read_object()  # bytes
        co['co_consts'] = self.read_object()  # tuple
        co['co_names'] = self.read_object()  # tuple
        co['co_varnames'] = self.read_object()  # tuple
        co['co_freevars'] = self.read_object()  # tuple
        co['co_cellvars'] = self.read_object()  # tuple
        co['co_filename'] = self.read_object()  # string
        co['co_name'] = self.read_object()  # string
        co['co_firstlineno'] = self.read_long()
        co['co_lnotab'] = self.read_object()  # bytes

        self.code_objects.append({
            'name': co.get('co_name', '?'),
            'filename': co.get('co_filename', '?'),
            'argcount': co.get('co_argcount', 0),
            'names': co.get('co_names', ()),
            'varnames': co.get('co_varnames', ()),
            'firstlineno': co.get('co_firstlineno', 0),
        })
        return co

    def _read_neox_v(self) -> Any:
        """Read NeoX 'V' type — treat as a code object variant."""
        # NeoX 'V' appears to be their modified code object.
        # It likely has the same fields as a standard code object but with
        # additional NeoX-specific fields or a different field order.
        # Try reading as standard code object first:
        try:
            return self._read_code_object()
        except Exception:
            return '<NeoX_V_unreadable>'

    def _read_neox_j(self) -> Any:
        """Read NeoX 'J' type — likely a bytes/bytecode blob."""
        # Hypothesis: 'J' is a length-prefixed bytecode blob
        try:
            n = self.read_long()
            if 0 <= n <= 10_000_000:
                data = self.read_bytes(n)
                return f'<NeoX_J:bytes[{n}]>'
            return f'<NeoX_J:bad_len:{n}>'
        except Exception:
            return '<NeoX_J_error>'

    def _read_neox_m(self) -> Any:
        """Read NeoX 'M' type — likely a module/metadata reference."""
        # Hypothesis: 'M' might be similar to a string or a name ref
        try:
            n = self.read_long()
            if 0 <= n <= 10_000_000:
                data = self.read_bytes(n)
                try:
                    s = data.decode('utf-8')
                    self.strings.append(s)
                    return f'<NeoX_M:{s}>'
                except:
                    return f'<NeoX_M:bytes[{n}]>'
            return f'<NeoX_M:bad_len:{n}>'
        except Exception:
            return '<NeoX_M_error>'


def parse_neox_pyc(filepath: Path) -> dict[str, Any]:
    """Parse a NeoX .pyc file and extract structured data."""
    data = filepath.read_bytes()
    if len(data) < HEADER_SIZE:
        return {'error': 'too_small', 'size': len(data)}

    magic = struct.unpack_from('<H', data, 0)[0]
    if magic != NEOX_MAGIC:
        return {'error': f'wrong_magic_{magic}', 'size': len(data)}

    um = NeoXUnmarshaller(data[HEADER_SIZE:])
    try:
        root = um.read_object()
    except NeoXUnmarshalError as e:
        root = f'<parse_error:{e}>'
    except Exception as e:
        root = f'<exception:{type(e).__name__}:{e}>'

    return {
        'size': len(data),
        'magic': magic,
        'strings': um.strings,
        'numbers': um.numbers,
        'code_objects': um.code_objects,
        'unknown_types': um.unknown_types[:20],
        'parse_depth_reached': um.depth,
    }


# ── CLI + batch processing ──

from npk_config import (
    CORPUS_ROOT as _DEFAULT_CORPUS,
    DECOMPILED_SRC_DIR as _DEFAULT_OUTPUT,
)

CORPUS_ROOT = _DEFAULT_CORPUS
OUTPUT_ROOT = _DEFAULT_OUTPUT

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
    "game_common/live_stock/LiveStockConst.pyc",
    "game_common/data/gun_calibration_affix_option_data.pyc",
    "dcs_extend/const/attr_const.pyc",
    "dcs_extend/component/spring/spring_types.pyc",
]


def main() -> int:
    parser = argparse.ArgumentParser(description='Parse NeoX .pyc files with custom unmarshaller')
    parser.add_argument('--file', type=Path, help='Parse a single file')
    parser.add_argument('--all-priority', action='store_true', help='Parse all priority files')
    parser.add_argument('--output', type=Path, default=OUTPUT_ROOT, help='Output directory')
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)

    if args.file:
        result = parse_neox_pyc(args.file)
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
        return 0

    # Batch process priority files
    files = []
    for rel in PRIORITY_FILES:
        fp = CORPUS_ROOT / rel.replace('/', '\\')
        if fp.exists():
            files.append((fp, rel))
        else:
            print(f"  [MISSING] {rel}")

    print(f"Parsing {len(files)} priority files...")
    t0 = time.time()

    all_results = {}
    for fp, rel in files:
        result = parse_neox_pyc(fp)
        out_path = args.output / rel.replace('.pyc', '.json')
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False, default=str), encoding='utf-8')

        n_strings = len(result.get('strings', []))
        n_code = len(result.get('code_objects', []))
        n_unknown = len(result.get('unknown_types', []))
        print(f"  {rel}: {n_strings} strings, {n_code} code objects, {n_unknown} unknown types")
        all_results[rel] = {
            'strings': n_strings,
            'code_objects': n_code,
            'unknown_types': n_unknown,
        }

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.1f}s. Output: {args.output}")

    # Write summary
    summary_path = args.output / '_neox_parse_summary.json'
    summary_path.write_text(json.dumps(all_results, indent=2, ensure_ascii=False), encoding='utf-8')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
