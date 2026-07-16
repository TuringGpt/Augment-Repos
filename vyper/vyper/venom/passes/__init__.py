from vyper.venom.passes.affine_folding import AffineFoldingPass
from vyper.venom.passes.algebraic_optimization import AlgebraicOptimizationPass
from vyper.venom.passes.assert_combiner import AssertCombinerPass
from vyper.venom.passes.assert_elimination import AssertEliminationPass
from vyper.venom.passes.assign_elimination import AssignElimination
from vyper.venom.passes.branch_optimization import BranchOptimizationPass
from vyper.venom.passes.cfg_normalization import CFGNormalization
from vyper.venom.passes.common_subexpression_elimination import CSE
from vyper.venom.passes.concretize_mem_loc import ConcretizeMemLocPass
from vyper.venom.passes.dead_store_elimination import DeadStoreElimination
from vyper.venom.passes.dft import DFTPass
from vyper.venom.passes.function_inliner import FunctionInlinerPass
from vyper.venom.passes.internal_return_copy_forwarding import InternalReturnCopyForwardingPass
from vyper.venom.passes.literals_codesize import ReduceLiteralsCodesize
from vyper.venom.passes.load_elimination import LoadElimination
from vyper.venom.passes.lower_dload import LowerDloadPass
from vyper.venom.passes.make_ssa import MakeSSA
from vyper.venom.passes.mem2var import Mem2Var
from vyper.venom.passes.memmerging import MemMergePass
from vyper.venom.passes.memory_copy_elision import MemoryCopyElisionPass
from vyper.venom.passes.overflow_elimination import OverflowEliminationPass
from vyper.venom.passes.phi_elimination import PhiEliminationPass
from vyper.venom.passes.readonly_invoke_arg_copy_forwarding import (
    ReadonlyInvokeArgCopyForwardingPass,
)
from vyper.venom.passes.remove_unused_variables import RemoveUnusedVariablesPass
from vyper.venom.passes.revert_to_assert import RevertToAssert
from vyper.venom.passes.sccp import SCCP
from vyper.venom.passes.simplify_cfg import SimplifyCFGPass
from vyper.venom.passes.single_use_expansion import SingleUseExpansion
from vyper.venom.passes.tail_merge import TailMergePass

__all__ = [
    "AffineFoldingPass",
    "AlgebraicOptimizationPass",
    "AssertCombinerPass",
    "AssertEliminationPass",
    "AssignElimination",
    "BranchOptimizationPass",
    "CFGNormalization",
    "CSE",
    "ConcretizeMemLocPass",
    "DFTPass",
    "DeadStoreElimination",
    "FunctionInlinerPass",
    "InternalReturnCopyForwardingPass",
    "LoadElimination",
    "LowerDloadPass",
    "MakeSSA",
    "Mem2Var",
    "MemMergePass",
    "MemoryCopyElisionPass",
    "OverflowEliminationPass",
    "PhiEliminationPass",
    "ReadonlyInvokeArgCopyForwardingPass",
    "ReduceLiteralsCodesize",
    "RemoveUnusedVariablesPass",
    "RevertToAssert",
    "SCCP",
    "SimplifyCFGPass",
    "SingleUseExpansion",
    "TailMergePass",
]
