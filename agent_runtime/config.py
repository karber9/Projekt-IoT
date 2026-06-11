import os
import socket

def build_device_id() -> str:
    configured_device_id = os.getenv("DEVICE_ID")
    if configured_device_id:
        return configured_device_id

    device_id_prefix = os.getenv("DEVICE_ID_PREFIX")
    hostname = socket.gethostname()

    if device_id_prefix:
        return f"{device_id_prefix}-{hostname}"

    return hostname

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
TASK_TOPIC = os.getenv("MQTT_TASK_DISPATCH_TOPIC", "iot/task/dispatch")
RESULT_TOPIC = os.getenv("MQTT_TASK_RESULT_TOPIC", "iot/task/result")
HEARTBEAT_TOPIC = os.getenv("MQTT_DEVICE_HEARTBEAT_TOPIC", "iot/device/heartbeat")
DEVICE_ID = build_device_id()
WORKER_COUNT = max(1, int(os.getenv("WORKER_COUNT", "1")))
HEARTBEAT_INTERVAL = max(1.0, float(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "5")))
QUEUE_SIZE = max(1, int(os.getenv("TASK_QUEUE_SIZE", "20")))
ENCRYPT_PAYLOAD = os.getenv("ENCRYPT_PAYLOAD", "true").lower() == "true"
