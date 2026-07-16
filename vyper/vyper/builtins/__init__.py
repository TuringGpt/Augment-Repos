from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "AsWeiValue": ("vyper.builtins.functions", "AsWeiValue"),
    "BuiltinFunctionT": ("vyper.builtins._signatures", "BuiltinFunctionT"),
    "get_builtin_functions": ("vyper.builtins.functions", "get_builtin_functions"),
    "interfaces": ("vyper.builtins.interfaces", None),
    "RawCall": ("vyper.builtins.functions", "RawCall"),
    "stdlib": ("vyper.builtins.stdlib", None),
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
