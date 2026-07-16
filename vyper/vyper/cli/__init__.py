from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "vyper_compile": ("vyper.cli.vyper_compile", None),
    "vyper_ir": ("vyper.cli.vyper_ir", None),
    "vyper_json": ("vyper.cli.vyper_json", None),
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
