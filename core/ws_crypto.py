import base64
import json
from typing import Any

from core.config import settings


def _get_secret_box():
    from nacl.secret import SecretBox

    key_hex = settings.NACL_SECRET_KEY
    if not key_hex:
        raise RuntimeError("NACL_SECRET_KEY not set in environment")

    try:
        key = bytes.fromhex(key_hex)
    except ValueError as exc:
        raise RuntimeError("NACL_SECRET_KEY must be a hex string") from exc

    if len(key) != SecretBox.KEY_SIZE:
        raise RuntimeError("NACL_SECRET_KEY must be 32 bytes encoded as 64 hex characters")

    return SecretBox(key)


def encrypt_ws_payload(plaintext: str) -> str:
    encrypted = _get_secret_box().encrypt(plaintext.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")


def decrypt_ws_payload(ciphertext: str) -> str:
    raw = base64.b64decode(ciphertext.encode("utf-8"))
    return _get_secret_box().decrypt(raw).decode("utf-8")


def prepare_ws_outgoing_message(message: dict[str, Any]) -> str:
    raw = json.dumps(message, separators=(",", ":"))

    if not settings.ENCRYPT_WEBSOCKET_PAYLOADS:
        return raw

    envelope = {
        "encrypted": True,
        "payload": encrypt_ws_payload(raw),
    }
    return json.dumps(envelope, separators=(",", ":"))


def parse_ws_incoming_message(raw: str) -> dict[str, Any]:
    data = json.loads(raw)

    if not isinstance(data, dict):
        raise ValueError("WebSocket message must be a JSON object")

    if not data.get("encrypted"):
        return data

    payload = data.get("payload")
    if not isinstance(payload, str):
        raise ValueError("Encrypted WebSocket message missing payload")

    decrypted = decrypt_ws_payload(payload)
    parsed = json.loads(decrypted)
    if not isinstance(parsed, dict):
        raise ValueError("Decrypted WebSocket payload must be a JSON object")
    return parsed
