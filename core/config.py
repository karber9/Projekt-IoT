from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env"}

    # PostgreSQL
    DATABASE_URL: str

    # App
    DEBUG: bool = False

    # MQTT Broker
    MQTT_BROKER_HOST: str
    MQTT_BROKER_PORT: int = 1883
    MQTT_CLIENT_ID: str = "iot-backend"
    MQTT_KEEPALIVE: int = 60
    MQTT_QOS: int = 1
    DEVICE_OFFLINE_TIMEOUT_SECONDS: int = 15

    # MQTT Topics
    MQTT_TASK_DISPATCH_TOPIC: str = "iot/task/dispatch"
    MQTT_TASK_RESULT_TOPIC: str = "iot/task/result"
    MQTT_DEVICE_HEARTBEAT_TOPIC: str = "iot/device/heartbeat"

    # Authorization
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    NACL_SECRET_KEY: str = ""
    ENCRYPT_PAYLOAD: bool = True
    ENCRYPT_WEBSOCKET_PAYLOADS: bool = True
    ENCRYPT_DB: bool = True
    DB_ENCRYPTION_KEY: str = ""

settings = Settings()
