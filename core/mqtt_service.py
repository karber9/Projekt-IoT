import asyncio
import logging
import json
from datetime import datetime, timezone

from aiomqtt import Client, Message, MqttError
from sqlalchemy import select

from core.websocket_manager import WebSocketManager
from core.config import settings
from core.database import AsyncSessionLocal
from models.device_model import Device
from models.task_model import Task

logger = logging.getLogger(__name__)


def is_device_online(device: Device, now: datetime) -> bool:
    last_seen = device.last_seen
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    return (
        now - last_seen
    ).total_seconds() <= settings.DEVICE_OFFLINE_TIMEOUT_SECONDS


class MqttService:
    def __init__(self) -> None:
        self._client: Client | None = None
        self._listener_task: asyncio.Task | None = None
        self._offline_monitor_task: asyncio.Task | None = None
        self._online_devices: set[str] = set()


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
        await self._client.subscribe(
            topic=settings.MQTT_DEVICE_HEARTBEAT_TOPIC,
            qos=settings.MQTT_QOS,
        )
        logger.info(
            "MQTT client subscribed to topics=%s,%s",
            settings.MQTT_TASK_RESULT_TOPIC,
            settings.MQTT_DEVICE_HEARTBEAT_TOPIC,
        )

        self._listener_task = asyncio.create_task(self._listen())
        self._offline_monitor_task = asyncio.create_task(self._monitor_offline_devices())

    
    async def _listen(self) -> None:
        try:
            async for message in self._client.messages:
                if message.topic.matches(settings.MQTT_TASK_RESULT_TOPIC):
                    await self._handle_result_message(message)
                elif message.topic.matches(settings.MQTT_DEVICE_HEARTBEAT_TOPIC):
                    await self._handle_heartbeat_message(message)
        except MqttError as e:
            logger.error("MQTT connection lost")

    async def _monitor_offline_devices(self) -> None:
        while True:
            await asyncio.sleep(max(1, settings.DEVICE_OFFLINE_TIMEOUT_SECONDS // 3))
            now = datetime.now(timezone.utc)

            async with AsyncSessionLocal() as session:
                result = await session.execute(select(Device))
                devices = result.scalars().all()

            for device in devices:
                if device.device_id in self._online_devices and not is_device_online(device, now):
                    self._online_devices.remove(device.device_id)
                    logger.info("Device %s status changed to offline", device.device_id)
                    await WebSocketManager.broadcast({
                        "type": "device.updated",
                        "device_id": device.device_id,
                        "status": "offline",
                        "last_seen": device.last_seen.isoformat(),
                    })
                    await WebSocketManager.broadcast_log(
                        direction="server",
                        device_id=device.device_id,
                        message_type="device.status_changed",
                        status="offline",
                        payload_preview="online -> offline",
                    )


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
        
        logger.info("Task result received: task_id=%s, status=%s", task_id, task_status)

        await self._save_result(
            task_id=int(task_id),
            task_status=str(task_status),
            task_result=str(task_result),
            device_id=str(data.get("device_id")) if data.get("device_id") else None,
        )

    async def _handle_heartbeat_message(self, message: Message) -> None:
        try:
            decoded_payload = message.payload.decode("utf-8")
            data = json.loads(decoded_payload)
        except (UnicodeDecodeError, json.JSONDecodeError):
            logger.warning("Invalid heartbeat payload received from topic=%s", message.topic)
            return

        device_id = data.get("device_id")
        if not device_id:
            logger.warning("Heartbeat without device_id ignored: %s", data)
            return

        await self._save_heartbeat(device_id=str(device_id))

    async def _save_heartbeat(self, device_id: str) -> None:
        now = datetime.now(timezone.utc)
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(select(Device).where(Device.device_id == device_id))
                device = result.scalar_one_or_none()
                was_online = device is not None and is_device_online(device, now)

                if device is None:
                    session.add(Device(device_id=device_id, last_seen=now))
                else:
                    device.last_seen = now

                await session.commit()
                self._online_devices.add(device_id)
                if not was_online:
                    logger.info("Device %s status changed to online", device_id)
                    await WebSocketManager.broadcast({
                        "type": "device.updated",
                        "device_id": device_id,
                        "status": "online",
                        "last_seen": now.isoformat(),
                    })
                    await WebSocketManager.broadcast_log(
                        direction="device->server",
                        device_id=device_id,
                        message_type="device.status_changed",
                        status="online",
                        payload_preview="offline -> online",
                    )
            except Exception:
                await session.rollback()
                raise


    async def _save_result(
        self,
        task_id: int,
        task_status: str,
        task_result: str,
        device_id: str | None,
    ) -> None:
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(
                    select(Task).where(Task.id == task_id)
                )
                task = result.scalar_one_or_none()

                if task is None:
                    logger.warning("Task %s not found in DB", task_id)
                    await WebSocketManager.broadcast_log(
                        direction="device->server",
                        device_id=device_id,
                        task_id=task_id,
                        message_type="error",
                        status="unknown task",
                        error=f"Task {task_id} not found in DB",
                    )
                    return
                
                task.status = task_status
                task.result = task_result
                await session.commit()
                payload_device_id = device_id
                try:
                    payload = json.loads(task.payload)
                    payload_device_id = payload_device_id or payload.get("device_id")
                except (TypeError, json.JSONDecodeError, AttributeError):
                    pass

                logger.info("Task %s updated: status=%s", task_id, task_status)
                await WebSocketManager.send_log_to_user(
                    task.user_id,
                    direction="device->server",
                    device_id=payload_device_id,
                    task_id=task_id,
                    message_type="mqtt.result",
                    status=task_status,
                    payload_preview=f"result={task_result}",
                )
                await WebSocketManager.send_log_to_user(
                    task.user_id,
                    direction="server",
                    device_id=payload_device_id,
                    task_id=task_id,
                    message_type="task.updated",
                    status=f"PENDING -> {task_status}",
                    payload_preview=f"result={task_result}",
                )
                await WebSocketManager.send_to_user(task.user_id, {
                    "type": "task.updated",
                    "task_id": task_id,
                    "status": task_status,
                    "result": task_result,
                    "device_id": payload_device_id,
                })
            except Exception:
                await session.rollback()
                raise


    async def publish_task(
        self,
        task_id: int,
        payload: str,
        *,
        user_id: int | None = None,
        device_id: str | None = None,
        operation: str | None = None,
    ) -> None:
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
            if user_id is not None:
                await WebSocketManager.send_log_to_user(
                    user_id,
                    direction="server->device",
                    device_id=device_id,
                    task_id=task_id,
                    message_type="error",
                    status="dispatch failed",
                    error=str(e),
                )
            raise RuntimeError(f"MQTT publish failed: {e}") from e

        logger.info("Task dispatched to MQTT topic=%s: task_id=%s", settings.MQTT_TASK_DISPATCH_TOPIC, task_id)
        if user_id is not None:
            await WebSocketManager.send_log_to_user(
                user_id,
                direction="server->device",
                device_id=device_id,
                task_id=task_id,
                message_type="mqtt.dispatched",
                status="sent",
                payload_preview=operation or payload[:120],
            )


    async def stop(self) -> None:
        if not self.is_started:
            return

        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass

        if self._offline_monitor_task:
            self._offline_monitor_task.cancel()
            try:
                await self._offline_monitor_task
            except asyncio.CancelledError:
                pass

        await self._client.__aexit__(None, None, None)
        self._client = None
        logger.info("MQTT client stopped")


mqtt_service = MqttService()
