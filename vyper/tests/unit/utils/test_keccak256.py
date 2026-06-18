from vyper.utils import method_id, method_id_int


def test_keccak_sanity(keccak):
    # sanity check -- ensure keccak is keccak256, not sha3
    # https://ethereum.stackexchange.com/a/107985
    assert keccak(b"").hex() == "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"


def test_method_id(keccak):
    assert method_id("foo()") == keccak(b"foo()")[:4]


def test_method_id_int(keccak):
    assert method_id_int("foo()") == int.from_bytes(keccak(b"foo()")[:4], "big")
