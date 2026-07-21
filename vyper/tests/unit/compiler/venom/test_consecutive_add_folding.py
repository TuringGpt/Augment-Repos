from tests.venom_utils import PrePostChecker
from vyper.venom.passes import ConsecutiveAddFoldingPass, RemoveUnusedVariablesPass

_check_pre_post = PrePostChecker([ConsecutiveAddFoldingPass, RemoveUnusedVariablesPass])


def test_fold_consecutive_add_literals():
    pre = """
    main:
        %x = source
        %tmp = add 255, %x
        %out = add 1, %tmp
        sink %out
    """
    post = """
    main:
        %x = source
        %out = add 256, %x
        sink %out
    """
    _check_pre_post(pre, post)


def test_fold_assigned_constant_operands():
    pre = """
    main:
        %x = source
        %c1 = 10
        %c2 = 20
        %tmp = add %c1, %x
        %out = add %c2, %tmp
        sink %out
    """
    post = """
    main:
        %x = source
        %out = add 30, %x
        sink %out
    """
    _check_pre_post(pre, post)


def test_fold_three_deep_add_chain():
    pre = """
    main:
        %x = source
        %a = add 1, %x
        %b = add 2, %a
        %out = add 3, %b
        sink %out
    """
    post = """
    main:
        %x = source
        %out = add 6, %x
        sink %out
    """
    _check_pre_post(pre, post)


def test_fold_add_constants_to_zero():
    pre = """
    main:
        %x = source
        %tmp = add -1, %x
        %out = add 1, %tmp
        sink %out
    """
    post = """
    main:
        %x = source
        %out = assign %x
        sink %out
    """
    _check_pre_post(pre, post)


def test_fold_stops_at_multi_use_intermediate():
    pre = """
    main:
        %x = source
        %tmp = add 3, %x
        %out = add 5, %tmp
        sink %out, %tmp
    """
    post = """
    main:
        %x = source
        %tmp = add 3, %x
        %out = add 5, %tmp
        sink %out, %tmp
    """
    _check_pre_post(pre, post)
