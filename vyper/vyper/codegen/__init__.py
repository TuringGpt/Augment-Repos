from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "abi_encode": ("vyper.codegen.abi_encoder", "abi_encode"),
    "abi_encoding_matches_vyper": ("vyper.codegen.abi_encoder", "abi_encoding_matches_vyper"),
    "add_ofst": ("vyper.codegen.core", "add_ofst"),
    "bytes_clamp": ("vyper.codegen.core", "bytes_clamp"),
    "bytes_data_ptr": ("vyper.codegen.core", "bytes_data_ptr"),
    "calculate_largest_base": ("vyper.codegen.arithmetic", "calculate_largest_base"),
    "calculate_largest_power": ("vyper.codegen.arithmetic", "calculate_largest_power"),
    "calculate_type_for_external_return": (
        "vyper.codegen.core",
        "calculate_type_for_external_return",
    ),
    "check_buffer_overflow_ir": ("vyper.codegen.core", "check_buffer_overflow_ir"),
    "check_create_operation": ("vyper.codegen.core", "check_create_operation"),
    "check_external_call": ("vyper.codegen.core", "check_external_call"),
    "clamp": ("vyper.codegen.core", "clamp"),
    "clamp2": ("vyper.codegen.core", "clamp2"),
    "clamp_basetype": ("vyper.codegen.core", "clamp_basetype"),
    "clamp_le": ("vyper.codegen.core", "clamp_le"),
    "Context": ("vyper.codegen.context", "Context"),
    "copy_bytes": ("vyper.codegen.core", "copy_bytes"),
    "core": ("vyper.codegen.core", None),
    "create_memory_copy": ("vyper.codegen.core", "create_memory_copy"),
    "dummy_node_for_type": ("vyper.codegen.core", "dummy_node_for_type"),
    "DYNAMIC_ARRAY_OVERHEAD": ("vyper.codegen.core", "DYNAMIC_ARRAY_OVERHEAD"),
    "Encoding": ("vyper.codegen.ir_node", "Encoding"),
    "ensure_eval_once": ("vyper.codegen.core", "ensure_eval_once"),
    "ensure_in_memory": ("vyper.codegen.core", "ensure_in_memory"),
    "EntryPointInfo": ("vyper.codegen.function_definitions", "EntryPointInfo"),
    "eval_seq": ("vyper.codegen.core", "eval_seq"),
    "Expr": ("vyper.codegen.expr", "Expr"),
    "external_call": ("vyper.codegen.external_call", None),
    "function_definitions": ("vyper.codegen.function_definitions", None),
    "get_bytearray_length": ("vyper.codegen.core", "get_bytearray_length"),
    "get_type_for_exact_size": ("vyper.codegen.core", "get_type_for_exact_size"),
    "int_clamp": ("vyper.codegen.core", "int_clamp"),
    "IRnode": ("vyper.codegen.ir_node", "IRnode"),
    "ir_node": ("vyper.codegen.ir_node", None),
    "ir_tuple_from_args": ("vyper.codegen.core", "ir_tuple_from_args"),
    "is_bytes_m_type": ("vyper.codegen.core", "is_bytes_m_type"),
    "is_decimal_type": ("vyper.codegen.core", "is_decimal_type"),
    "is_flag_type": ("vyper.codegen.core", "is_flag_type"),
    "is_integer_type": ("vyper.codegen.core", "is_integer_type"),
    "is_tuple_like": ("vyper.codegen.core", "is_tuple_like"),
    "jumptable_utils": ("vyper.codegen.jumptable_utils", None),
    "keccak256_helper": ("vyper.codegen.keccak256_helper", "keccak256_helper"),
    "LOAD": ("vyper.codegen.core", "LOAD"),
    "make_setter": ("vyper.codegen.core", "make_setter"),
    "module": ("vyper.codegen.module", None),
    "needs_external_call_wrap": ("vyper.codegen.core", "needs_external_call_wrap"),
    "potential_overlap": ("vyper.codegen.core", "potential_overlap"),
    "promote_signed_int": ("vyper.codegen.core", "promote_signed_int"),
    "sar": ("vyper.codegen.core", "sar"),
    "scope_multi": ("vyper.codegen.ir_node", "scope_multi"),
    "self_call": ("vyper.codegen.self_call", None),
    "shl": ("vyper.codegen.core", "shl"),
    "shr": ("vyper.codegen.core", "shr"),
    "STORE": ("vyper.codegen.core", "STORE"),
    "unwrap_location": ("vyper.codegen.core", "unwrap_location"),
    "_FuncIRInfo": ("vyper.codegen.function_definitions", "_FuncIRInfo"),
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
