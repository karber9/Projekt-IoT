import os
import socket

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
TASK_TOPIC = os.getenv("MQTT_TASK_DISPATCH_TOPIC", "iot/task/dispatch")
RESULT_TOPIC = os.getenv("MQTT_TASK_RESULT_TOPIC", "iot/task/result")
HEARTBEAT_TOPIC = os.getenv("MQTT_DEVICE_HEARTBEAT_TOPIC", "iot/device/heartbeat")
DEVICE_ID = os.getenv("DEVICE_ID", socket.gethostname())
WORKER_COUNT = max(1, int(os.getenv("WORKER_COUNT", "4")))
HEARTBEAT_INTERVAL = max(1.0, float(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "5")))
QUEUE_SIZE = max(1, int(os.getenv("TASK_QUEUE_SIZE", "20")))
