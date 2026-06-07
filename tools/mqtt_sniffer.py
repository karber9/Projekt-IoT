"""
MQTT Sniffer Demo Tool
Usage:
    ENCRYPT_PAYLOAD=true  -> sniffer sees base64-encoded ciphertext
    ENCRYPT_PAYLOAD=false -> sniffer sees plain JSON

Run: python tools/mqtt_sniffer.py
"""
import os
from datetime import datetime

from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
TOPICS = [
    os.getenv("MQTT_TASK_DISPATCH_TOPIC", "iot/task/dispatch"),
    os.getenv("MQTT_TASK_RESULT_TOPIC", "iot/task/result"),
    os.getenv("MQTT_DEVICE_HEARTBEAT_TOPIC", "iot/device/heartbeat"),
]


def on_connect(client, userdata, flags, rc):
    print(f"[sniffer] Connected to {BROKER_HOST}:{BROKER_PORT} (rc={rc})")
    for topic in TOPICS:
        client.subscribe(topic)
        print(f"[sniffer] Subscribed → {topic}")
    print("-" * 60)


def on_message(client, userdata, msg):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    try:
        decoded = msg.payload.decode("utf-8")
    except UnicodeDecodeError:
        decoded = "<binary data>"

    print(f"[{ts}] TOPIC:{msg.topic}")
    print(f"PAYLOAD: {decoded}")
    print()


client = mqtt.Client(client_id="mqtt-sniffer-demo")
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER_HOST, BROKER_PORT)
client.loop_forever()