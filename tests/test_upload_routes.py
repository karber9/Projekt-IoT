import json
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock
from app.main import app
from core.database import get_db

@pytest.mark.asyncio
async def test_upload_json():
    # prepare JSON file with two tasks
    tasks = [{"payload": "task1"}, {"payload": "task2"}]
    content = json.dumps(tasks).encode("utf-8")

    mock_session = AsyncMock()

    async def mock_refresh(task):
        # simulate database assigning values after insert
        task.id = 1
        task.status = "PENDING"
        task.result = None
        task.created_at = None

    mock_session.refresh = mock_refresh

    async def override_get_db():
        yield mock_session

    # replace real database with mock
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/tasks/upload",
            files={"file": ("tasks.json", content, "application/json")},
        )

    app.dependency_overrides = {}
    # check that tasks were created successfully
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_invalid_format():
    # check that unsupported file format is rejected
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/tasks/upload",
            files={"file": ("tasks.txt", b"some content", "text/plain")},
        )
    assert response.status_code == 400
