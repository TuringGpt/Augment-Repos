import ast as python_ast
from typing import Any, Optional, Union

from vyper.ast import nodes, validation
from vyper.ast.identifiers import validate_identifier as validate_identifier
from vyper.ast.natspec import parse_natspec as parse_natspec
from vyper.ast.nodes import *
from vyper.ast.nodes import as_tuple as as_tuple
from vyper.ast.parse import parse_to_ast as parse_to_ast
from vyper.ast.utils import ast_to_dict as ast_to_dict
from vyper.ast.validation import validate_call_args as validate_call_args
