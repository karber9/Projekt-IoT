import json
from unittest.mock import patch

import pytest

from core.ws_crypto import parse_ws_incoming_message, prepare_ws_outgoing_message


TEST_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"


@pytest.fixture(autouse=True)
def nacl_secret_key(monkeypatch):
    monkeypatch.setenv("NACL_SECRET_KEY", TEST_KEY_HEX)


def test_prepare_ws_outgoing_message_plain():
    with patch("core.ws_crypto.settings.ENCRYPT_PAYLOAD", False):
        raw = prepare_ws_outgoing_message({"type": "task.updated", "task_id": 1})

    assert json.loads(raw) == {"type": "task.updated", "task_id": 1}


def test_prepare_ws_outgoing_message_encrypted():
    with patch("core.ws_crypto.settings.ENCRYPT_PAYLOAD", True):
        raw = prepare_ws_outgoing_message({"type": "device.updated", "device_id": "dev-1"})

    envelope = json.loads(raw)
    assert envelope["encrypted"] is True
    assert isinstance(envelope["payload"], str)

    parsed = parse_ws_incoming_message(raw)
    assert parsed == {"type": "device.updated", "device_id": "dev-1"}


def test_parse_ws_incoming_message_plain():
    raw = json.dumps({"type": "communication.log", "log": {"id": "1"}})
    parsed = parse_ws_incoming_message(raw)
    assert parsed["type"] == "communication.log"
