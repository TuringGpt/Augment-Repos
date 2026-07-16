from vyper.semantics.types import primitives, subscriptable, user
from vyper.semantics.types.base import (
    TYPE_T,
    VOID_TYPE,
    KwargSettings,
    VyperType,
    is_type_t,
    map_void,
)
from vyper.semantics.types.bytestrings import BytesT, StringT, _BytestringT
from vyper.semantics.types.function import (
    ContractFunctionT,
    FunctionVisibility,
    MemberFunctionT,
    StateMutability,
)
from vyper.semantics.types.module import InterfaceT, ModuleT
from vyper.semantics.types.primitives import AddressT, BoolT, BytesM_T, DecimalT, IntegerT, SelfT
from vyper.semantics.types.shortcuts import (
    BYTES4_T,
    BYTES32_T,
    INT256_T,
    UINT8_T,
    UINT160_T,
    UINT256_T,
)
from vyper.semantics.types.subscriptable import DArrayT, HashMapT, SArrayT, TupleT
from vyper.semantics.types.user import EventT, FlagT, StructT
from vyper.semantics.types.utils import type_from_annotation

__all__ = [
    "AddressT",
    "BoolT",
    "BYTES32_T",
    "BYTES4_T",
    "BytesM_T",
    "BytesT",
    "ContractFunctionT",
    "DArrayT",
    "DecimalT",
    "EventT",
    "FlagT",
    "FunctionVisibility",
    "HashMapT",
    "INT256_T",
    "IntegerT",
    "InterfaceT",
    "is_type_t",
    "KwargSettings",
    "map_void",
    "MemberFunctionT",
    "ModuleT",
    "PRIMITIVE_TYPES",
    "primitives",
    "SArrayT",
    "SelfT",
    "StateMutability",
    "StringT",
    "StructT",
    "subscriptable",
    "TupleT",
    "type_from_annotation",
    "TYPE_T",
    "UINT160_T",
    "UINT256_T",
    "UINT8_T",
    "user",
    "VOID_TYPE",
    "VyperType",
    "_BytestringT",
]


def _get_primitive_types():
    res = [BoolT(), DecimalT()]

    res.extend(IntegerT.all())
    res.extend(BytesM_T.all())

    # order of the types matters!
    # parsing of literal hex: prefer address over bytes20
    res.append(AddressT())

    # note: since bytestrings are parametrizable, the *class* objects
    # are in the namespace instead of concrete type objects.
    res.extend([BytesT, StringT])

    ret = {t._id: t for t in res}
    ret.update(_get_sequence_types())

    return ret


def _get_sequence_types():
    # since these guys are parametrizable, the *class* objects
    # are in the namespace instead of concrete type objects.

    res = [HashMapT, DArrayT]

    ret = {t._id: t for t in res}

    # (static) arrays and tuples are special types which don't show up
    # in the type annotation itself.
    # since we don't have special handling of annotations in the parser,
    # break a dependency cycle by injecting these into the namespace with
    # mangled names (that no user can create).
    ret["$SArrayT"] = SArrayT
    ret["$TupleT"] = TupleT

    return ret


# note: it might be good to make this a frozen dict of some sort
PRIMITIVE_TYPES = _get_primitive_types()
