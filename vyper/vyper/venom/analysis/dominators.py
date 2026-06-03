from typing import Iterator

from vyper.exceptions import CompilerPanic
from vyper.utils import OrderedSet
from vyper.venom.analysis import CFGAnalysis, IRAnalysis
from vyper.venom.basicblock import IRBasicBlock
from vyper.venom.function import IRFunction


class DominatorTreeAnalysis(IRAnalysis):
    """
    Dominator tree implementation. This class computes the dominator tree of a
    function and provides methods to query the tree. Immediate dominators are
    computed using the iterative Cooper-Harvey-Kennedy algorithm.
    """

    fn: IRFunction
    entry_block: IRBasicBlock
    _dominators: dict[IRBasicBlock, OrderedSet[IRBasicBlock]] | None
    immediate_dominators: dict[IRBasicBlock, IRBasicBlock]
    dominated: dict[IRBasicBlock, OrderedSet[IRBasicBlock]]
    dominator_frontiers: dict[IRBasicBlock, OrderedSet[IRBasicBlock]]
    cfg: CFGAnalysis

    def analyze(self):
        """
        Compute the dominator tree.
        """
        self.fn = self.function
        self.entry_block = self.fn.entry
        self._dominators = None
        self.immediate_dominators = {}
        self.dominated = {}
        self.dominator_frontiers = {}

        self.cfg = self.analyses_cache.request_analysis(CFGAnalysis)

        self.cfg_post_walk = list(self.cfg.dfs_post_walk)
        self.cfg_post_order = {bb: idx for idx, bb in enumerate(self.cfg_post_walk)}

        self._compute_idoms()
        self._compute_df()

    @property
    def dominators(self) -> dict[IRBasicBlock, OrderedSet[IRBasicBlock]]:
        if self._dominators is None:
            self._compute_dominators()
        assert self._dominators is not None
        return self._dominators

    def get_all_dominated_blocks(self, bb: IRBasicBlock) -> OrderedSet[IRBasicBlock]:
        result: OrderedSet[IRBasicBlock] = OrderedSet()

        def visit(block):
            for dominated_block in self.dominated.get(block, OrderedSet()):
                if dominated_block not in result:
                    result.add(dominated_block)
                    visit(dominated_block)

        visit(bb)

        return result

    def dominates(self, dom, sub):
        """
        Check if `dom` dominates `sub`.
        """
        runner = sub
        while True:
            if runner == dom:
                return True
            if runner == self.entry_block:
                return False
            runner = self.immediate_dominators[runner]
            if runner is None:
                return False

    def immediate_dominator(self, bb):
        """
        Return the immediate dominator of a basic block.
        """
        return self.immediate_dominators.get(bb)

    def _compute_dominators(self):
        """
        Compute dominators
        """
        dominators = {}

        for bb in self.cfg_post_walk:
            bb_dominators: OrderedSet[IRBasicBlock] = OrderedSet()
            runner = bb
            while True:
                bb_dominators.add(runner)
                if runner == self.entry_block:
                    break
                runner = self.immediate_dominators[runner]
                if runner is None:
                    raise CompilerPanic("Dominators computation failed to converge")

            dominators[bb] = bb_dominators

        self._dominators = dominators

    def _compute_idoms(self):
        """
        Compute immediate dominators
        """
        basic_blocks = self.cfg_post_walk
        reverse_post_order = list(reversed(basic_blocks))
        # Cooper-Harvey-Kennedy is monotone in reverse postorder: each block's
        # immediate dominator can only move closer to the entry block. There are
        # at most len(basic_blocks) such moves on any path before convergence.
        max_iterations = len(basic_blocks)

        self.immediate_dominators = {bb: None for bb in basic_blocks}
        self.immediate_dominators[self.entry_block] = self.entry_block

        for _ in range(max_iterations):
            changed = False
            for bb in reverse_post_order:
                if bb == self.entry_block:
                    continue

                new_idom = None
                for pred in self.cfg.cfg_in(bb):
                    if self.immediate_dominators.get(pred) is None:
                        continue
                    if new_idom is None:
                        new_idom = pred
                    else:
                        new_idom = self._intersect(pred, new_idom)

                if new_idom is None:
                    continue

                if self.immediate_dominators[bb] != new_idom:
                    self.immediate_dominators[bb] = new_idom
                    changed = True

            if not changed:
                break
        else:
            raise CompilerPanic("Dominators computation failed to converge")

        self.dominated = {bb: OrderedSet() for bb in basic_blocks}
        for dom, target in self.immediate_dominators.items():
            self.dominated[target].add(dom)

    def _compute_df(self):
        """
        Compute dominance frontier
        """
        basic_blocks = self.cfg_post_walk
        self.dominator_frontiers = {bb: OrderedSet() for bb in basic_blocks}

        for bb in self.cfg_post_walk:
            if len(in_bbs := self.cfg.cfg_in(bb)) > 1:
                for pred in in_bbs:
                    runner = pred
                    while runner != self.immediate_dominators[bb]:
                        self.dominator_frontiers[runner].add(bb)
                        runner = self.immediate_dominators[runner]

    def dominance_frontier(self, basic_blocks: list[IRBasicBlock]) -> OrderedSet[IRBasicBlock]:
        """
        Compute dominance frontier of a set of basic blocks.
        """
        df = OrderedSet[IRBasicBlock]()
        for bb in basic_blocks:
            df.update(self.dominator_frontiers[bb])
        return df

    def _intersect(self, bb1, bb2):
        """
        Find the nearest common dominator of two basic blocks.
        """
        dfs_order = self.cfg_post_order
        while bb1 != bb2:
            while dfs_order[bb1] < dfs_order[bb2]:
                bb1 = self.immediate_dominators[bb1]
            while dfs_order[bb1] > dfs_order[bb2]:
                bb2 = self.immediate_dominators[bb2]
        return bb1

    @property
    def dom_post_order(self) -> Iterator[IRBasicBlock]:
        """
        Compute post-order traversal of the dominator tree.
        """
        visited = set()

        def visit(bb: IRBasicBlock) -> Iterator[IRBasicBlock]:
            if bb in visited:
                return
            visited.add(bb)
            for dominated_bb in self.dominated.get(bb, OrderedSet()):
                yield from visit(dominated_bb)
            yield bb

        return visit(self.entry_block)

    def as_graph(self) -> str:
        """
        Generate a graphviz representation of the dominator tree.
        """
        lines = ["digraph dominator_tree {"]
        for bb in self.fn.get_basic_blocks():
            if bb == self.entry_block:
                continue
            idom = self.immediate_dominator(bb)
            if idom is None:
                continue
            lines.append(f'    " {idom.label} " -> " {bb.label} "')
        lines.append("}")
        return "\n".join(lines)
