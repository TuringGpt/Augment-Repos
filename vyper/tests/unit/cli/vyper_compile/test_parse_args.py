import os
import warnings

import pytest

import vyper
import vyper.cli.vyper_compile as vyper_compile
from vyper.cli.vyper_compile import _parse_args
from vyper.compiler.settings import OptimizationLevel, Settings
from vyper.warnings import VyperWarning


@pytest.fixture
def chdir_path(tmp_path):
    orig_path = os.getcwd()
    yield tmp_path
    os.chdir(orig_path)


def test_paths(chdir_path):
    code = """
@external
def foo() -> bool:
    return True
"""
    bar_path = chdir_path.joinpath("bar.vy")
    with bar_path.open("w") as fp:
        fp.write(code)

    _parse_args([str(bar_path)])  # absolute path
    os.chdir(chdir_path.parent)

    _parse_args([str(bar_path)])  # absolute path, subfolder of cwd
    _parse_args([str(bar_path.relative_to(chdir_path.parent))])  # relative path


def test_warnings(make_file):
    """
    test -Werror and -Wnone
    """
    # test code which emits warnings
    code = """
x: public(uint256[2**64])
    """
    path = make_file("foo.vy", code)
    path_str = str(path)

    with warnings.catch_warnings(record=True) as w:
        _parse_args([str(path)])

    with pytest.raises(VyperWarning) as e:
        _parse_args([path_str, "-Werror"])

    assert len(w) == 1
    warning_message = w[0].message.message

    assert e.value.message == warning_message

    # test squashing warnings
    with warnings.catch_warnings(record=True) as w:
        _parse_args([path_str, "-Wnone"])
    assert len(w) == 0

    warnings.resetwarnings()


def test_version(capsys):
    with pytest.raises(SystemExit) as exc_info:
        _parse_args(["--version"])

    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert vyper.__long_version__ in captured.out


def test_cli_uses_shared_settings_constructor(monkeypatch, make_file):
    path = make_file(
        "foo.vy",
        """
@external
def foo() -> bool:
    return True
        """,
    )
    captured = {}

    def _fake_compile_files(*args, **kwargs):
        captured["settings"] = args[5]
        return {}

    monkeypatch.setattr(vyper_compile, "compile_files", _fake_compile_files)
    monkeypatch.setattr(vyper_compile, "_cli_helper", lambda *args, **kwargs: None)

    _parse_args(
        [
            str(path),
            "-O",
            "3",
            "--evm-version",
            "cancun",
            "--experimental-codegen",
            "--debug",
            "--enable-decimals",
            "--disable-static-exceptions",
            "--disable-inlining",
            "--disable-cse",
            "--disable-sccp",
            "--disable-load-elimination",
            "--disable-dead-store-elimination",
            "--inline-threshold",
            "99",
        ]
    )

    assert captured["settings"] == Settings.from_compilation_options(
        optimize=OptimizationLevel.O3,
        evm_version="cancun",
        experimental_codegen=True,
        debug=True,
        enable_decimals=True,
        disable_static_exceptions=True,
        venom_kwargs={
            "disable_inlining": True,
            "disable_cse": True,
            "disable_sccp": True,
            "disable_load_elimination": True,
            "disable_dead_store_elimination": True,
            "inline_threshold": 99,
        },
    )
