"""
isort:skip_file
"""

import sys

from vyper.ast import nodes, validation
from vyper.ast.identifiers import validate_identifier
from vyper.ast.natspec import parse_natspec
from vyper.ast.nodes import as_tuple
from vyper.ast.utils import ast_to_dict
from vyper.ast.parse import parse_to_ast
from vyper.ast.validation import validate_call_args

__all__ = [
    "as_tuple",
    "ast_to_dict",
    "natspec",
    "nodes",
    "parse_natspec",
    "parse_to_ast",
    "validate_call_args",
    "validate_identifier",
    "validation",
]

# adds vyper.ast.nodes classes into the local namespace
for name, obj in (
    (k, v) for k, v in nodes.__dict__.items() if type(v) is type and nodes.VyperNode in v.__mro__
):
    setattr(sys.modules[__name__], name, obj)
    __all__.append(name)  # type: ignore[attr-defined]
