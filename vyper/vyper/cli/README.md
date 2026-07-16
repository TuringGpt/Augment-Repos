# CLI Package

The `cli` package contains command-line entry points for compiling Vyper source,
working with JSON compiler input, and inspecting intermediate IR forms.

## Organization

- `vyper_compile.py` implements the primary `vyper` command.
- `vyper_json.py` handles standard JSON compiler input.
- `vyper_ir.py` and `venom_main.py` expose IR-oriented developer commands.
- `compile_archive.py` supports archive compilation workflows.

The CLI delegates compilation to `vyper.compiler` and should not bypass compiler
pipeline APIs from later stages.