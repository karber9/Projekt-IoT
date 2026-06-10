import base64
from binascii import Error as Base64Error

from nacl.exceptions import CryptoError
from nacl.secret import SecretBox

from core.config import settings

DB_ENCRYPTION_PREFIX = "db:v1:"


def _get_secret_box() -> SecretBox:
    key_hex = settings.DB_ENCRYPTION_KEY
    if not key_hex:
        raise RuntimeError("DB_ENCRYPTION_KEY not set in environment")

    try:
        key = bytes.fromhex(key_hex)
    except ValueError as exc:
        raise RuntimeError("DB_ENCRYPTION_KEY must be a hex string") from exc

    if len(key) != SecretBox.KEY_SIZE:
        raise RuntimeError("DB_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters")

    return SecretBox(key)


def encrypt_db_value(value: str | None) -> str | None:
    if value is None:
        return None

    if not settings.ENCRYPT_DB:
        return value

    if value.startswith(DB_ENCRYPTION_PREFIX):
        return value

    encrypted = _get_secret_box().encrypt(value.encode("utf-8"))
    encoded = base64.b64encode(encrypted).decode("utf-8")
    return f"{DB_ENCRYPTION_PREFIX}{encoded}"


def decrypt_db_value(value: str | None) -> str | None:
    if value is None:
        return None

    if not value.startswith(DB_ENCRYPTION_PREFIX):
        return value

    encoded = value.removeprefix(DB_ENCRYPTION_PREFIX)
    try:
        encrypted = base64.b64decode(encoded.encode("utf-8"))
        return _get_secret_box().decrypt(encrypted).decode("utf-8")
    except (Base64Error, ValueError, CryptoError) as exc:
        raise RuntimeError("Unable to decrypt database value") from exc
