UINT256_BITS = 256
UINT256_MODULUS = 2**UINT256_BITS
UINT256_MASK = UINT256_MODULUS - 1
INT256_MIN = -(2 ** (UINT256_BITS - 1))
INT256_MAX = 2 ** (UINT256_BITS - 1) - 1


def signed_to_unsigned_256(value: int, strict: bool = False) -> int:
    if strict:
        assert INT256_MIN <= value <= INT256_MAX, value
    if value < 0:
        return value + UINT256_MODULUS
    return value


def unsigned_to_signed_256(value: int, strict: bool = False) -> int:
    if strict:
        assert 0 <= value <= UINT256_MASK, value
    if value > INT256_MAX:
        return value - UINT256_MODULUS
    return value


def wrap256(value: int, signed: bool = False) -> int:
    ret = value % UINT256_MODULUS
    if signed:
        ret = unsigned_to_signed_256(ret, strict=True)
    return ret
