import json
import asyncio
import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.auth import get_current_user
from schemas.task_schema import TaskResponse, TaskCreate
from schemas.device_schema import DeviceResponse
from schemas.operation_schema import OperationResponse, OperationCreate

from models.device_model import Device
from models.user_model import User
from models.task_model import Task
from core.database import get_db
from core.mqtt_service import mqtt_service
from core.websocket_manager import WebSocketManager


router = APIRouter(prefix="/tasks", tags=["tasks"])
BATCH_SIZE = 10
BATCH_DELAY_SECONDS = 1.0
ALLOWED_OPERATIONS = {"add", "subtract", "multiply", "divide"}


def is_device_online(device: Device, now: datetime) -> bool:
    last_seen = device.last_seen
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    return (
        now - last_seen
    ).total_seconds() <= settings.DEVICE_OFFLINE_TIMEOUT_SECONDS


def validate_operation_payload(item: object, index: int) -> OperationCreate:
    if not isinstance(item, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Row {index + 1} is not an object.",
        )

    raw_item = item
    if isinstance(raw_item.get("payload"), str):
        try:
            raw_item = json.loads(raw_item["payload"])
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {index + 1} payload is not valid JSON.",
            ) from exc

    if not isinstance(raw_item, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Row {index + 1} payload is not an object.",
        )

    operation = raw_item.get("operation")
    if operation not in ALLOWED_OPERATIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Row {index + 1} has unsupported operation.",
        )

    try:
        left = float(raw_item.get("a"))
        right = float(raw_item.get("b"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Row {index + 1} has invalid numeric values.",
        ) from exc

    if operation == "divide" and right == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Row {index + 1} divides by zero.",
        )

    return OperationCreate(operation=operation, a=left, b=right, device_id="")


async def get_online_devices(db: AsyncSession) -> list[Device]:
    now = datetime.now(timezone.utc)
    result = await db.execute(select(Device).order_by(Device.last_seen.desc()))
    return [
        device
        for device in result.scalars().all()
        if is_device_online(device, now)
    ]


async def create_and_dispatch_operation(
    *,
    body: OperationCreate,
    db: AsyncSession,
    current_user: User,
    device_id: str,
    target_mode: str,
    log_request: bool = True,
) -> OperationResponse:
    if log_request:
        await WebSocketManager.send_log_to_user(
            current_user.id,
            direction="frontend->server",
            device_id=device_id or None,
            message_type="operation.requested",
            status=target_mode,
            payload_preview=f"{body.operation}({body.a}, {body.b})",
        )

    await WebSocketManager.send_log_to_user(
        current_user.id,
        direction="server",
        device_id=device_id,
        message_type="operation.assigned",
        status=target_mode,
        payload_preview=f"device_id={device_id}",
    )

    payload = json.dumps({
        "device_id": device_id,
        "operation": body.operation,
        "a": body.a,
        "b": body.b,
    })
    task = Task(payload=payload, user_id=current_user.id)
    db.add(task)
    await db.flush()
    await db.refresh(task)
    await db.commit()

    try:
        await mqtt_service.publish_task(
            task_id=task.id,
            payload=payload,
            user_id=current_user.id,
            device_id=device_id,
            operation=body.operation,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Operation dispatch failed: {e}",
        ) from e

    return OperationResponse(
        operation_id=task.id,
        user_id=current_user.id,
        operation=body.operation,
        status="queued",
        device_id=device_id,
    )

