import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from models.task_model import Base
import models.device_model  # registers devices table in Base

DATABASE_URL = "postgresql+asyncpg://iot_user:iot_password@localhost:5432/iot_db"

async def init_db():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        # creates all tables (tasks, devices) if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Database initialized successfully")

if __name__ == "__main__":
    asyncio.run(init_db())
