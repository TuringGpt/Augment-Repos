import pytest

from tests.ast_utils import deepequals
from vyper.ast.parse import parse_to_ast
from vyper.exceptions import SyntaxException


def test_ast_equal():
    code = """
@external
def test() -> int128:
    a: uint256 = 100
    return 123
    """

    ast1 = parse_to_ast(code)
    ast2 = parse_to_ast("\n   \n" + code + "\n\n")

    assert deepequals(ast1, ast2)


def test_ast_unequal():
    code1 = """
@external
def test() -> int128:
    a: uint256 = 100
    return 123
    """
    code2 = """
@external
def test() -> int128:
    a: uint256 = 100
    return 121
    """

    ast1 = parse_to_ast(code1)
    ast2 = parse_to_ast(code2)

    assert not deepequals(ast1, ast2)


# Each entry is the misspelled keyword as it would appear in user source,
# followed by the call keyword we expect the hint to suggest.
@pytest.mark.parametrize(
    "typo,expected",
    [
        # staticcall: deletions, insertions, substitutions, transpositions
        ("staticall", "staticcall"),
        ("staticcal", "staticcall"),
        ("staiccall", "staticcall"),
        ("statiocall", "staticcall"),
        ("sttaticcall", "staticcall"),
        ("staticcakl", "staticcall"),
        # extcall: same shapes
        ("extcal", "extcall"),
        ("extcll", "extcall"),
        ("etcall", "extcall"),
        ("exctall", "extcall"),
        ("exttcall", "extcall"),
    ],
)
def test_call_keyword_typo_hint(typo, expected):
    code = f"""
@external
def foo(x: address) -> uint256:
    return {typo} Foo(x).bar()
    """
    with pytest.raises(SyntaxException) as exc_info:
        parse_to_ast(code)

    assert f"did you mean `{expected}`?" in str(exc_info.value)


def test_unrelated_syntax_error_has_no_call_hint():
    # Syntax errors that aren't call-keyword typos must not trigger a hint.
    code = """
@external
def foo() -> uint256:
    return 1 +
    """
    with pytest.raises(SyntaxException) as exc_info:
        parse_to_ast(code)

    msg = str(exc_info.value)
    assert "staticcall" not in msg
    assert "extcall" not in msg
