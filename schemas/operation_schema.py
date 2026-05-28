from pydantic import BaseModel

class OperationCreate(BaseModel):
    expression: str

class OperationResponse(BaseModel):
    operation_id: int
    user_id: int
    expression: str
    status: str
    device_id: str

