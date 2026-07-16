# EVM Package

The `evm` package contains EVM-specific compiler support used after IR lowering.

## Organization

- `opcodes.py` defines opcode tables and EVM-version checks.
- `address_space.py` models EVM data locations used during code generation.
- `assembler/` converts assembly instructions into bytecode and optimizes
  assembly-level output.

Other packages should depend on the root `vyper.evm` API rather than importing
assembler or opcode implementation modules directly.