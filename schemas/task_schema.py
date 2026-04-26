from pydantic import BaseModel

#Schema for incoming request - data sent by user
class TaskCreate(BaseModel):
    payload: str

    @field_validator("payload")
    @classmethod
    def validate_payload(cls, v):
        if not v.strip():
            raise ValueError("Payload cannot be empty")
        if len(v) > 1000:
            raise ValueError("Payload cannot exceed 1000 characters")
        return v

#Schema for API responses - data returned to user
class TaskResponse(BaseModel):
    id: int
    status: str
    payload: str
    result: str | None

    class Config:
        from_attributes = True
