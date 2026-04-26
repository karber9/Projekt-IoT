import logging
import threading
from agent_runtime import ensure_crypto_keys, heartbeat_loop, set_public_key, start_workers
from agent_runtime.config import BROKER_HOST, BROKER_PORT, DEVICE_ID
from agent_runtime.mqtt_compat import mqtt
from agent_runtime.runtime import on_connect as _on_connect_impl
from agent_runtime.runtime import on_message as _on_message_impl


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)

def on_connect(client, userdata, flags, rc):
    return _on_connect_impl(client, userdata, flags, rc, logger)


def on_message(client, userdata, msg):
    return _on_message_impl(client, userdata, msg, logger)


if __name__ == "__main__":
    set_public_key(ensure_crypto_keys(logger))

    client = mqtt.Client(client_id=f"rpi-agent-{DEVICE_ID}")
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)

    start_workers(client, logger)
    threading.Thread(target=heartbeat_loop, args=(client,), name="agent-heartbeat", daemon=True).start()

    logger.info("Agent %s started, connecting to %s:%s", DEVICE_ID, BROKER_HOST, BROKER_PORT)
    client.loop_forever()