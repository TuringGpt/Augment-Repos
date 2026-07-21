# maybe rename this `main.py` or `venom.py`
# (can have an `__init__.py` which exposes the API).

import time
from collections import defaultdict
from contextlib import contextmanager
from typing import Any, Dict, Iterator, List, Optional, Union

from vyper.compiler.settings import OptimizationLevel, VenomOptimizationFlags
from vyper.ir.compile_ir import AssemblyInstruction
from vyper.venom.analysis import IRGlobalAnalysesCache, ReadonlyMemoryArgsGlobalAnalysis
from vyper.venom.analysis.analysis import IRAnalysesCache
from vyper.venom.analysis.fcg import FCGGlobalAnalysis
from vyper.venom.check_venom import check_calling_convention, check_mem_ops
from vyper.venom.context import IRContext
from vyper.venom.function import IRFunction
from vyper.venom.optimization_levels.O2 import PASSES_O2
from vyper.venom.optimization_levels.O3 import PASSES_O3
from vyper.venom.optimization_levels.Os import PASSES_Os
from vyper.venom.optimization_levels.pass_order import validate_pass_order
from vyper.venom.optimization_levels.types import PassConfig
from vyper.venom.passes import (
    CSE,
    SCCP,
    AffineFoldingPass,
    AlgebraicOptimizationPass,
    AssertEliminationPass,
    BranchOptimizationPass,
    DeadStoreElimination,
    FunctionInlinerPass,
    InternalReturnCopyForwardingPass,
    LoadElimination,
    Mem2Var,
    ReadonlyInvokeArgCopyForwardingPass,
    RemoveUnusedVariablesPass,
    SimplifyCFGPass,
)
from vyper.venom.passes.base_pass import IRGlobalPass, IRPass
from vyper.venom.venom_to_assembly import VenomCompiler

DEFAULT_OPT_LEVEL = OptimizationLevel.default()

# Pass configuration for each optimization level
# TODO: O1 (minimal passes) is currently disabled because it can cause
# "stack too deep" errors. Re-enable once stack spilling machinery is
# implemented to allow compilation with minimal optimization passes.
OPTIMIZATION_PASSES: Dict[OptimizationLevel, List[PassConfig]] = {
    OptimizationLevel.O2: PASSES_O2,
    OptimizationLevel.O3: PASSES_O3,
    OptimizationLevel.Os: PASSES_Os,
}

# Legacy aliases for backwards compatibility
OPTIMIZATION_PASSES[OptimizationLevel.NONE] = OPTIMIZATION_PASSES[
    OptimizationLevel.O2
]  # none -> O2
OPTIMIZATION_PASSES[OptimizationLevel.GAS] = OPTIMIZATION_PASSES[OptimizationLevel.O2]  # gas -> O2
OPTIMIZATION_PASSES[OptimizationLevel.CODESIZE] = OPTIMIZATION_PASSES[
    OptimizationLevel.Os
]  # codesize -> Os


def generate_assembly_experimental(
    venom_ctx: IRContext, optimize: OptimizationLevel = DEFAULT_OPT_LEVEL
) -> list[AssemblyInstruction]:
    compiler = VenomCompiler(venom_ctx)
    return compiler.generate_evm_assembly(optimize == OptimizationLevel.NONE)


# Mapping of pass classes to their disable flag names
# Passes not in this map are considered essential and always run
PASS_FLAG_MAP = {
    AffineFoldingPass: "disable_algebraic_optimization",
    AlgebraicOptimizationPass: "disable_algebraic_optimization",
    SCCP: "disable_sccp",
    Mem2Var: "disable_mem2var",
    LoadElimination: "disable_load_elimination",
    RemoveUnusedVariablesPass: "disable_remove_unused_variables",
    DeadStoreElimination: "disable_dead_store_elimination",
    BranchOptimizationPass: "disable_branch_optimization",
    CSE: "disable_cse",
    SimplifyCFGPass: "disable_simplify_cfg",
    AssertEliminationPass: "disable_assert_elimination",
}


PassRunConfig = tuple[type[IRPass], dict[str, Any]]


class PassTimer:
    """
    Collects wall-clock durations of venom passes, aggregated by pass name.
    A pass may run multiple times (e.g. once per function), so durations and
    invocation counts are accumulated per name.
    """

    def __init__(self) -> None:
        self.durations: dict[str, float] = defaultdict(float)
        self.counts: dict[str, int] = defaultdict(int)

    @contextmanager
    def timeit(self, name: str) -> Iterator[None]:
        start = time.perf_counter()
        try:
            yield
        finally:
            self.durations[name] += time.perf_counter() - start
            self.counts[name] += 1

    def format_report(self) -> str:
        total = sum(self.durations.values())
        name_width = max((len(name) for name in self.durations), default=len("total"))
        lines = [f"{'pass':<{name_width}}  {'time (ms)':>10}  {'runs':>5}  {'pct':>6}"]
        ordered = sorted(self.durations.items(), key=lambda kv: kv[1], reverse=True)
        for name, duration in ordered:
            pct = (duration / total * 100) if total > 0 else 0.0
            lines.append(
                f"{name:<{name_width}}  {duration * 1000:>10.3f}  "
                f"{self.counts[name]:>5}  {pct:>5.1f}%"
            )
        lines.append(f"{'total':<{name_width}}  {total * 1000:>10.3f}")
        return "\n".join(lines)


