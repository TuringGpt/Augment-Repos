# Codegen Package

The `codegen` package implements the production AST-to-s-expression IR stage of
the compiler pipeline.

## Organization

- `module.py` lowers annotated modules into IR.
- `expr.py` and `stmt.py` lower expressions and statements.
- `core.py`, `abi_encoder.py`, and related helpers build reusable IR fragments.
- `function_definitions/` contains external and internal function lowering.

Cross-package callers should use the public API exposed by `vyper.codegen`.
Implementation helpers remain private to this package unless explicitly exported
from `__init__.py`.