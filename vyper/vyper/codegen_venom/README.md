# Venom Codegen Package

The `codegen_venom` package implements the experimental direct AST-to-Venom IR
pipeline used by `--experimental-codegen`.

## Organization

- `module.py` lowers annotated modules into Venom contexts.
- `expr.py` and `stmt.py` lower expressions and statements.
- `abi/` contains ABI encode/decode lowering helpers.
- `builtins/` contains builtin-specific Venom lowering handlers.

The package maps the compiler's code generation stage to Venom SSA IR. Public
entry points are exported from `vyper.codegen_venom`.