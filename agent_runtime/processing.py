import json
import re
from typing import Any

from agent_runtime.config import DEVICE_ID, ENCRYPT_PAYLOAD, RESULT_TOPIC

EXPRESSION_PATTERN = re.compile(
    r"^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([+\-*/])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*$"
)


def publish_json(client, topic: str, payload: dict[str, Any]) -> None:
    raw_payload = json.dumps(payload)
    if ENCRYPT_PAYLOAD:
        from agent_runtime.crypto import encrypt_payload

        raw_payload = encrypt_payload(raw_payload)
    client.publish(topic, raw_payload)


def calculate_expression(expression: str) -> float:
    match = EXPRESSION_PATTERN.match(expression)
    if match is None:
        raise ValueError("Unsupported expression format")

    left = float(match.group(1))
    operator = match.group(2)
    right = float(match.group(3))

    if operator == "+":
        return left + right
    if operator == "-":
        return left - right
    if operator == "*":
        return left * right
    if operator == "/":
        return left / right

    raise ValueError(f"Unsupported operator: {operator}")


def handle_task(client, task: dict[str, Any], logger) -> None:
    task_id = task.get("task_id")
    raw_payload = task.get("payload")

    if task_id is None or raw_payload is None:
        logger.warning("Missing task_id or payload: %s", task)
        return

    try:
        expression = raw_payload if isinstance(raw_payload, str) else str(raw_payload)
        target_device_id = str(task.get("device_id") or DEVICE_ID)

        if target_device_id != DEVICE_ID:
            logger.info("Task %s is targeted to %s, skipping on %s", task_id, target_device_id, DEVICE_ID)
            return

        result = calculate_expression(expression)
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
            "device_id": DEVICE_ID,
        },
    )
    logger.info("Task %s processed by %s: %s", task_id, DEVICE_ID, result)
