import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.routes.throttle import dispatch_tasks_in_batches

def make_task(task_id: int, payload: str):
    # create a mock task object
    task = MagicMock()
    task.id = task_id
    task.payload = payload
    return task

@pytest.mark.asyncio
async def test_dispatch_in_batches():
    # create 25 mock tasks
    tasks = [make_task(i, f"payload_{i}") for i in range(25)]

    with patch("app.routes.throttle.mqtt_service") as mock_mqtt:
        mock_mqtt.publish_task = AsyncMock()

        with patch("app.routes.throttle.asyncio.sleep", new_callable=AsyncMock):
            await dispatch_tasks_in_batches(tasks)

    # check that publish_task was called 25 times
    assert mock_mqtt.publish_task.call_count == 25

@pytest.mark.asyncio
async def test_dispatch_empty_list():
    # check that empty list does not cause errors
    with patch("app.routes.throttle.mqtt_service") as mock_mqtt:
        mock_mqtt.publish_task = AsyncMock()
        await dispatch_tasks_in_batches([])

    assert mock_mqtt.publish_task.call_count == 0