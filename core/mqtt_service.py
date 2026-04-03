import logging
import json

import paho.mqtt.client as mqtt

from core.config import settings

logger = logging.getLogger(__name__)

class MqttService:
    def __init__(self) -> None:
        self._client = mqtt.Client(client_id=settings.MQTT_CLIENT_ID)
        self._is_started = False
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message

    @property
    def is_started(self) -> bool:
        return self._is_started

    def start(self) -> None:
        if self._is_started:
            return

        try:
            self._client.connect(
                host=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                keepalive=settings.MQTT_KEEPALIVE,
            )
            self._client.loop_start()
        except OSError as e:
            logger.error(
                "MQTT connect failed (%s:%s): %s",
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
                e,
            )
            raise

        self._is_started = True
        logger.info("MQTT client started (%s:%s)", settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT)

    def stop(self) -> None:
        if not self._is_started:
            return

        self._client.loop_stop()
        self._client.disconnect()
        self._is_started = False
        logger.info("MQTT client stopped")

    def publish_task(self, task_id: int, payload: str) -> None:
        if not self._is_started:
            raise RuntimeError("MQTT client is not started")

        message = {
            "task_id": task_id,
            "payload": payload,
        }

        result = self._client.publish(
            topic=settings.MQTT_TASK_DISPATCH_TOPIC,
            payload=json.dumps(message),
            qos=settings.MQTT_QOS,
        )

        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            raise RuntimeError(f"MQTT publish failed with error code: {result.rc}")

    def _on_connect(self, client, _userdata, _flags, rc) -> None:
        if rc != 0:
            logger.error("MQTT connect failed with error code: %s", rc)
            return
        
        client.subscribe(settings.MQTT_TASK_RESULT_TOPIC, qos=settings.MQTT_QOS)
        logger.info("Subscribed to %s", settings.MQTT_TASK_RESULT_TOPIC)

    def _on_message(self, _client, _userdata, msg) -> None:
        if msg.topic != settings.MQTT_TASK_RESULT_TOPIC:
            return
        
        try:
            decoded_payload = msg.payload.decode("utf-8")
            data = json.loads(decoded_payload)
        except (UnicodeDecodeError, json.JSONDecodeError):
            logger.warning("Invalid JSON payload received from topic=%s", msg.topic)
            return

        task_id = data.get("task_id")
        task_status = data.get("status")
        task_result = data.get("result")
        
        if task_id is None or task_status is None:
            logger.warning("Missing required fields in payload: %s", data)
            return

        logger.info(
            "Task result received: task_id=%s, status=%s, result=%s",
            task_id,
            task_status,
            task_result,
        )

mqtt_service = MqttService()