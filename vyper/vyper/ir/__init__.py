from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "AssemblyInstruction": ("vyper.ir.compile_ir", "AssemblyInstruction"),
    "assembly_to_evm": ("vyper.ir.compile_ir", "assembly_to_evm"),
    "COMMUTATIVE_OPS": ("vyper.ir.optimizer", "COMMUTATIVE_OPS"),
    "compile_ir": ("vyper.ir.compile_ir", None),
    "Label": ("vyper.ir.compile_ir", "Label"),
    "optimize": ("vyper.ir.optimizer", "optimize"),
    "optimize_assembly": ("vyper.ir.compile_ir", "optimize_assembly"),
    "optimizer": ("vyper.ir.optimizer", None),
    "parse_s_exp": ("vyper.ir.s_expressions", "parse_s_exp"),
    "PUSH": ("vyper.ir.compile_ir", "PUSH"),
    "PUSH_OFST": ("vyper.ir.compile_ir", "PUSH_OFST"),
    "PUSHLABEL": ("vyper.ir.compile_ir", "PUSHLABEL"),
    "TaggedInstruction": ("vyper.ir.compile_ir", "TaggedInstruction"),
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
