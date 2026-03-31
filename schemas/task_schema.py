from pydantic import BaseModel

class TaskCreate(BaseModel):
    payload: str

class TaskResponse(BaseModel):
    id: int
    status: str
    payload: str
    result: str | None

    class Config:
        from_attributes = True