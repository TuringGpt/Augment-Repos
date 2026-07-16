from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "FunctionVisibility": ("vyper.semantics.analysis.base", "FunctionVisibility"),
    "Modifiability": ("vyper.semantics.analysis.base", "Modifiability"),
    "StateMutability": ("vyper.semantics.analysis.base", "StateMutability"),
    "analyze_modules": ("vyper.semantics.analysis.module", "analyze_modules"),
    "check_modifiability": ("vyper.semantics.analysis.utils", "check_modifiability"),
    "generate_layout_export": ("vyper.semantics.analysis.data_positions", "generate_layout_export"),
    "get_common_types": ("vyper.semantics.analysis.utils", "get_common_types"),
    "get_exact_type_from_node": ("vyper.semantics.analysis.utils", "get_exact_type_from_node"),
    "get_expr_writes": ("vyper.semantics.analysis.utils", "get_expr_writes"),
    "get_possible_types_from_node": (
        "vyper.semantics.analysis.utils",
        "get_possible_types_from_node",
    ),
    "resolve_imports": ("vyper.semantics.analysis.imports", "resolve_imports"),
    "set_data_positions": ("vyper.semantics.analysis.data_positions", "set_data_positions"),
    "types": ("vyper.semantics.types", None),
    "validate_compilation_target": (
        "vyper.semantics.analysis.global_",
        "validate_compilation_target",
    ),
    "validate_expected_type": ("vyper.semantics.analysis.utils", "validate_expected_type"),
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
