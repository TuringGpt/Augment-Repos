# Builtins Package

The `builtins` package contains compiler support for Vyper built-in functions,
interfaces, and standard-library modules.

## Organization

- `_signatures.py` defines type-level builtin function signatures.
- `functions.py` contains builtin function implementations used during semantic
  analysis and code generation.
- `interfaces/` contains built-in interface definitions.
- `stdlib/` contains standard-library module sources.

Other compiler stages should import built-in functionality from the package root
API in `vyper.builtins` instead of importing implementation modules directly.