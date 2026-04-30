import asyncio
from typing import Sequence
from models.task_model import Task
from core.mqtt_service import mqtt_service

BATCH_SIZE = 10  # number of tasks sent at once
DELAY = 1.0  # delay in seconds between batches

async def dispatch_tasks_in_batches(tasks: Sequence[Task]) -> None:
    # split tasks into batches and send them one by one with a delay
    for i in range(0, len(tasks), BATCH_SIZE):
        batch = tasks[i:i + BATCH_SIZE]
        for task in batch:
            await mqtt_service.publish_task(task_id=task.id, payload=task.payload)
        # wait before sending next batch to avoid overloading the agent
        if i + BATCH_SIZE < len(tasks):
            await asyncio.sleep(DELAY)
