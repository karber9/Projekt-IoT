import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from core.config import settings
from core.db_crypto import encrypt_db_value
from app.routes.throttle import dispatch_tasks_in_batches

def make_task(task_id: int, payload: str):
    # create a mock task object
    task = MagicMock()
    task.id = task_id
    task.payload = payload
    return task

def test_dispatch_in_batches(monkeypatch):
    monkeypatch.setattr(settings, "DB_ENCRYPTION_KEY", "00" * 32)
    # create 25 mock tasks
    tasks = [make_task(i, encrypt_db_value(f"payload_{i}")) for i in range(25)]

    with patch("app.routes.throttle.mqtt_service") as mock_mqtt:
        mock_mqtt.publish_task = AsyncMock()

        with patch("app.routes.throttle.asyncio.sleep", new_callable=AsyncMock):
            asyncio.run(dispatch_tasks_in_batches(tasks))

    # check that publish_task was called 25 times
    assert mock_mqtt.publish_task.call_count == 25
    mock_mqtt.publish_task.assert_any_await(task_id=0, payload="payload_0")
    mock_mqtt.publish_task.assert_any_await(task_id=24, payload="payload_24")


def test_dispatch_empty_list():
    # check that empty list does not cause errors
    with patch("app.routes.throttle.mqtt_service") as mock_mqtt:
        mock_mqtt.publish_task = AsyncMock()
        asyncio.run(dispatch_tasks_in_batches([]))

    assert mock_mqtt.publish_task.call_count == 0