@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
)
async def create_task(body: TaskCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> TaskResponse:

    task = Task(payload=body.payload, user_id=current_user.id)
    db.add(task)
    await db.flush()
    await db.refresh(task)
    await db.commit()

    try:
        await mqtt_service.publish_task(
            task_id=task.id,
            payload=task.payload,
            user_id=current_user.id,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Task dispatch failed: {e}",
        ) from e

    return TaskResponse.model_validate(task)

@router.get(
    "/devices",
    response_model=list[DeviceResponse],
    summary="List all known devices",
)
async def get_devices(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[DeviceResponse]:
    """
    Returns devices discovered by MQTT heartbeat with online/offline status.
    """

    now = datetime.now(timezone.utc)
    result = await db.execute(select(Device))
    devices = result.scalars().all()

    response: list[DeviceResponse] = []
    for device in devices:
        response.append(
            DeviceResponse(
                device_id=device.device_id,
                status="online" if is_device_online(device, now) else "offline",
            )
        )

    response.sort(key=lambda item: item.device_id)
    return response

@router.post(
    "/operations",
    response_model=OperationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Queue an operation on device",
)
async def create_operation(body: OperationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> OperationResponse:
    """
    Stores the operation as a Task and dispatches it via MQTT.
    """
    device_id = body.device_id.strip()
    target_mode = "explicit target" if device_id else "server auto-select"

    now = datetime.now(timezone.utc)

    if device_id:
        await WebSocketManager.send_log_to_user(
            current_user.id,
            direction="frontend->server",
            device_id=device_id,
            message_type="operation.requested",
            status=target_mode,
            payload_preview=f"{body.operation}({body.a}, {body.b})",
        )
        result = await db.execute(select(Device).where(Device.device_id == device_id))
        selected_device = result.scalar_one_or_none()

        if selected_device is None or not is_device_online(selected_device, now):
            await WebSocketManager.send_log_to_user(
                current_user.id,
                direction="server",
                device_id=device_id,
                message_type="error",
                status="device unavailable",
                payload_preview=f"{body.operation}({body.a}, {body.b})",
                error=f"Device {device_id} is not online.",
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Device {device_id} is not online.",
            )
    else:
        await WebSocketManager.send_log_to_user(
            current_user.id,
            direction="frontend->server",
            message_type="operation.requested",
            status=target_mode,
            payload_preview=f"{body.operation}({body.a}, {body.b})",
        )
        selected_device = next(iter(await get_online_devices(db)), None)

        if selected_device is None:
            await WebSocketManager.send_log_to_user(
                current_user.id,
                direction="server",
                message_type="error",
                status="no online device",
                payload_preview=f"{body.operation}({body.a}, {body.b})",
                error="No online devices available for operation.",
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No online devices available for operation.",
            )

        device_id = selected_device.device_id

    return await create_and_dispatch_operation(
        body=body,
        db=db,
        current_user=current_user,
        device_id=device_id,
        target_mode=target_mode,
        log_request=False,
    )


@router.post(
    "/upload",
    response_model=list[OperationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a JSON or CSV file with multiple operations",
)
async def upload_operations(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OperationResponse]:
    filename = file.filename or ""
    content = (await file.read()).decode("utf-8")

    if filename.endswith(".json"):
        try:
            raw_data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded JSON file is invalid.",
            ) from exc
        rows = raw_data if isinstance(raw_data, list) else [raw_data]
    elif filename.endswith(".csv"):
        rows = list(csv.DictReader(io.StringIO(content)))
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON and CSV files are supported.",
        )

    operations = [
        validate_operation_payload(item, index)
        for index, item in enumerate(rows)
    ]
    if not operations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File does not contain operations.",
        )

    online_devices = await get_online_devices(db)
    if not online_devices:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No online devices available for batch operations.",
        )

    responses: list[OperationResponse] = []
    total = len(operations)
    batch_id = f"batch-{datetime.now(timezone.utc).timestamp()}"
    await WebSocketManager.send_to_user(current_user.id, {
        "type": "batch.progress",
        "batch_id": batch_id,
        "total": total,
        "pending": total,
        "running": 0,
        "completed": 0,
        "failed": 0,
    })

    for index, operation in enumerate(operations):
        if index > 0 and index % BATCH_SIZE == 0:
            await asyncio.sleep(BATCH_DELAY_SECONDS)

        device = online_devices[index % len(online_devices)]
        response = await create_and_dispatch_operation(
            body=operation,
            db=db,
            current_user=current_user,
            device_id=device.device_id,
            target_mode="batch server auto-select",
        )
        responses.append(response)

        await WebSocketManager.send_to_user(current_user.id, {
            "type": "batch.progress",
            "batch_id": batch_id,
            "total": total,
            "pending": total - len(responses),
            "running": 0,
            "completed": len(responses),
            "failed": 0,
        })

    return responses

@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get status and task result",
)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> TaskResponse:
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == current_user.id))
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} non existent.",
        )

    return TaskResponse.model_validate(task)
