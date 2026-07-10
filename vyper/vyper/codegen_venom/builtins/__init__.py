"""
Built-in function lowering for Venom IR.

Each submodule exports a HANDLERS dict mapping builtin_id -> handler function.
Handler signature: (node: vy_ast.Call, ctx: VenomCodegenContext) -> IROperand | VyperValue

Builtins that return memory-located data (abi_decode, concat, slice, etc.)
should return VyperValue.from_ptr() to preserve location info. Builtins that return
stack values can return IROperand directly.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Union

from vyper.builtins._lowering_tables import build_venom_builtin_table
from vyper.exceptions import CompilerPanic
from vyper.venom.basicblock import IROperand

if TYPE_CHECKING:
    from vyper.codegen_venom.context import VenomCodegenContext

from vyper.codegen_venom.value import VyperValue

from .abi import HANDLERS as ABI_HANDLERS
from .bytes import HANDLERS as BYTES_HANDLERS
from .convert import HANDLERS as CONVERT_HANDLERS
from .create import HANDLERS as CREATE_HANDLERS
from .hashing import HANDLERS as HASHING_HANDLERS
from .math import HANDLERS as MATH_HANDLERS
from .misc import HANDLERS as MISC_HANDLERS
from .simple import HANDLERS as SIMPLE_HANDLERS
from .strings import HANDLERS as STRINGS_HANDLERS
from .system import HANDLERS as SYSTEM_HANDLERS

__all__ = ["BUILTIN_HANDLERS", "lower_builtin"]

BUILTIN_HANDLERS: dict = build_venom_builtin_table(
    {
        "simple": SIMPLE_HANDLERS,
        "math": MATH_HANDLERS,
        "hashing": HASHING_HANDLERS,
        "bytes": BYTES_HANDLERS,
        "convert": CONVERT_HANDLERS,
        "abi": ABI_HANDLERS,
        "system": SYSTEM_HANDLERS,
        "create": CREATE_HANDLERS,
        "misc": MISC_HANDLERS,
        "strings": STRINGS_HANDLERS,
    }
)


def lower_builtin(builtin_id: str, node, ctx) -> Union[IROperand, VyperValue]:
    """
    Lower a built-in function call to Venom IR.

    Args:
        builtin_id: The builtin's _id (e.g., "len", "keccak256")
        node: The vy_ast.Call node
        ctx: VenomCodegenContext

    Returns:
        IROperand for stack values, or VyperValue for memory-located results
    """
    handler = BUILTIN_HANDLERS.get(builtin_id)
    if handler is None:  # pragma: nocover
        raise CompilerPanic(f"Built-in '{builtin_id}' not yet implemented in venom codegen")
    return handler(node, ctx)
