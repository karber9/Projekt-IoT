import json
from typing import Any

from agent_runtime.config import DEVICE_ID, RESULT_TOPIC


def publish_json(client, topic: str, payload: dict[str, Any]) -> None:
    client.publish(topic, json.dumps(payload))


def calculate_result(operation: str, a: float, b: float) -> float:
    operations = {
        "add": lambda left, right: left + right,
        "subtract": lambda left, right: left - right,
        "multiply": lambda left, right: left * right,
        "divide": lambda left, right: left / right,
    }

    if operation not in operations:
        raise ValueError(f"Unsupported operation: {operation}")

    return operations[operation](a, b)


def handle_task(client, task: dict[str, Any], logger) -> None:
    task_id = task.get("task_id")
    raw_payload = task.get("payload")

    if task_id is None or raw_payload is None:
        logger.warning("Missing task_id or payload: %s", task)
        return

    try:
        payload = json.loads(raw_payload) if isinstance(raw_payload, str) else raw_payload
        operation = str(payload["operation"])
        left = float(payload["a"])
        right = float(payload["b"])
        device_id = str(payload.get("device_id", DEVICE_ID))
        result = calculate_result(operation, left, right)
        status = "completed"
    except (KeyError, TypeError, ValueError, ZeroDivisionError) as exc:
        logger.exception("Task %s failed: %s", task_id, exc)
        publish_json(
            client,
            RESULT_TOPIC,
            {
                "task_id": task_id,
                "status": "failed",
                "result": str(exc),
                "device_id": DEVICE_ID,
            },
        )
        return

    publish_json(
        client,
        RESULT_TOPIC,
        {
            "task_id": task_id,
            "status": status,
            "result": result,
            "device_id": device_id,
        },
    )
    logger.info("Task %s processed by %s: %s", task_id, device_id, result)
