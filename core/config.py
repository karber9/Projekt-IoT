from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    #PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://iot_user:iot_password@localhost:5432/iot_db"

settings = Settings()
