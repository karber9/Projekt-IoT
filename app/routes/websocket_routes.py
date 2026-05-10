from fastapi import APIRouter, WebSocket, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import decode_access_token
from core.database import get_db
from core.websocket_manager import WebSocketManager
from models.user_model import User

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket(
    path="/updates",
)
async def websocket_updates(websocket: WebSocket, token: str, db: AsyncSession = Depends(get_db)):
    data = decode_access_token(token)
    email = data["sub"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    manager = WebSocketManager(websocket)
    await manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(user.id)
