import pytest

from vyper.builtins._lowering_tables import (
    SHARED_BUILTIN_LOWERINGS,
    VENOM_BUILTIN_GROUP_ORDER,
    build_legacy_builtin_table,
    build_venom_builtin_table,
)
from vyper.builtins.functions import DISPATCH_TABLE, STMT_DISPATCH_TABLE
from vyper.codegen_venom.builtins import BUILTIN_HANDLERS


def _shared_factories_without(missing_builtin_id):
    return {
        spec.builtin_id: object
        for spec in SHARED_BUILTIN_LOWERINGS
        if spec.builtin_id != missing_builtin_id
    }


def _shared_factories_with_extra(extra_builtin_id):
    factories = {spec.builtin_id: object for spec in SHARED_BUILTIN_LOWERINGS}
    factories[extra_builtin_id] = object
    return factories


def _venom_group_handlers():
    return {
        group_name: {
            spec.builtin_id: object()
            for spec in SHARED_BUILTIN_LOWERINGS
            if spec.venom_group == group_name
        }
        for group_name in VENOM_BUILTIN_GROUP_ORDER
    }


def test_shared_builtin_lowerings_stay_in_sync():
    for spec in SHARED_BUILTIN_LOWERINGS:
        assert spec.builtin_id in BUILTIN_HANDLERS
        assert (spec.builtin_id in DISPATCH_TABLE) is spec.legacy_expr
        assert (spec.builtin_id in STMT_DISPATCH_TABLE) is spec.legacy_stmt


def test_legacy_only_expr_builtins_are_not_registered_in_venom():
    for builtin_id in ("method_id", "sqrt", "isqrt"):
        assert builtin_id in DISPATCH_TABLE
        assert builtin_id not in BUILTIN_HANDLERS


def test_build_legacy_builtin_table_reports_missing_builtin():
    with pytest.raises(ValueError, match="Missing builtin lowerings: \\['len'\\]"):
        build_legacy_builtin_table(include_expr=True, factories=_shared_factories_without("len"))


def test_build_legacy_builtin_table_reports_unexpected_factory_builtin():
    with pytest.raises(
        ValueError, match="Unexpected builtin lowerings in factories: \\['_unexpected'\\]"
    ):
        build_legacy_builtin_table(
            include_expr=True, factories=_shared_factories_with_extra("_unexpected")
        )


def test_build_venom_builtin_table_reports_group_mismatch():
    group_handlers = _venom_group_handlers()
    group_handlers.pop("math")
    group_handlers["unexpected"] = {}

    with pytest.raises(
        ValueError,
        match="Unexpected venom builtin groups: missing=\\['math'\\] extra=\\['unexpected'\\]",
    ):
        build_venom_builtin_table(group_handlers)


def test_build_venom_builtin_table_reports_builtin_mismatch():
    group_handlers = _venom_group_handlers()
    group_handlers["simple"].pop("len")

    with pytest.raises(ValueError, match="Venom builtin group 'simple' mismatch: .*'len'"):
        build_venom_builtin_table(group_handlers)
