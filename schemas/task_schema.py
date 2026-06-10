from pydantic import BaseModel

from core.db_crypto import decrypt_db_value
from models.task_model import Task


# Schema for incoming request - data sent by user
class TaskCreate(BaseModel):
    payload: str


# Schema for API responses - data returned to user
class TaskResponse(BaseModel):
    id: int
    user_id: int
    status: str
    payload: str
    result: str | None

    class Config:
        from_attributes = True


def task_to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        status=task.status,
        payload=decrypt_db_value(task.payload) or "",
        result=decrypt_db_value(task.result),
    )
