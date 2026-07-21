from tests.venom_utils import parse_from_basic_block
from vyper.cli import venom_main
from vyper.compiler.settings import OptimizationLevel, VenomOptimizationFlags
from vyper.venom import run_passes_on


def test_time_passes_prints_timings(tmp_path, capfd, monkeypatch):
    source_path = tmp_path.joinpath("input.venom")
    source_path.write_text("venom source")

    ctx = object()
    asm = object()

    monkeypatch.setattr(venom_main, "parse_venom", lambda source: ctx)
    monkeypatch.setattr(venom_main, "check_venom_ctx", lambda ctx_arg: None)
    monkeypatch.setattr(venom_main, "generate_assembly_experimental", lambda ctx_arg: asm)
    monkeypatch.setattr(venom_main, "generate_bytecode", lambda asm_arg: (b"\x60", None))

    def fake_run_passes_on(ctx_arg, flags, pass_timing_callback=None):
        assert ctx_arg is ctx
        assert isinstance(flags, VenomOptimizationFlags)
        assert pass_timing_callback is not None
        pass_timing_callback("main:SimplifyCFGPass", 0.00123)
        pass_timing_callback("main:CSE", 0.01)

    monkeypatch.setattr(venom_main, "run_passes_on", fake_run_passes_on)

    venom_main._parse_args([str(source_path), "--time-passes"])

    out, err = capfd.readouterr()
    assert out == "0x60\n"
    assert "Venom pass timings:" in err
    assert "main:SimplifyCFGPass" in err
    assert "main:CSE" in err
    assert "1.230 ms" in err
    assert "10.000 ms" in err
    assert "total" in err
    assert "11.230 ms" in err


def test_run_passes_on_reports_pass_timings():
    ctx = parse_from_basic_block("main:\n    stop")
    flags = VenomOptimizationFlags(level=OptimizationLevel.default())
    timings = []

    run_passes_on(
        ctx, flags, pass_timing_callback=lambda name, duration: timings.append((name, duration))
    )

    assert timings
    assert all(isinstance(name, str) for name, _ in timings)
    assert all(duration >= 0 for _, duration in timings)
    assert any("SimplifyCFGPass" in name for name, _ in timings)
