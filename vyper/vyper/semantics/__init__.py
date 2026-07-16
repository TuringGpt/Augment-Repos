from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "AddressT": ("vyper.semantics.types", "AddressT"),
    "analyze_modules": ("vyper.semantics.analysis", "analyze_modules"),
    "BoolT": ("vyper.semantics.types", "BoolT"),
    "BYTES32_T": ("vyper.semantics.types", "BYTES32_T"),
    "BYTES4_T": ("vyper.semantics.types", "BYTES4_T"),
    "BytesM_T": ("vyper.semantics.types", "BytesM_T"),
    "BytesT": ("vyper.semantics.types", "BytesT"),
    "check_modifiability": ("vyper.semantics.analysis", "check_modifiability"),
    "ContractFunctionT": ("vyper.semantics.types", "ContractFunctionT"),
    "DArrayT": ("vyper.semantics.types", "DArrayT"),
    "DataLocation": ("vyper.semantics.data_locations", "DataLocation"),
    "DecimalT": ("vyper.semantics.types", "DecimalT"),
    "EventT": ("vyper.semantics.types", "EventT"),
    "environment": ("vyper.semantics.environment", None),
    "FlagT": ("vyper.semantics.types", "FlagT"),
    "FunctionVisibility": ("vyper.semantics.types", "FunctionVisibility"),
    "generate_layout_export": ("vyper.semantics.analysis", "generate_layout_export"),
    "get_common_types": ("vyper.semantics.analysis", "get_common_types"),
    "get_exact_type_from_node": ("vyper.semantics.analysis", "get_exact_type_from_node"),
    "get_expr_writes": ("vyper.semantics.analysis", "get_expr_writes"),
    "get_namespace": ("vyper.semantics.namespace", "get_namespace"),
    "get_possible_types_from_node": ("vyper.semantics.analysis", "get_possible_types_from_node"),
    "HashMapT": ("vyper.semantics.types", "HashMapT"),
    "INT256_T": ("vyper.semantics.types", "INT256_T"),
    "IntegerT": ("vyper.semantics.types", "IntegerT"),
    "InterfaceT": ("vyper.semantics.types", "InterfaceT"),
    "is_type_t": ("vyper.semantics.types", "is_type_t"),
    "KwargSettings": ("vyper.semantics.types", "KwargSettings"),
    "MemberFunctionT": ("vyper.semantics.types", "MemberFunctionT"),
    "Modifiability": ("vyper.semantics.analysis", "Modifiability"),
    "ModuleT": ("vyper.semantics.types", "ModuleT"),
    "override_global_namespace": ("vyper.semantics.namespace", "override_global_namespace"),
    "resolve_imports": ("vyper.semantics.analysis", "resolve_imports"),
    "SArrayT": ("vyper.semantics.types", "SArrayT"),
    "set_data_positions": ("vyper.semantics.analysis", "set_data_positions"),
    "StateMutability": ("vyper.semantics.types", "StateMutability"),
    "StringT": ("vyper.semantics.types", "StringT"),
    "StructT": ("vyper.semantics.types", "StructT"),
    "TupleT": ("vyper.semantics.types", "TupleT"),
    "type_from_annotation": ("vyper.semantics.types", "type_from_annotation"),
    "types": ("vyper.semantics.types", None),
    "TYPE_T": ("vyper.semantics.types", "TYPE_T"),
    "UINT160_T": ("vyper.semantics.types", "UINT160_T"),
    "UINT256_T": ("vyper.semantics.types", "UINT256_T"),
    "UINT8_T": ("vyper.semantics.types", "UINT8_T"),
    "validate_compilation_target": ("vyper.semantics.analysis", "validate_compilation_target"),
    "validate_expected_type": ("vyper.semantics.analysis", "validate_expected_type"),
    "VOID_TYPE": ("vyper.semantics.types", "VOID_TYPE"),
    "VyperType": ("vyper.semantics.types", "VyperType"),
    "_BytestringT": ("vyper.semantics.types", "_BytestringT"),
}

__all__ = sorted(_API)


def __getattr__(name: str) -> Any:
    try:
        module_name, attr_name = _API[name]
    except KeyError as exc:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}") from exc

    module = import_module(module_name)
    value = module if attr_name is None else getattr(module, attr_name)
    globals()[name] = value
    return value