def _run_one_pass(
    pass_instance: Union[IRPass, IRGlobalPass], timer: Optional[PassTimer], **kwargs
) -> None:
    if timer is None:
        pass_instance.run_pass(**kwargs)
        return
    with timer.timeit(type(pass_instance).__name__):
        pass_instance.run_pass(**kwargs)


def _run_passes(
    fn: IRFunction,
    pass_pipeline: list[PassRunConfig],
    ac: IRAnalysesCache,
    timer: Optional[PassTimer] = None,
) -> None:
    for pass_cls, kwargs in pass_pipeline:
        pass_instance = pass_cls(ac, fn)
        _run_one_pass(pass_instance, timer, **kwargs)


def _normalize_pass_config(pass_config: PassConfig) -> PassRunConfig:
    if isinstance(pass_config, tuple):
        pass_cls, kwargs = pass_config
        return pass_cls, kwargs
    return pass_config, {}


def _build_fn_pass_pipeline(flags: VenomOptimizationFlags) -> list[PassRunConfig]:
    passes = OPTIMIZATION_PASSES[flags.level]
    pass_pipeline: list[PassRunConfig] = []
    for pass_config in passes:
        pass_cls, kwargs = _normalize_pass_config(pass_config)

        # Check if pass should be skipped based on user flags.
        flag_name = PASS_FLAG_MAP.get(pass_cls)
        if flag_name is not None and getattr(flags, flag_name):
            continue

        pass_pipeline.append((pass_cls, kwargs))

    validate_pass_order([pass_cls for pass_cls, _ in pass_pipeline], pipeline_name=str(flags.level))
    return pass_pipeline


def _run_global_passes(
    ctx: IRContext,
    flags: VenomOptimizationFlags,
    ir_analyses: dict[IRFunction, IRAnalysesCache],
    timer: Optional[PassTimer] = None,
) -> None:
    ctx.global_analyses_cache = IRGlobalAnalysesCache(ctx, ir_analyses)
    ctx.global_analyses_cache.force_analysis(ReadonlyMemoryArgsGlobalAnalysis)
    # Clean unreachable blocks before passes that require dominator analysis
    for fn in ctx.get_functions():
        _run_one_pass(SimplifyCFGPass(ir_analyses[fn], fn), timer)
    # Intentionally run invoke-copy forwarding twice in the full pipeline:
    # 1) here (pre-inlining) to shrink obvious frontend-emitted staging copies
    # 2) again in O2/O3/Os per-function pipelines to catch shapes created later.
    # Keep this note in sync with optimization_levels/* where the second run is listed.
    for fn in ctx.get_functions():
        _run_one_pass(InternalReturnCopyForwardingPass(ir_analyses[fn], fn), timer)
        _run_one_pass(ReadonlyInvokeArgCopyForwardingPass(ir_analyses[fn], fn), timer)
    if not flags.disable_inlining:
        _run_one_pass(FunctionInlinerPass(ir_analyses, ctx, flags), timer)


def run_passes_on(
    ctx: IRContext,
    flags: VenomOptimizationFlags,
    disable_mem_checks=False,
    time_passes: bool = False,
) -> Optional[PassTimer]:
    timer = PassTimer() if time_passes else None
    ir_analyses: dict[IRFunction, IRAnalysesCache] = {}
    # Validate calling convention invariants before running passes
    if not disable_mem_checks:
        check_mem_ops(ctx)
    check_calling_convention(ctx)
    for fn in ctx.functions.values():
        ir_analyses[fn] = IRAnalysesCache(fn)

    _run_global_passes(ctx, flags, ir_analyses, timer)

    ctx.global_analyses_cache = None
    ir_analyses = {}
    for fn in ctx.functions.values():
        ir_analyses[fn] = IRAnalysesCache(fn)

    assert ctx.entry_function is not None

    ctx.global_analyses_cache = IRGlobalAnalysesCache(ctx, ir_analyses)
    fcg = ctx.global_analyses_cache.force_analysis(FCGGlobalAnalysis)

    # Remove functions not reachable from entry.
    for fn in fcg.get_unreachable_functions():
        ctx.remove_function(fn)

    ctx.global_analyses_cache.force_analysis(ReadonlyMemoryArgsGlobalAnalysis)

    pass_pipeline = _build_fn_pass_pipeline(flags)
    _run_fn_passes(ctx, fcg, ctx.entry_function, pass_pipeline, ir_analyses, timer)
    ctx.global_analyses_cache = None

    return timer


def _run_fn_passes(
    ctx: IRContext,
    fcg: FCGGlobalAnalysis,
    fn: IRFunction,
    pass_pipeline: list[PassRunConfig],
    ir_analyses: dict[IRFunction, IRAnalysesCache],
    timer: Optional[PassTimer] = None,
):
    visited: set[IRFunction] = set()
    assert ctx.entry_function is not None
    _run_fn_passes_r(ctx, fcg, ctx.entry_function, pass_pipeline, ir_analyses, visited, timer)


def _run_fn_passes_r(
    ctx: IRContext,
    fcg: FCGGlobalAnalysis,
    fn: IRFunction,
    pass_pipeline: list[PassRunConfig],
    ir_analyses: dict[IRFunction, IRAnalysesCache],
    visited: set,
    timer: Optional[PassTimer] = None,
):
    if fn in visited:
        return
    visited.add(fn)
    for next_fn in fcg.get_callees(fn):
        _run_fn_passes_r(ctx, fcg, next_fn, pass_pipeline, ir_analyses, visited, timer)

    _run_passes(fn, pass_pipeline, ir_analyses[fn], timer)
