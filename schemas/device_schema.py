from pydantic import BaseModel

class DeviceResponse(BaseModel):
    device_id: str
    status: str = "unknown"