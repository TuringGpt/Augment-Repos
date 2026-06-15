from vyper.evm.ints import signed_to_unsigned_256, unsigned_to_signed_256, wrap256
from vyper.utils import SizeLimits
from vyper.utils import wrap256 as utils_wrap256


def test_wrap256_matches_utils_export():
    assert wrap256(-1) == utils_wrap256(-1) == SizeLimits.MAX_UINT256
    assert wrap256(SizeLimits.MAX_UINT256, signed=True) == utils_wrap256(
        SizeLimits.MAX_UINT256, signed=True
    )


def test_signed_unsigned_256_boundaries():
    assert signed_to_unsigned_256(-1) == SizeLimits.MAX_UINT256
    assert signed_to_unsigned_256(SizeLimits.MIN_INT256) == 2**255
    assert unsigned_to_signed_256(SizeLimits.MAX_UINT256) == -1
    assert unsigned_to_signed_256(2**255) == SizeLimits.MIN_INT256
