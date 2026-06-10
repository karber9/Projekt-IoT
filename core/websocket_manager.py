from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import WebSocket

from core.ws_crypto import prepare_ws_outgoing_message

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[user_id] = websocket

    async def disconnect(self, user_id: int) -> None:
        self.active_connections.pop(user_id, None)

    async def _send_message(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        await websocket.send_text(prepare_ws_outgoing_message(message))

    async def send_to_user(self, user_id: int, message: dict[str, Any]) -> None:
        websocket = self.active_connections.get(user_id)
        if websocket:
            await self._send_message(websocket, message)

    async def broadcast(self, message: dict[str, Any]) -> None:
        for websocket in self.active_connections.values():
            await self._send_message(websocket, message)

    async def send_log_to_user(
        self,
        user_id: int,
        *,
        direction: str,
        message_type: str,
        status: str,
        device_id: str | None = None,
        task_id: int | None = None,
        payload_preview: str | None = None,
        error: str | None = None,
    ) -> None:
        await self.send_to_user(
            user_id,
            {
                "type": "communication.log",
                "log": {
                    "id": str(uuid4()),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "direction": direction,
                    "device_id": device_id,
                    "task_id": task_id,
                    "message_type": message_type,
                    "status": status,
                    "payload_preview": payload_preview,
                    "error": error,
                },
            },
        )

    async def broadcast_log(
        self,
        *,
        direction: str,
        message_type: str,
        status: str,
        device_id: str | None = None,
        task_id: int | None = None,
        payload_preview: str | None = None,
        error: str | None = None,
    ) -> None:
        await self.broadcast(
            {
                "type": "communication.log",
                "log": {
                    "id": str(uuid4()),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "direction": direction,
                    "device_id": device_id,
                    "task_id": task_id,
                    "message_type": message_type,
                    "status": status,
                    "payload_preview": payload_preview,
                    "error": error,
                },
            }
        )

WebSocketManager = ConnectionManager()
