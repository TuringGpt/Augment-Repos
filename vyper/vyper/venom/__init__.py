# maybe rename this `main.py` or `venom.py`
# (can have an `__init__.py` which exposes the API).

from collections.abc import Callable
from functools import partial
from time import perf_counter
from typing import Any, Dict, List

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
from vyper.venom.passes.base_pass import IRPass
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
PassTimingCallback = Callable[[str, float], None]


def _run_timed_pass(
    pass_name: str, run_pass: Callable[[], None], pass_timing_callback: PassTimingCallback | None
) -> None:
    if pass_timing_callback is None:
        run_pass()
        return

    start = perf_counter()
    run_pass()
    pass_timing_callback(pass_name, perf_counter() - start)


def _run_passes(
    fn: IRFunction,
    pass_pipeline: list[PassRunConfig],
    ac: IRAnalysesCache,
    pass_timing_callback: PassTimingCallback | None = None,
) -> None:
    for pass_cls, kwargs in pass_pipeline:
        pass_instance = pass_cls(ac, fn)
        pass_name = f"{fn.name.value}:{pass_cls.__name__}"
        _run_timed_pass(pass_name, partial(pass_instance.run_pass, **kwargs), pass_timing_callback)


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
    pass_timing_callback: PassTimingCallback | None = None,
) -> None:
    ctx.global_analyses_cache = IRGlobalAnalysesCache(ctx, ir_analyses)
    ctx.global_analyses_cache.force_analysis(ReadonlyMemoryArgsGlobalAnalysis)
    # Clean unreachable blocks before passes that require dominator analysis
    for fn in ctx.get_functions():
        pass_instance = SimplifyCFGPass(ir_analyses[fn], fn)
        pass_name = f"{fn.name.value}:SimplifyCFGPass"
        _run_timed_pass(pass_name, pass_instance.run_pass, pass_timing_callback)
    # Intentionally run invoke-copy forwarding twice in the full pipeline:
    # 1) here (pre-inlining) to shrink obvious frontend-emitted staging copies
    # 2) again in O2/O3/Os per-function pipelines to catch shapes created later.
    # Keep this note in sync with optimization_levels/* where the second run is listed.
    for fn in ctx.get_functions():
        pass_instance = InternalReturnCopyForwardingPass(ir_analyses[fn], fn)
        pass_name = f"{fn.name.value}:InternalReturnCopyForwardingPass"
        _run_timed_pass(pass_name, pass_instance.run_pass, pass_timing_callback)

        pass_instance = ReadonlyInvokeArgCopyForwardingPass(ir_analyses[fn], fn)
        pass_name = f"{fn.name.value}:ReadonlyInvokeArgCopyForwardingPass"
        _run_timed_pass(pass_name, pass_instance.run_pass, pass_timing_callback)
    if not flags.disable_inlining:
        pass_instance = FunctionInlinerPass(ir_analyses, ctx, flags)
        _run_timed_pass("global:FunctionInlinerPass", pass_instance.run_pass, pass_timing_callback)


def run_passes_on(
    ctx: IRContext,
    flags: VenomOptimizationFlags,
    disable_mem_checks=False,
    pass_timing_callback: PassTimingCallback | None = None,
) -> None:
    ir_analyses: dict[IRFunction, IRAnalysesCache] = {}
    # Validate calling convention invariants before running passes
    if not disable_mem_checks:
        check_mem_ops(ctx)
    check_calling_convention(ctx)
    for fn in ctx.functions.values():
        ir_analyses[fn] = IRAnalysesCache(fn)

    _run_global_passes(ctx, flags, ir_analyses, pass_timing_callback)

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
    _run_fn_passes(ctx, fcg, ctx.entry_function, pass_pipeline, ir_analyses, pass_timing_callback)
    ctx.global_analyses_cache = None


def _run_fn_passes(
    ctx: IRContext,
    fcg: FCGGlobalAnalysis,
    fn: IRFunction,
    pass_pipeline: list[PassRunConfig],
    ir_analyses: dict[IRFunction, IRAnalysesCache],
    pass_timing_callback: PassTimingCallback | None = None,
):
    visited: set[IRFunction] = set()
    assert ctx.entry_function is not None
    _run_fn_passes_r(
        ctx, fcg, ctx.entry_function, pass_pipeline, ir_analyses, visited, pass_timing_callback
    )


def _run_fn_passes_r(
    ctx: IRContext,
    fcg: FCGGlobalAnalysis,
    fn: IRFunction,
    pass_pipeline: list[PassRunConfig],
    ir_analyses: dict[IRFunction, IRAnalysesCache],
    visited: set,
    pass_timing_callback: PassTimingCallback | None = None,
):
    if fn in visited:
        return
    visited.add(fn)
    for next_fn in fcg.get_callees(fn):
        _run_fn_passes_r(
            ctx, fcg, next_fn, pass_pipeline, ir_analyses, visited, pass_timing_callback
        )

    _run_passes(fn, pass_pipeline, ir_analyses[fn], pass_timing_callback)
