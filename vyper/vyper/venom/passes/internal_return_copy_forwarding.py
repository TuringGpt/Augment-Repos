from __future__ import annotations

import vyper.evm.address_space as addr_space
from vyper.venom.basicblock import IRInstruction, IROperand, IRVariable
from vyper.venom.effects import EMPTY, Effects
from vyper.venom.memory_location import MemoryLocation
from vyper.venom.passes.invoke_copy_forwarding_common import InvokeCopyForwardingBase


class InternalReturnCopyForwardingPass(InvokeCopyForwardingBase):
    """
    Forward copies of internal call memory return buffers:

      invoke @callee_returning_memory, %ret_buf, ...
      mcopy %dst, %ret_buf, ...

    When `%ret_buf` has the expected constrained use-shape, rewrite `%dst`
    uses to `%ret_buf` and remove the copy.
    """

    def run_pass(self):
        self._run_mcopy_forwarding(self._try_forward_internal_return_copy)

    def _try_forward_internal_return_copy(self, copy_inst: IRInstruction) -> bool:
        size = self.copy_forwarding.copy_size(copy_inst)
        if size is None:
            return False

        dst_info = self._copy_operand_alloca_root(copy_inst, 2, size)
        src_info = self._copy_operand_alloca_root(copy_inst, 1, size)
        if dst_info is None or src_info is None:
            return False
        dst_root, _ = dst_info
        src_root, _ = src_info
        if dst_root == src_root:
            return False

        if not self._is_internal_return_buffer_source(src_root, copy_inst):
            return False

        dst_aliases = self._collect_assign_aliases(dst_root)
        rewrite_insts: set[IRInstruction] = set()

        for _, use, pos in self._iter_alias_use_positions(dst_aliases):
            if self._is_assign_output_use(use, pos):
                continue
            if use.opcode == "mcopy" and pos == 2 and use is copy_inst:
                continue
            if use.opcode == "phi":
                return False
            if not self._same_block_uses_after(copy_inst, (use,)):
                return False
            rewrite_insts.add(use)

        # Verify no memory-clobbering instruction between the mcopy and
        # the last rewritten use.  The invoke that fills %ret_buf is
        # validated by _is_internal_return_buffer_source (same BB,
        # before the mcopy), so we only scan from the mcopy onward.
        bb_insts = copy_inst.parent.instructions
        copy_idx = bb_insts.index(copy_inst)
        if rewrite_insts:
            last_use_idx = max(bb_insts.index(u) for u in rewrite_insts)
            src_loc = self.base_ptr.get_read_location(copy_inst, addr_space.MEMORY)
            if src_loc.is_empty():
                return False
            for inst in bb_insts[copy_idx + 1 : last_use_idx]:
                if inst.opcode == "invoke":
                    if self._invoke_may_clobber_src(inst, src_loc):
                        return False
                    continue

                if inst.get_write_effects() & Effects.MEMORY == EMPTY:
                    continue
                write_loc = self.base_ptr.get_write_location(inst, addr_space.MEMORY)
                if self.mem_alias.may_alias(src_loc, write_loc):
                    return False

        replace_map: dict[IROperand, IROperand] = {var: src_root for var in dst_aliases}
        for use in rewrite_insts:
            self.updater.update_operands(use, replace_map)

        self.updater.nop(copy_inst)
        return True

    def _is_internal_return_buffer_source(
        self, src_root: IRVariable, copy_inst: IRInstruction
    ) -> bool:
        aliases = self._collect_assign_aliases(src_root)
        copy_seen = False
        invoke_sites: set[IRInstruction] = set()

        copy_bb = copy_inst.parent
        bb_insts = copy_bb.instructions
        copy_idx = bb_insts.index(copy_inst)

        for _, use, pos in self._iter_alias_use_positions(aliases):
            if self._is_assign_output_use(use, pos):
                continue

            if use.opcode == "mcopy" and pos == 1 and use is copy_inst:
                copy_seen = True
                continue

            if use.opcode == "invoke" and pos == 1:
                if use.parent is not copy_bb:
                    return False
                if bb_insts.index(use) >= copy_idx:
                    return False
                if not self._invoke_has_return_buffer(use):
                    return False
                invoke_sites.add(use)
                continue

            return False

        return copy_seen and len(invoke_sites) == 1

    def _invoke_may_clobber_src(self, invoke_inst: IRInstruction, src_loc: MemoryLocation) -> bool:
        for pos, op in enumerate(invoke_inst.operands):
            if pos == 0:
                continue
            if not self._invoke_operand_may_write(invoke_inst, pos):
                continue
            if not isinstance(op, IRVariable):
                continue

            ptr = self.base_ptr.ptr_from_op(op)
            if ptr is None:
                # Writable operand with unknown pointer shape.
                return True

            op_loc = MemoryLocation(offset=ptr.offset, size=None, alloca=ptr.base_alloca)
            if self.mem_alias.may_alias(src_loc, op_loc):
                return True

        return False

    def _invoke_operand_may_write(self, invoke_inst: IRInstruction, operand_pos: int) -> bool:
        if operand_pos == 1 and self._invoke_has_return_buffer(invoke_inst):
            return True
        return not self._is_readonly_invoke_operand(invoke_inst, operand_pos)
