#!/usr/bin/env python3
import argparse
import inspect
import re
import sys
from dataclasses import dataclass

import vyper
import vyper.evm.opcodes as evm
from vyper.compiler.phases import generate_bytecode
from vyper.compiler.settings import (
    OptimizationLevel,
    Settings,
    VenomOptimizationFlags,
    set_global_settings,
)
from vyper.venom.analysis import IRAnalysesCache
from vyper.venom import passes as venom_passes
from vyper.venom import generate_assembly_experimental, run_passes_on
from vyper.venom.check_venom import check_venom_ctx
from vyper.venom.parser import parse_venom
from vyper.venom.passes.base_pass import IRGlobalPass, IRPass

"""
Standalone entry point into venom compiler. Parses venom input and emits
bytecode.
"""


@dataclass(frozen=True)
class _PassSpec:
    cli_name: str
    pass_cls: type[IRPass] | type[IRGlobalPass]


def _normalize_pass_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def _pass_cli_name(pass_cls: type[IRPass] | type[IRGlobalPass]) -> str:
    name = pass_cls.__name__.removesuffix("Pass")
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1-\2", name)
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", name)
    return name.lower()


def _pass_lookup_names(pass_spec: _PassSpec) -> tuple[str, ...]:
    pass_name = pass_spec.pass_cls.__name__.removesuffix("Pass")
    return (
        _normalize_pass_name(pass_spec.cli_name),
        _normalize_pass_name(pass_name),
        _normalize_pass_name(pass_spec.pass_cls.__name__),
    )


def _pass_has_required_args(pass_cls: type[IRPass]) -> bool:
    params = inspect.signature(pass_cls.run_pass).parameters.values()
    required_params = [
        param
        for param in params
        if param.name != "self"
        and param.default is inspect.Parameter.empty
        and param.kind
        in (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD)
    ]
    return len(required_params) > 0


def _iter_supported_passes() -> list[_PassSpec]:
    pass_specs: list[_PassSpec] = []
    for pass_cls in vars(venom_passes).values():
        if not inspect.isclass(pass_cls) or not issubclass(pass_cls, (IRPass, IRGlobalPass)):
            continue

        if issubclass(pass_cls, IRGlobalPass):
            if pass_cls is not venom_passes.FunctionInlinerPass:
                continue
        elif _pass_has_required_args(pass_cls):
            continue

        pass_specs.append(_PassSpec(cli_name=_pass_cli_name(pass_cls), pass_cls=pass_cls))

    return sorted(pass_specs, key=lambda pass_spec: pass_spec.cli_name)


def _format_available_passes() -> str:
    pass_names = "\n".join(f"  {pass_spec.cli_name}" for pass_spec in _iter_supported_passes())
    return f"Available passes:\n{pass_names}"


def _resolve_run_pass(run_pass: str) -> _PassSpec:
    normalized = _normalize_pass_name(run_pass)
    pass_specs = _iter_supported_passes()

    exact_matches = [
        pass_spec for pass_spec in pass_specs if normalized in _pass_lookup_names(pass_spec)
    ]
    if len(exact_matches) == 1:
        return exact_matches[0]

    prefix_matches = [
        pass_spec
        for pass_spec in pass_specs
        if any(name.startswith(normalized) for name in _pass_lookup_names(pass_spec))
    ]

    if len(prefix_matches) == 1:
        return prefix_matches[0]

    if prefix_matches:
        match_names = ", ".join(pass_spec.cli_name for pass_spec in prefix_matches)
        raise ValueError(f"Ambiguous pass name '{run_pass}'. Matches: {match_names}")

    raise ValueError(f"Unknown pass name '{run_pass}'.\n{_format_available_passes()}")


def _run_single_pass(ctx, pass_spec: _PassSpec) -> None:
    if issubclass(pass_spec.pass_cls, IRGlobalPass):
        analyses = {fn: IRAnalysesCache(fn) for fn in ctx.functions.values()}
        pass_spec.pass_cls(analyses, ctx, VenomOptimizationFlags()).run_pass()
        return

    for fn in ctx.functions.values():
        pass_spec.pass_cls(IRAnalysesCache(fn), fn).run_pass()


def _parse_cli_args():
    return _parse_args(sys.argv[1:])


def _parse_args(argv: list[str]):
    parser = argparse.ArgumentParser(
        description="Venom EVM IR parser & compiler", formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("input_file", help="Venom sourcefile", nargs="?")
    parser.add_argument("--version", action="version", version=vyper.__long_version__)
    parser.add_argument(
        "--evm-version",
        help=f"Select desired EVM version (default {evm.DEFAULT_EVM_VERSION})",
        choices=list(evm.EVM_VERSIONS),
        dest="evm_version",
    )
    parser.add_argument(
        "--stdin", action="store_true", help="whether to pull venom input from stdin"
    )
    parser.add_argument(
        "--run-pass",
        nargs="?",
        const="",
        metavar="PASS",
        help="Run a single Venom pass. Unique prefixes are accepted; omit PASS to list passes.",
    )

    args = parser.parse_args(argv)

    if args.run_pass is not None and args.run_pass.lower() in {"", "help", "list"}:
        print(_format_available_passes())
        return

    selected_pass = None
    if args.run_pass is not None:
        try:
            selected_pass = _resolve_run_pass(args.run_pass)
        except ValueError as exc:
            parser.error(str(exc))

    if args.evm_version is not None:
        set_global_settings(Settings(evm_version=args.evm_version))

    if args.stdin:
        if not sys.stdin.isatty():
            venom_source = sys.stdin.read()
        else:
            # No input provided
            print("Error: --stdin flag used but no input provided")
            sys.exit(1)
    else:
        if args.input_file is None:
            print("Error: No input file provided, either use --stdin or provide a path")
            sys.exit(1)
        with open(args.input_file, "r") as f:
            venom_source = f.read()

    ctx = parse_venom(venom_source)

    check_venom_ctx(ctx)

    if selected_pass is None:
        flags = VenomOptimizationFlags(level=OptimizationLevel.default())
        run_passes_on(ctx, flags)
    else:
        _run_single_pass(ctx, selected_pass)

    asm = generate_assembly_experimental(ctx)
    bytecode, _ = generate_bytecode(asm)
    print(f"0x{bytecode.hex()}")


if __name__ == "__main__":
    _parse_args(sys.argv[1:])
