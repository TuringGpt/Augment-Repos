import pytest

from tests.conftest import _apply_venom_xfail_marker


class DummyConfig:
    def __init__(self, experimental_codegen):
        self.experimental_codegen = experimental_codegen

    def getoption(self, name):
        assert name == "experimental_codegen"
        return self.experimental_codegen


class DummyItem:
    def __init__(self, experimental_codegen, marker):
        self.config = DummyConfig(experimental_codegen)
        self.marker = marker
        self.added_markers = []

    def get_closest_marker(self, name):
        assert name == "venom_xfail"
        return self.marker

    def add_marker(self, marker):
        self.added_markers.append(marker)


def test_venom_xfail_is_applied_for_experimental_codegen():
    marker = pytest.mark.venom_xfail(reason="venom regression").mark
    item = DummyItem(True, marker)

    _apply_venom_xfail_marker(item)

    [added] = item.added_markers
    assert added.mark.name == "xfail"
    assert added.mark.kwargs == {"reason": "venom regression"}


def test_venom_xfail_is_ignored_for_legacy_codegen():
    marker = pytest.mark.venom_xfail(reason="venom regression").mark
    item = DummyItem(False, marker)

    _apply_venom_xfail_marker(item)

    assert item.added_markers == []