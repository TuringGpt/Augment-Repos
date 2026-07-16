from importlib import import_module
from typing import Any

_API: dict[str, tuple[str, str | None]] = {
    "AddrSpace": ("vyper.evm.address_space", "AddrSpace"),
    "address_space": ("vyper.evm.address_space", None),
    "AssemblyInstruction": ("vyper.evm.assembler", "AssemblyInstruction"),
    "assembly_to_evm": ("vyper.evm.assembler", "assembly_to_evm"),
    "CALLDATA": ("vyper.evm.address_space", "CALLDATA"),
    "CODE": ("vyper.evm.address_space", "CODE"),
    "CONST": ("vyper.evm.assembler", "CONST"),
    "CONSTREF": ("vyper.evm.assembler", "CONSTREF"),
    "DATA": ("vyper.evm.address_space", "DATA"),
    "DATA_ITEM": ("vyper.evm.assembler", "DATA_ITEM"),
    "DataHeader": ("vyper.evm.assembler", "DataHeader"),
    "EVM_VERSIONS": ("vyper.evm.opcodes", "EVM_VERSIONS"),
    "get_data_segment_lengths": ("vyper.evm.assembler", "get_data_segment_lengths"),
    "get_ir_opcodes": ("vyper.evm.opcodes", "get_ir_opcodes"),
    "get_opcodes": ("vyper.evm.opcodes", "get_opcodes"),
    "IMMUTABLES": ("vyper.evm.address_space", "IMMUTABLES"),
    "JUMP": ("vyper.evm.assembler", "JUMP"),
    "JUMPI": ("vyper.evm.assembler", "JUMPI"),
    "Label": ("vyper.evm.assembler", "Label"),
    "legal_in_staticcall": ("vyper.evm.address_space", "legal_in_staticcall"),
    "MEMORY": ("vyper.evm.address_space", "MEMORY"),
    "mkdebug": ("vyper.evm.assembler", "mkdebug"),
    "opcodes": ("vyper.evm.opcodes", None),
    "optimize_assembly": ("vyper.evm.assembler", "optimize_assembly"),
    "PUSH": ("vyper.evm.assembler", "PUSH"),
    "PUSH_OFST": ("vyper.evm.assembler", "PUSH_OFST"),
    "PUSHLABEL": ("vyper.evm.assembler", "PUSHLABEL"),
    "RETURNDATA": ("vyper.evm.address_space", "RETURNDATA"),
    "resolve_symbols": ("vyper.evm.assembler", "resolve_symbols"),
    "STORAGE": ("vyper.evm.address_space", "STORAGE"),
    "TaggedInstruction": ("vyper.evm.assembler", "TaggedInstruction"),
    "TRANSIENT": ("vyper.evm.address_space", "TRANSIENT"),
    "version_check": ("vyper.evm.opcodes", "version_check"),
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
