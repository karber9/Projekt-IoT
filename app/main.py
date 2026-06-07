import asyncio
import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.task_routes import router as task_router
from app.routes.auth_routes import router as auth_router
from app.routes.websocket_routes import router as ws_router
from core.mqtt_service import mqtt_service
from core.database import init_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI(title="IoT Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(task_router)
app.include_router(auth_router)
app.include_router(ws_router)

@app.on_event("startup")
async def on_startup() -> None:
    await init_models()
    await mqtt_service.start()

@app.on_event("shutdown")
async def on_shutdown() -> None:
    await mqtt_service.stop()

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
