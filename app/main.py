import logging

from fastapi import FastAPI

from app.routes.task_routes import router as task_router
from app.routes.auth_routes import router as auth_router
from core.mqtt_service import mqtt_service
from core.database import init_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)

app = FastAPI(title="IoT Backend")
app.include_router(task_router)
app.include_router(auth_router)

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