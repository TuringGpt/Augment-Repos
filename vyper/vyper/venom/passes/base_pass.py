from typing import Any, ClassVar, TypeAlias, Union

from vyper.venom.analysis import IRAnalysesCache
from vyper.venom.basicblock import IRLabel
from vyper.venom.context import IRContext
from vyper.venom.function import IRFunction
from vyper.venom.passes.machinery.inst_updater import InstUpdater

PassRef: TypeAlias = Union[str, type["IRPass"]]


class PassMetricsMixin:
    """
    Uniform metrics reporting shared by all Venom IR passes.

    Every pass exposes a ``metrics`` dictionary so debugging information is
    reported in the same shape regardless of the pass.
    """

    metrics: dict[str, Any]

    def _init_metrics(self) -> None:
        self.metrics = {}

    def _record_metric(self, name: str, value: Any = 1) -> None:
        # Numeric metrics accumulate; everything else overwrites. bool is a
        # subclass of int, so exclude it to keep boolean flags from silently
        # accumulating into integers when recorded more than once.
        current = self.metrics.get(name)
        if self._is_number(value) and self._is_number(current):
            self.metrics[name] = current + value
        else:
            self.metrics[name] = value

    @staticmethod
    def _is_number(value: Any) -> bool:
        return isinstance(value, (int, float)) and not isinstance(value, bool)

    def get_metrics(self) -> dict[str, Any]:
        # Nest the recorded metrics under "metrics" so a pass-defined metric can
        # never clobber the self-describing "pass" field, and so callers can
        # aggregate reports keyed by pass name without entries overwriting.
        return {"pass": self.__class__.__name__, "metrics": dict(self.metrics)}


class IRPass(PassMetricsMixin):
    """
    Base class for all Venom IR passes.
    """

    function: IRFunction
    analyses_cache: IRAnalysesCache
    updater: InstUpdater  # optional, does not need to be instantiated
    # Order constraints for pass scheduling.
    # A tuple expresses acceptable alternatives. At least one must match.
    # - required_predecessors: passes that must appear before this pass.
    # - required_successors: passes that must appear after this pass.
    # - required_immediate_predecessors: pass immediately before this pass.
    # - required_immediate_successors: pass immediately after this pass.
    required_predecessors: ClassVar[tuple[PassRef, ...]] = ()
    required_successors: ClassVar[tuple[PassRef, ...]] = ()
    required_immediate_predecessors: ClassVar[tuple[PassRef, ...]] = ()
    required_immediate_successors: ClassVar[tuple[PassRef, ...]] = ()

    def __init__(self, analyses_cache: IRAnalysesCache, function: IRFunction):
        self.function = function
        self.analyses_cache = analyses_cache
        self._init_metrics()

    def _replace_all_labels(self, label_map: dict[IRLabel, IRLabel]) -> None:
        for bb in self.function.get_basic_blocks():
            bb.replace_operands(label_map)

        # Also update labels in data segment.
        for data_section in self.function.ctx.data_segment:
            for item in data_section.data_items:
                data = item.data
                if isinstance(data, IRLabel) and data in label_map:
                    item.data = label_map[data]

    def run_pass(self, *args, **kwargs):
        raise NotImplementedError(f"Not implemented! {self.__class__}.run_pass()")


class IRGlobalPass(PassMetricsMixin):
    """
    Base class for all Venom IR passes.
    """

    ctx: IRContext
    analyses_caches: dict[IRFunction, IRAnalysesCache]

    def __init__(self, analyses_caches: dict[IRFunction, IRAnalysesCache], ctx: IRContext):
        self.analyses_caches = analyses_caches
        self.ctx = ctx
        self._init_metrics()

    def run_pass(self, *args, **kwargs):
        raise NotImplementedError(f"Not implemented! {self.__class__}.run_pass()")
