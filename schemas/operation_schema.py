from pydantic import BaseModel

class OperationCreate(BaseModel):
    operation: str
    a: float
    b: float
    device_id: str

class OperationResponse(BaseModel):
    operation_id: str
    status: str

