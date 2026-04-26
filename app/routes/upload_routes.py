import csv
import io
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from models.task_model import Task
from schemas.task_schema import TaskResponse

router = APIRouter(prefix="/tasks", tags=["upload"])

@router.post(
    "/upload",
    response_model=list[TaskResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a JSON or CSV file with multiple tasks",
)
async def upload_tasks(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> list[TaskResponse]:
    content = await file.read()
    tasks_data = []

    if file.filename.endswith(".json"):
        # parse JSON file
        data = json.loads(content.decode("utf-8"))
        tasks_data = data if isinstance(data, list) else [data]

    elif file.filename.endswith(".csv"):
        # parse CSV file
        reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
        tasks_data = list(reader)

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON and CSV files are supported",
        )

    # bulk insert - save all tasks at once instead of one by one
    payloads = [{"payload": item.get("payload", str(item))} for item in tasks_data]
    result = await db.execute(
        insert(Task).returning(Task),
        payloads,
    )
    created_tasks = result.scalars().all()

    return [TaskResponse.model_validate(task) for task in created_tasks]
