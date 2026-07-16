from vyper.codegen.function_definitions.common import EntryPointInfo, _FuncIRInfo
from vyper.codegen.function_definitions.external_function import generate_ir_for_external_function
from vyper.codegen.function_definitions.internal_function import generate_ir_for_internal_function

__all__ = [
    "EntryPointInfo",
    "generate_ir_for_external_function",
    "generate_ir_for_internal_function",
    "_FuncIRInfo",
]
