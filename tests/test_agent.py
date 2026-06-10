import json
from unittest.mock import MagicMock

from agent import on_message
from agent_runtime import config, processing

def test_on_message_valid(monkeypatch):
    # check that valid JSON message is correctly parsed
    monkeypatch.setattr(config, "ENCRYPT_PAYLOAD", False)
    msg = MagicMock()
    msg.payload = json.dumps({"task_id": 1, "payload": "test"}).encode("utf-8")
    result = on_message(None, None, msg)
    assert result == {"task_id": 1, "payload": "test"}

def test_on_message_invalid_json(monkeypatch):
    # check that invalid JSON does not crash the agent
    monkeypatch.setattr(config, "ENCRYPT_PAYLOAD", False)
    msg = MagicMock()
    msg.payload = b"not valid json"
    result = on_message(None, None, msg)
    assert result is None


def test_publish_json_plaintext(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(processing, "ENCRYPT_PAYLOAD", False)

    processing.publish_json(client, "iot/test", {"device_id": "rpi-agent-001"})

    client.publish.assert_called_once_with(
        "iot/test",
        json.dumps({"device_id": "rpi-agent-001"}),
    )


def test_publish_json_encrypted(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(processing, "ENCRYPT_PAYLOAD", True)
    monkeypatch.setattr("agent_runtime.crypto.encrypt_payload", lambda plaintext: f"encrypted:{plaintext}")

    processing.publish_json(client, "iot/test", {"device_id": "rpi-agent-001"})

    client.publish.assert_called_once_with(
        "iot/test",
        f"encrypted:{json.dumps({'device_id': 'rpi-agent-001'})}",
    )
