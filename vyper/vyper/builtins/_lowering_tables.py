from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class SharedBuiltinLowering:
    """Describe how a builtin is registered across lowering backends.

    Parameters:
        builtin_id: The Vyper builtin name used by the semantic/type layer.
        venom_group: The Venom handler group that must contain the builtin.
        legacy_expr: Whether the builtin belongs in the legacy expression table.
        legacy_stmt: Whether the builtin belongs in the legacy statement table.
    """

    builtin_id: str
    venom_group: str
    legacy_expr: bool = False
    legacy_stmt: bool = False


SHARED_BUILTIN_LOWERINGS = (
    SharedBuiltinLowering("abi_encode", "abi", legacy_expr=True),
    SharedBuiltinLowering("abi_decode", "abi", legacy_expr=True),
    SharedBuiltinLowering("_abi_encode", "abi", legacy_expr=True),
    SharedBuiltinLowering("_abi_decode", "abi", legacy_expr=True),
    SharedBuiltinLowering("floor", "misc", legacy_expr=True),
    SharedBuiltinLowering("ceil", "misc", legacy_expr=True),
    SharedBuiltinLowering("convert", "convert", legacy_expr=True),
    SharedBuiltinLowering("slice", "bytes", legacy_expr=True),
    SharedBuiltinLowering("len", "simple", legacy_expr=True),
    SharedBuiltinLowering("concat", "bytes", legacy_expr=True),
    SharedBuiltinLowering("sha256", "hashing", legacy_expr=True),
    SharedBuiltinLowering("keccak256", "hashing", legacy_expr=True),
    SharedBuiltinLowering("ecrecover", "misc", legacy_expr=True),
    SharedBuiltinLowering("ecadd", "misc", legacy_expr=True),
    SharedBuiltinLowering("ecmul", "misc", legacy_expr=True),
    SharedBuiltinLowering("extract32", "bytes", legacy_expr=True),
    SharedBuiltinLowering("as_wei_value", "misc", legacy_expr=True),
    SharedBuiltinLowering("raw_call", "system", legacy_expr=True, legacy_stmt=True),
    SharedBuiltinLowering("blockhash", "misc", legacy_expr=True),
    SharedBuiltinLowering("blobhash", "misc", legacy_expr=True),
    SharedBuiltinLowering("uint256_addmod", "math", legacy_expr=True),
    SharedBuiltinLowering("uint256_mulmod", "math", legacy_expr=True),
    SharedBuiltinLowering("unsafe_add", "math", legacy_expr=True),
    SharedBuiltinLowering("unsafe_sub", "math", legacy_expr=True),
    SharedBuiltinLowering("unsafe_mul", "math", legacy_expr=True),
    SharedBuiltinLowering("unsafe_div", "math", legacy_expr=True),
    SharedBuiltinLowering("pow_mod256", "math", legacy_expr=True),
    SharedBuiltinLowering("uint2str", "strings", legacy_expr=True),
    SharedBuiltinLowering("shift", "math", legacy_expr=True),
    SharedBuiltinLowering("create_minimal_proxy_to", "create", legacy_expr=True, legacy_stmt=True),
    SharedBuiltinLowering("create_forwarder_to", "create", legacy_expr=True, legacy_stmt=True),
    SharedBuiltinLowering("create_copy_of", "create", legacy_expr=True, legacy_stmt=True),
    SharedBuiltinLowering("create_from_blueprint", "create", legacy_expr=True, legacy_stmt=True),
    SharedBuiltinLowering("min", "simple", legacy_expr=True),
    SharedBuiltinLowering("max", "simple", legacy_expr=True),
    SharedBuiltinLowering("empty", "simple", legacy_expr=True),
    SharedBuiltinLowering("abs", "simple", legacy_expr=True),
    SharedBuiltinLowering("min_value", "misc", legacy_expr=True),
    SharedBuiltinLowering("max_value", "misc", legacy_expr=True),
    SharedBuiltinLowering("epsilon", "misc", legacy_expr=True),
    SharedBuiltinLowering("send", "system", legacy_stmt=True),
    SharedBuiltinLowering("print", "misc", legacy_stmt=True),
    SharedBuiltinLowering("breakpoint", "misc", legacy_stmt=True),
    SharedBuiltinLowering("selfdestruct", "system", legacy_stmt=True),
    SharedBuiltinLowering("raw_create", "create", legacy_stmt=True),
    SharedBuiltinLowering("raw_log", "system", legacy_stmt=True),
    SharedBuiltinLowering("raw_revert", "system", legacy_stmt=True),
)

VENOM_BUILTIN_GROUP_ORDER = (
    "simple",
    "math",
    "hashing",
    "bytes",
    "convert",
    "abi",
    "system",
    "create",
    "misc",
    "strings",
)


def build_legacy_builtin_table(
    *,
    include_expr: bool,
    factories: Mapping[str, Callable[[], T]],
    extra_factories: Mapping[str, Callable[[], T]] | None = None,
) -> dict[str, T]:
    """Build a legacy builtin dispatch table from shared lowering metadata.

    Parameters:
        include_expr: When true, build the expression table; otherwise build the
            statement table.
        factories: Constructors for builtins covered by the shared metadata.
        extra_factories: Constructors for legacy-only builtins to append.

    Returns:
        A mapping from builtin ID to a freshly constructed legacy builtin handler.
    """

    flag = "legacy_expr" if include_expr else "legacy_stmt"
    builtin_ids = [spec.builtin_id for spec in SHARED_BUILTIN_LOWERINGS if getattr(spec, flag)]
    if extra_factories:
        builtin_ids.extend(extra_factories)

    merged_factories = dict(factories)
    if extra_factories:
        merged_factories.update(extra_factories)

    missing = [builtin_id for builtin_id in builtin_ids if builtin_id not in merged_factories]
    if missing:
        raise ValueError(f"Missing builtin lowerings: {missing}")

    return {builtin_id: merged_factories[builtin_id]() for builtin_id in builtin_ids}


def build_venom_builtin_table(group_handlers: Mapping[str, Mapping[str, T]]) -> dict[str, T]:
    """Build the combined Venom builtin handler table and validate its groups.

    Parameters:
        group_handlers: Per-group Venom handler mappings keyed by group name.

    Returns:
        A combined mapping from builtin ID to Venom lowering handler.
    """

    expected_groups = set(VENOM_BUILTIN_GROUP_ORDER)
    seen_groups = set(group_handlers)
    if seen_groups != expected_groups:
        raise ValueError(
            f"Unexpected venom builtin groups: missing={sorted(expected_groups - seen_groups)} "
            f"extra={sorted(seen_groups - expected_groups)}"
        )

    builtin_handlers: dict[str, T] = {}
    for group_name in VENOM_BUILTIN_GROUP_ORDER:
        handlers = group_handlers[group_name]
        expected_ids = {
            spec.builtin_id for spec in SHARED_BUILTIN_LOWERINGS if spec.venom_group == group_name
        }
        if set(handlers) != expected_ids:
            raise ValueError(
                f"Venom builtin group '{group_name}' mismatch: "
                f"expected={sorted(expected_ids)} actual={sorted(handlers)}"
            )
        builtin_handlers.update(handlers)

    return builtin_handlers
