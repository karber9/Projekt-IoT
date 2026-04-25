import json
import logging
import os
import queue
import socket
import threading
import time
from typing import Any
from pathlib import Path

try:
    import paho.mqtt.client as mqtt
except ImportError:  # pragma: no cover - keeps local tests working without the dependency
    class _FallbackClient:
        def __init__(self, client_id: str | None = None):
            self.client_id = client_id

        def connect(self, *args: Any, **kwargs: Any) -> None:
            return None

        def subscribe(self, *args: Any, **kwargs: Any) -> None:
            return None

        def publish(self, *args: Any, **kwargs: Any) -> None:
            return None

        def loop_forever(self) -> None:
            return None

    class mqtt:  # type: ignore[no-redef]
        Client = _FallbackClient


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
TASK_TOPIC = os.getenv("MQTT_TASK_DISPATCH_TOPIC", "iot/task/dispatch")
RESULT_TOPIC = os.getenv("MQTT_TASK_RESULT_TOPIC", "iot/task/result")
HEARTBEAT_TOPIC = os.getenv("MQTT_DEVICE_HEARTBEAT_TOPIC", "iot/device/heartbeat")
DEVICE_ID = os.getenv("DEVICE_ID", socket.gethostname())
WORKER_COUNT = max(1, int(os.getenv("WORKER_COUNT", "4")))
HEARTBEAT_INTERVAL = max(1.0, float(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "5")))
QUEUE_SIZE = max(1, int(os.getenv("TASK_QUEUE_SIZE", "20")))

TASK_QUEUE: queue.Queue[dict[str, Any]] = queue.Queue(maxsize=QUEUE_SIZE)
STOP_EVENT = threading.Event()
PUBLIC_KEY_HEX: str | None = None

def _ensure_crypto_keys() -> str | None:
    """
    Generates a signing key pair on first start and stores it on disk.
    On subsequent starts, it reuses the existing private key and derives
    the public key from it.
    """
    key_dir = Path(os.getenv("AGENT_KEY_DIR", "/app/keys"))
    private_key_path = key_dir / "signing_private_key.hex"
    public_key_path = key_dir / "signing_public_key.hex"

    key_dir.mkdir(parents=True, exist_ok=True)

    try:
        from nacl.signing import SigningKey
    except ImportError:
        logger.warning("PyNaCl is not available; key generation skipped.")
        return None

    if private_key_path.exists():
        private_key_hex = private_key_path.read_text(encoding="utf-8").strip()
        signing_key = SigningKey(bytes.fromhex(private_key_hex))
        public_key_hex = signing_key.verify_key.encode().hex()
        logger.info("Loaded existing crypto keypair from %s", key_dir)
    else:
        signing_key = SigningKey.generate()
        private_key_hex = signing_key.encode().hex()
        public_key_hex = signing_key.verify_key.encode().hex()

        private_key_path.write_text(private_key_hex, encoding="utf-8")
        public_key_path.write_text(public_key_hex, encoding="utf-8")

        try:
            os.chmod(private_key_path, 0o600)
            os.chmod(public_key_path, 0o644)
        except OSError:
            pass

        logger.info("Generated new crypto keypair in %s", key_dir)

    if not public_key_path.exists():
        public_key_path.write_text(public_key_hex, encoding="utf-8")

    return public_key_hex

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected to MQTT broker")
        client.subscribe(TASK_TOPIC)
        logger.info("Subscribed to %s", TASK_TOPIC)
    else:
        logger.error("Connection failed with code: %s", rc)


def on_message(client, userdata, msg):
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


def _publish_json(client, topic: str, payload: dict[str, Any]) -> None:
    client.publish(topic, json.dumps(payload))


def _calculate_result(operation: str, a: float, b: float) -> float:
    operations = {
        "add": lambda left, right: left + right,
        "subtract": lambda left, right: left - right,
        "multiply": lambda left, right: left * right,
        "divide": lambda left, right: left / right,
    }

    if operation not in operations:
        raise ValueError(f"Unsupported operation: {operation}")

    return operations[operation](a, b)


def _handle_task(client, task: dict[str, Any]) -> None:
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
        result = _calculate_result(operation, left, right)
        status = "completed"
    except (KeyError, TypeError, ValueError, ZeroDivisionError) as exc:
        logger.exception("Task %s failed: %s", task_id, exc)
        _publish_json(
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

    _publish_json(
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


def _worker_loop(client) -> None:
    while not STOP_EVENT.is_set():
        try:
            task = TASK_QUEUE.get(timeout=0.5)
        except queue.Empty:
            continue

        try:
            _handle_task(client, task)
        finally:
            TASK_QUEUE.task_done()


def _start_workers(client) -> list[threading.Thread]:
    threads: list[threading.Thread] = []
    for worker_index in range(WORKER_COUNT):
        thread = threading.Thread(
            target=_worker_loop,
            args=(client,),
            name=f"agent-worker-{worker_index + 1}",
            daemon=True,
        )
        thread.start()
        threads.append(thread)
    return threads


def _heartbeat_loop(client) -> None:
    while not STOP_EVENT.is_set():
        payload = {
            "device_id": DEVICE_ID,
            "status": "alive",
            "timestamp": time.time(),
        }
        if PUBLIC_KEY_HEX is not None:
            payload["public_key"] = PUBLIC_KEY_HEX

        _publish_json(client, HEARTBEAT_TOPIC, payload)
        STOP_EVENT.wait(HEARTBEAT_INTERVAL)


if __name__ == "__main__":
    PUBLIC_KEY_HEX = _ensure_crypto_keys()

    client = mqtt.Client(client_id=f"rpi-agent-{DEVICE_ID}")
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)

    _start_workers(client)
    threading.Thread(target=_heartbeat_loop, args=(client,), name="agent-heartbeat", daemon=True).start()

    logger.info("Agent %s started, connecting to %s:%s", DEVICE_ID, BROKER_HOST, BROKER_PORT)
    client.loop_forever()