from pydantic import BaseModel

class OperationCreate(BaseModel):
    operation: str
    a: float
    b: float
    device_id: str

class OperationResponse(BaseModel):
    operation_id: int
    user_id: int
    operation: str
    status: str

