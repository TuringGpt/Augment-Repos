import pytest

from vyper.compiler import compile_code
from vyper.exceptions import NamespaceCollision, StructureException


def test_event_with_module_as_member_errors(make_input_bundle):
    top = """
import x
event E:
    f: x
        """
    x = ""

    input_bundle = make_input_bundle({"top.vy": top, "x.vy": x})

    with pytest.raises(StructureException) as e:
        compile_code(top, input_bundle=input_bundle)

    assert "not a valid event member" in str(e.value)


def test_duplicate_event_member_reports_prev_decl():
    code = "event Foo:\n    value: uint256\n    value: uint256\n"

    with pytest.raises(NamespaceCollision) as e:
        compile_code(code)

    assert e.value.annotations[0].lineno == 3
    assert e.value.annotations[0].node_source_code == "value"
    assert e.value.prev_decl.lineno == 2
    assert e.value.prev_decl.node_source_code == "value"
