#!/usr/bin/env python3
import argparse
import json
import sys

import vyper
from vyper.builtins.functions import DISPATCH_TABLE, STMT_DISPATCH_TABLE


def _parse_cli_args():
    return _parse_args(sys.argv[1:])


def _parse_args(argv):
    parser = argparse.ArgumentParser(
        description="List all Vyper builtin functions",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument("--version", action="version", version=vyper.__long_version__)
    parser.add_argument(
        "-f",
        "--format",
        choices=["list", "json"],
        default="list",
        dest="format",
        help="Output format (default: list)\n"
        "  list  - plain text, one name per line\n"
        "  json  - JSON object with 'expression' and 'statement' arrays",
    )

    args = parser.parse_args(argv)

    # Collect names by category, preserving insertion order then sorting
    expr_names = sorted(DISPATCH_TABLE.keys())
    stmt_names = sorted(STMT_DISPATCH_TABLE.keys())

    if args.format == "json":
        output = {"expression": expr_names, "statement": stmt_names}
        print(json.dumps(output, indent=2))
    else:
        print("expression builtins:")
        for name in expr_names:
            print(f"  {name}")
        print()
        print("statement builtins:")
        for name in stmt_names:
            print(f"  {name}")


if __name__ == "__main__":
    _parse_cli_args()
