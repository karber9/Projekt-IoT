import json
import queue
import threading
import time
from typing import Any

from agent_runtime.config import DEVICE_ID, HEARTBEAT_INTERVAL, HEARTBEAT_TOPIC, QUEUE_SIZE, TASK_TOPIC, WORKER_COUNT
from agent_runtime.processing import handle_task, publish_json

TASK_QUEUE: queue.Queue[dict[str, Any]] = queue.Queue(maxsize=QUEUE_SIZE)
STOP_EVENT = threading.Event()
PUBLIC_KEY_HEX: str | None = None


def set_public_key(public_key_hex: str | None) -> None:
    global PUBLIC_KEY_HEX
    PUBLIC_KEY_HEX = public_key_hex


def on_connect(client, userdata, flags, rc, logger):
    if rc == 0:
        logger.info("Connected to MQTT broker")
        client.subscribe(TASK_TOPIC)
        logger.info("Subscribed to %s", TASK_TOPIC)
    else:
        logger.error("Connection failed with code: %s", rc)


def on_message(client, userdata, msg, logger):
    try:
        data = json.loads(msg.payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        logger.warning("Error parsing message on topic=%s: %s", msg.topic, exc)
        return None

    try:
        TASK_QUEUE.put_nowait(data)
    except queue.Full:
        logger.warning("Task queue is full, dropping message: %s", data)

    return data


def worker_loop(client, logger) -> None:
    while not STOP_EVENT.is_set():
        try:
            task = TASK_QUEUE.get(timeout=0.5)
        except queue.Empty:
            continue

        try:
            handle_task(client, task, logger)
        finally:
            TASK_QUEUE.task_done()


def start_workers(client, logger) -> list[threading.Thread]:
    threads: list[threading.Thread] = []
    for worker_index in range(WORKER_COUNT):
        thread = threading.Thread(
            target=worker_loop,
            args=(client, logger),
            name=f"agent-worker-{worker_index + 1}",
            daemon=True,
        )
        thread.start()
        threads.append(thread)
    return threads


def heartbeat_loop(client) -> None:
    while not STOP_EVENT.is_set():
        payload = {
            "device_id": DEVICE_ID,
            "status": "alive",
            "timestamp": time.time(),
        }
        if PUBLIC_KEY_HEX is not None:
            payload["public_key"] = PUBLIC_KEY_HEX

        publish_json(client, HEARTBEAT_TOPIC, payload)
        STOP_EVENT.wait(HEARTBEAT_INTERVAL)
