from __future__ import annotations

from vyper.venom.basicblock import IRInstruction, IRVariable
from vyper.venom.memory_location import Allocation
from vyper.venom.passes.invoke_copy_forwarding_common import InvokeCopyForwardingBase


class ReadonlyInvokeArgCopyForwardingPass(InvokeCopyForwardingBase):
    """
    Forward staged memory args into readonly invoke parameters:

      %tmp = alloca ...
      mcopy %tmp, %src, ...
      invoke @callee, ..., %tmp, ...

    Only readonly callee memory params are rewritten.
    """

    def run_pass(self):
        # Run to a local fixpoint so chained staging copies are fully
        # collapsed in a single pass invocation.
        self._run_mcopy_forwarding(self._try_forward_readonly_copy, to_fixpoint=True)

    def _try_forward_readonly_copy(self, copy_inst: IRInstruction) -> bool:
        dst_info = self._copy_operand_alloca_root(copy_inst, 2)
        if dst_info is None:
            return False
        root, root_inst = dst_info
        dst_alloca = Allocation(root_inst)

        aliases = self._collect_assign_aliases(root)
        rewrite_sites: set[tuple[IRInstruction, int]] = set()

        for _, use, pos in self._iter_alias_use_positions(aliases):
            if self._is_assign_output_use(use, pos):
                continue
            if use.opcode == "mcopy" and pos == 2:
                if use is not copy_inst:
                    return False
                continue
            if use.opcode == "invoke" and self._is_readonly_invoke_operand(use, pos):
                rewrite_sites.add((use, pos))
                continue
            return False

        if len(rewrite_sites) == 0:
            return False

        if self.copy_forwarding.should_block_forwarding(copy_inst, rewrite_sites, dst_alloca):
            return False

        # Keep this local and conservative: only forward when all uses are
        # in the same block and dominated by the source copy.
        if not self._same_block_uses_after(
            copy_inst, (invoke_inst for invoke_inst, _ in rewrite_sites)
        ):
            return False

        if self._has_src_clobber_between(copy_inst, rewrite_sites):
            return False

        src = self._assign_root(copy_inst.operands[1])
        if isinstance(src, IRVariable) and src in aliases:
            return False
        if isinstance(src, IRVariable) and self._has_mutable_same_source_sibling_arg(
            rewrite_sites, src
        ):
            return False

        for invoke_inst, pos in rewrite_sites:
            if invoke_inst.operands[pos] == src:
                continue
            new_operands = list(invoke_inst.operands)
            new_operands[pos] = src
            self.updater.update(invoke_inst, invoke_inst.opcode, new_operands)

        # Even when operands already point to src, this copy is redundant:
        # all remaining uses are readonly invokes validated above.
        self.updater.nop(copy_inst)
        return True

    def _has_mutable_same_source_sibling_arg(
        self, rewrite_sites: set[tuple[IRInstruction, int]], src_root: IRVariable
    ) -> bool:
        """
        Reject forwarding when it would create aliasing between a rewritten
        readonly arg and a sibling mutable arg in the same invoke.
        """
        for invoke_inst, rewritten_pos in rewrite_sites:
            for pos, op in enumerate(invoke_inst.operands):
                if pos == 0 or pos == rewritten_pos:
                    continue
                if self._is_readonly_invoke_operand(invoke_inst, pos):
                    continue
                root = self._assign_root(op)
                if root == src_root:
                    return True
        return False
