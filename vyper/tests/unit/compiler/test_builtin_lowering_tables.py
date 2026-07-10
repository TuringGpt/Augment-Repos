from vyper.builtins._lowering_tables import SHARED_BUILTIN_LOWERINGS
from vyper.builtins.functions import DISPATCH_TABLE, STMT_DISPATCH_TABLE
from vyper.codegen_venom.builtins import BUILTIN_HANDLERS


def test_shared_builtin_lowerings_stay_in_sync():
    for spec in SHARED_BUILTIN_LOWERINGS:
        assert spec.builtin_id in BUILTIN_HANDLERS
        assert (spec.builtin_id in DISPATCH_TABLE) is spec.legacy_expr
        assert (spec.builtin_id in STMT_DISPATCH_TABLE) is spec.legacy_stmt


def test_legacy_only_expr_builtins_are_not_registered_in_venom():
    for builtin_id in ("method_id", "sqrt", "isqrt"):
        assert builtin_id in DISPATCH_TABLE
        assert builtin_id not in BUILTIN_HANDLERS
