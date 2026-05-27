from vyper.utils import wrap256
from vyper.venom.analysis.dfg import DFGAnalysis
from vyper.venom.analysis.liveness import LivenessAnalysis
from vyper.venom.basicblock import IRInstruction, IRLabel, IRLiteral, IROperand, IRVariable
from vyper.venom.passes.base_pass import InstUpdater, IRPass


class ConsecutiveAddFoldingPass(IRPass):
    """
    Fold single-use consecutive add operations with compile-time constants.

    For example, ``add(add(x, 255), 1)`` becomes ``add(x, 256)``.
    """

    dfg: DFGAnalysis
    updater: InstUpdater

    def run_pass(self):
        self.dfg = self.analyses_cache.request_analysis(DFGAnalysis)
        self.updater = InstUpdater(self.dfg)

        for bb in self.function.get_basic_blocks():
            for inst in bb.instructions:
                self._rewrite_add(inst)

        self.analyses_cache.invalidate_analysis(LivenessAnalysis)

    def _rewrite_add(self, inst: IRInstruction) -> bool:
        if inst.num_outputs != 1 or inst.opcode != "add" or inst.is_volatile or inst.is_pseudo:
            return False

        current_const, chain_var = self._extract_constant_and_value(inst)
        if current_const is None or not isinstance(chain_var, IRVariable):
            return False
        if not self.dfg.is_single_use(chain_var):
            return False

        producer = self.dfg.get_producing_instruction(chain_var)
        if producer is None or producer.opcode != "add" or producer.num_outputs != 1:
            return False

        producer_const, base = self._extract_constant_and_value(producer)
        if producer_const is None or base is None or isinstance(base, IRLabel):
            return False
        if base == inst.output:
            return False

        folded_const = wrap256(current_const + producer_const)
        if folded_const == 0:
            self.updater.mk_assign(inst, base)
        else:
            self.updater.update(inst, "add", [base, IRLiteral(folded_const)])
        return True

    def _extract_constant_and_value(
        self, inst: IRInstruction
    ) -> tuple[int | None, IROperand | None]:
        constant_values: list[int] = []
        value_operands: list[IROperand] = []

        for operand in inst.operands:
            const_value = self._compile_time_constant_value(operand)
            if const_value is None:
                value_operands.append(operand)
            else:
                constant_values.append(const_value)

        if len(constant_values) != 1 or len(value_operands) != 1:
            return None, None

        return constant_values[0], value_operands[0]

    def _compile_time_constant_value(self, operand: IROperand) -> int | None:
        seen: set[IRVariable] = set()
        while True:
            if isinstance(operand, IRLiteral):
                return operand.value
            if not isinstance(operand, IRVariable) or operand in seen:
                return None
            seen.add(operand)

            producer = self.dfg.get_producing_instruction(operand)
            if producer is None or producer.opcode != "assign" or len(producer.operands) != 1:
                return None
            operand = producer.operands[0]
