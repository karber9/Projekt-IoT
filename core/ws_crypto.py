import json
from typing import Any

from core.config import settings


def prepare_ws_outgoing_message(message: dict[str, Any]) -> str:
    raw = json.dumps(message, separators=(",", ":"))

    if not settings.ENCRYPT_PAYLOAD:
        return raw

    from agent_runtime.crypto import encrypt_payload

    envelope = {
        "encrypted": True,
        "payload": encrypt_payload(raw),
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

    from agent_runtime.crypto import decrypt_payload

    decrypted = decrypt_payload(payload)
    parsed = json.loads(decrypted)
    if not isinstance(parsed, dict):
        raise ValueError("Decrypted WebSocket payload must be a JSON object")
    return parsed
