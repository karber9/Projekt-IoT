import asyncio
import logging
import json

from aiomqtt import Client, Message, MqttError
from sqlalchemy import select

from core.websocket_manager import WebSocketManager
from core.config import settings
from core.database import AsyncSessionLocal
from models.task_model import Task

logger = logging.getLogger(__name__)


class MqttService:
    def __init__(self) -> None:
        self._client: Client | None = None
        self._listener_task: asyncio.Task | None = None


    @property
    def is_started(self) -> bool:
        return self._client is not None


    async def start(self) -> None:
        if self.is_started:
            return

        self._client = Client(
            hostname=settings.MQTT_BROKER_HOST,
            port=settings.MQTT_BROKER_PORT,
            identifier=settings.MQTT_CLIENT_ID,
            keepalive=settings.MQTT_KEEPALIVE,
        )

        try:
            await self._client.__aenter__()
        except MqttError as e:
            logger.error("MQTT connect failed: %s", e)
            self._client = None
            raise

        logger.info("MQTT client started (%s:%s)", settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT)

        await self._client.subscribe(
            topic=settings.MQTT_TASK_RESULT_TOPIC,
            qos=settings.MQTT_QOS,
        )
        logger.info("MQTT client subscribed to topic=%s", settings.MQTT_TASK_RESULT_TOPIC)

        self._listener_task = asyncio.create_task(self._listen())

    
    async def _listen(self) -> None:
        try:
            async for message in self._client.messages:
                if message.topic.matches(settings.MQTT_TASK_RESULT_TOPIC):
                    await self._handle_result_message(message)
        except MqttError as e:
            logger.error("MQTT connection lost")


    async def _handle_result_message(self, message: Message) -> None:
        try:
            decoded_payload = message.payload.decode("utf-8")
            data = json.loads(decoded_payload)
        except (UnicodeDecodeError, json.JSONDecodeError):
            logger.warning("Invalid JSON payload received from topic=%s", message.topic)
            return

        task_id = data.get("task_id")
        task_status = data.get("status")
        task_result = data.get("result")
        
        if task_id is None or task_status is None:
            logger.warning("Missing required fields in payload: %s", data)
            return
        
        logger.info("Task result received: task_id=%s, status=%s, result=%s", task_id, task_status, task_result)

        await self._save_result(task_id=int(task_id), task_status=str(task_status), task_result=str(task_result))


    async def _save_result(self, task_id: int, task_status: str, task_result: str) -> None:
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(
                    select(Task).where(Task.id == task_id)
                )
                task = result.scalar_one_or_none()

                if task is None:
                    logger.warning("Task %s not found in DB", task_id)
                    return
                
                task.status = task_status
                task.result = task_result
                await session.commit()
                logger.info("Task %s updated: status=%s, result=%s", task_id, task_status, task_result)
                await WebSocketManager.send_to_user(task.user_id, {
                    "task_id": task_id,
                    "status": task_status,
                    "result": task_result,
                })
            except Exception:
                await session.rollback()
                raise


    async def publish_task(self, task_id: int, payload: str) -> None:
        if not self.is_started:
            raise RuntimeError("MQTT client is not started")

        message = {
            "task_id": task_id,
            "payload": payload,
        }

        try:
            await self._client.publish(
                topic=settings.MQTT_TASK_DISPATCH_TOPIC,
                payload=json.dumps(message),
                qos=settings.MQTT_QOS,
            )
        except MqttError as e:
            raise RuntimeError(f"MQTT publish failed: {e}") from e

        logger.info("Task dispatched to MQTT topic=%s: message=%s", settings.MQTT_TASK_DISPATCH_TOPIC, message)


    async def stop(self) -> None:
        if not self.is_started:
            return

        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass

        await self._client.__aexit__(None, None, None)
        self._client = None
        logger.info("MQTT client stopped")


mqtt_service = MqttService()