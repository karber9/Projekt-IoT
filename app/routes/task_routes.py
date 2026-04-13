import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.task_schema import TaskResponse, TaskCreate
from schemas.device_schema import DeviceResponse
from schemas.operation_schema import OperationResponse, OperationCreate

from models.task_model import Task
from core.database import get_db
from core.mqtt_service import mqtt_service


router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
)
async def create_task(body: TaskCreate, db: AsyncSession = Depends(get_db)) -> TaskResponse:

    task = Task(payload=body.payload)
    db.add(task)
    await db.flush()
    await db.refresh(task)

    try:
        mqtt_service.publish_task(task_id=task.id, payload=task.payload)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Task dispatch failed: {e}",
        ) from e

    return TaskResponse.model_validate(task)

@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get status and task result",
)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)) -> TaskResponse:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} non existent.",
        )

    return TaskResponse.model_validate(task)

@router.get(
    "/devices",
    response_model=list[DeviceResponse],
    summary="List all known devices",
)
async def get_devices(db: AsyncSession = Depends(get_db)) -> list[DeviceResponse]:
    """
    Returns all device IDs seen in past operations.
    """

    result = await db.execute(select(Task.payload))
    payload = result.scalars().all()

    seen: set[str] = set()
    for raw in payload:
        try:
            data = json.loads(raw)
            device_id = data.get("device_id")
            if device_id:
                seen.add(device_id)
        except (json.JSONDecodeError, AttributeError):
                continue

    return [DeviceResponse(device_id=d_id) for d_id in sorted(seen)]

@router.post(
    "/operations",
    response_model=OperationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Queue an operation on device",
)
async def create_operation(
        body: OperationCreate,
        db: AsyncSession = Depends(get_db),
) -> OperationResponse:
    """
    Stores the operation as a Task and dispatches it via MQTT.
    """
    payload = json.dumps({
        "device_id": body.device_id,
        "operation": body.operation,
        "a": body.a,
        "b": body.b,
    })
    task = Task(payload=payload)
    db.add(task)
    await db.flush()
    await db.refresh(task)

    try:
        mqtt_service.publish_task(task_id=task.id, payload=payload)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Operation dispatch failed: {e}",
        ) from e
    return OperationResponse(operation_id=f"op-{task.id}", status="queued")


