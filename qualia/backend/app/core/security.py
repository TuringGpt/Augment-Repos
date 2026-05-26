import base64
import binascii
import hashlib
import hmac
import json
import os
import time

from app.core.config import get_settings

PBKDF2_ITERATIONS = 100_000


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(f"{data}{padding}")


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{_b64url_encode(salt)}:{_b64url_encode(digest)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_encoded, digest_encoded = password_hash.split(":", maxsplit=1)
        salt = _b64url_decode(salt_encoded)
        expected_digest = _b64url_decode(digest_encoded)
    except (ValueError, binascii.Error):
        return False

    actual_digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return hmac.compare_digest(actual_digest, expected_digest)


def create_access_token(subject: str, expires_in: int = 3600, token_type: str = "access") -> str:
    if expires_in <= 0:
        raise ValueError("expires_in must be positive")

    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": subject, "exp": now + expires_in, "token_type": token_type}
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(
        get_settings().jwt_secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def verify_token(token: str, expected_token_type: str = "access") -> dict[str, object]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", maxsplit=2)
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_signature = hmac.new(
            get_settings().jwt_secret.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        actual_signature = _b64url_decode(encoded_signature)
    except (ValueError, TypeError, binascii.Error):
        raise ValueError("invalid token")

    if not hmac.compare_digest(actual_signature, expected_signature):
        raise ValueError("invalid token signature")

    try:
        payload = json.loads(_b64url_decode(encoded_payload))
    except (TypeError, binascii.Error, json.JSONDecodeError):
        raise ValueError("invalid token")

    if not isinstance(payload, dict):
        raise ValueError("invalid token payload")
    exp = payload.get("exp")
    if not isinstance(exp, int):
        raise ValueError("invalid token exp")
    if exp <= int(time.time()):
        raise ValueError("token expired")
    token_type = payload.get("token_type", "access")
    if token_type != expected_token_type:
        raise ValueError("unexpected token type")
    return payload
