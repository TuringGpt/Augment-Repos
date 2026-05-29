import pytest

import vyper
from vyper.cli import venom_main


def test_version(capsys):
    with pytest.raises(SystemExit) as exc_info:
        venom_main._parse_args(["--version"])

    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert vyper.__long_version__ in captured.out


def test_run_pass_without_value_lists_passes(capfd):
    venom_main._parse_args(["--run-pass"])

    out, err = capfd.readouterr()
    assert "Available passes:" in out
    assert "simplify-cfg" in out
    assert err == ""


def test_run_pass_ambiguous_prefix_lists_matches(capfd):
    with pytest.raises(SystemExit) as exc_info:
        venom_main._parse_args(["--run-pass", "mem"])

    assert exc_info.value.code == 2
    _, err = capfd.readouterr()
    assert "ambiguous pass name 'mem'" in err.lower()
    assert "mem-merge" in err
    assert "memory-copy-elision" in err
    assert "mem2-var" not in err


def test_run_pass_does_not_swallow_input_file(tmp_path, monkeypatch, capfd):
    path = tmp_path.joinpath("input.venom")
    path.write_text("dummy")

    monkeypatch.setattr(
        venom_main,
        "parse_venom",
        lambda source: pytest.fail("--run-pass should list passes instead of reading input"),
    )

    venom_main._parse_args(["--run-pass", str(path)])

    out, err = capfd.readouterr()
    assert "Available passes:" in out
    assert err == ""


def test_run_pass_unique_prefix_resolves(tmp_path, monkeypatch, capfd):
    path = tmp_path.joinpath("input.venom")
    path.write_text("dummy")

    resolved = {}

    monkeypatch.setattr(venom_main, "parse_venom", lambda source: object())
    monkeypatch.setattr(venom_main, "check_venom_ctx", lambda ctx: None)
    monkeypatch.setattr(
        venom_main,
        "_run_single_pass",
        lambda ctx, pass_spec: resolved.setdefault("pass", pass_spec.cli_name),
    )
    monkeypatch.setattr(venom_main, "generate_assembly_experimental", lambda ctx: [])
    monkeypatch.setattr(venom_main, "generate_bytecode", lambda asm: (b"", {}))

    venom_main._parse_args(["--run-pass", "simplify", str(path)])

    assert resolved["pass"] == "simplify-cfg"
    out, _ = capfd.readouterr()
    assert out.strip() == "0x"