import pytest

import vyper


def test_enum_usage_warning():
    code = """
enum Foo:
    Fe
    Fi
    Fo

@external
def foo() -> Foo:
    return Foo.Fe
    """
    expected = "enum will be deprecated in a future release. "
    expected += "`enum` already uses flag semantics, so rename the declaration "
    expected += "to `flag` to preserve current behavior. Example:\n"
    expected += "```\nflag Foo:\n    Fe\n    Fi\n    Fo\n```"

    with pytest.warns(vyper.warnings.EnumUsage) as warnings:
        vyper.compile_code(code)

    assert len(warnings) == 1
    assert str(warnings[0].message).startswith(expected)
