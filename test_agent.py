from unittest.mock import MagicMock
import json
from agent import on_message

def test_on_message_valid():
    msg = MagicMock()
    msg.payload = json.dumps({"task_id": 1, "payload": "test"}).encode("utf-8")
    result = on_message(None, None, msg)
    assert result == {"task_id": 1, "payload": "test"}

def test_on_message_invalid_json():
    msg = MagicMock()
    msg.payload = b"not valid json"
    result = on_message(None, None, msg)
    assert result is None