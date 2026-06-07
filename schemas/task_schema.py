from pydantic import BaseModel

#Schema for incoming request - data sent by user
class TaskCreate(BaseModel):
    payload: str

#Schema for API responses - data returned to user
class TaskResponse(BaseModel):
    id: int
    user_id: int
    status: str
    payload: str
    result: str | None

    class Config:
        from_attributes = True
