from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL 
    DATABASE_URL: str = "postgresql+asyncpg://iot_user:iot_password@localhost:5432/iot_db"
    DEBUG: bool = False

    # MQTT Broker
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_CLIENT_ID: str = "iot-backend"
    MQTT_KEEPALIVE: int = 60
    MQTT_QOS: int = 1
    DEVICE_OFFLINE_TIMEOUT_SECONDS: int = 15

    # MQTT Topics
    MQTT_TASK_DISPATCH_TOPIC: str = "iot/task/dispatch"
    MQTT_TASK_RESULT_TOPIC: str = "iot/task/result"
    MQTT_DEVICE_HEARTBEAT_TOPIC: str = "iot/device/heartbeat"

settings = Settings()