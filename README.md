# IoT Project

A distributed IoT system for offloading arithmetic computations to external devices. User submits operation from web dashboard, backend stores task in PostgreSQL and publishes it through MQTT, then agent performs calculation and sends result back. Frontend displays task status, device status, and communication logs in real time through WebSocket updates.

## Table of Contents

- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Configuration](#configuration)
- [API](#api)
- [Batch Operations](#batch-operations)
- [Project Structure](#project-structure)

## Quick Start

Requirements:

- Docker and Docker Compose.
- Free ports: `3000`, `8000`, `5432`, and `1883`.

1. Clone the repository and enter the project directory.

2. Create the local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

3. Generate a secure `SECRET_KEY` and put it in `.env`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

4. Generate encryption keys and put them in `.env`:

```bash
python -c "import nacl.utils; print(nacl.utils.random(32).hex())"
python -c "import secrets; print(secrets.token_hex(32))"
```

The first command creates `NACL_SECRET_KEY` for MQTT/WebSocket payload encryption. The second creates `DB_ENCRYPTION_KEY` for encrypted task storage in PostgreSQL.

5. Optionally adjust agent scaling in `.env`:

```env
AGENT_COUNT=2
WORKER_COUNT=1
```

6. Start the full stack:

```bash
docker compose up --build
```

After startup, the application is available at:

| Service | Address | Description |
| --- | --- | --- |
| Frontend | `http://localhost:3000` | Web dashboard |
| Backend | `http://localhost:8000` | FastAPI API |
| API docs | `http://localhost:8000/docs` | Swagger UI |
| Health check | `http://localhost:8000/health` | Backend status |
| PostgreSQL | `localhost:5432` | Database |
| MQTT | `localhost:1883` | Mosquitto broker |

Docker Compose starts PostgreSQL, Mosquitto, the backend, the frontend, and the configured number of agents.

## Key Features

- User registration and login with JWT-based authentication.
- Single arithmetic operation dispatch, for example `21/7`, `2+4`, or `6*9`.
- Batch upload support for JSON, CSV, and TXT files.
- Automatic active-device selection based on MQTT heartbeats.
- Task queueing and dispatch to agents through the Mosquitto broker.
- Real-time task, device, and communication-log updates through WebSockets.
- Agent public-key metadata generation and publishing with PyNaCl.
- Full local stack managed with Docker Compose.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python 3.11, FastAPI, Uvicorn, Pydantic Settings |
| Database | PostgreSQL 16, SQLAlchemy async, asyncpg |
| IoT / communication | Eclipse Mosquitto, aiomqtt, paho-mqtt |
| Realtime | FastAPI WebSockets |
| Authentication | JWT, passlib, bcrypt |
| Agent cryptography | PyNaCl |
| Containers | Docker, Docker Compose |

## Development Setup

### Backend

The backend requires PostgreSQL and an MQTT broker. You can run those through Docker Compose or provide them locally.

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts from `app.main:app`, initializes database models, and starts the MQTT service.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`. Detailed API and WebSocket contracts are documented in `frontend/README.md`.

### IoT Agent

The agent can run on a Raspberry Pi or locally as a Python process. It requires access to the MQTT broker.

```bash
python agent.py
```

Example agent configuration:

```bash
DEVICE_ID=rpi-agent-001
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
WORKER_COUNT=1
HEARTBEAT_INTERVAL_SECONDS=5
```

In Docker Compose, each agent replica gets a unique `DEVICE_ID` from `DEVICE_ID_PREFIX` plus the container hostname, for example `rpi-agent-projekt-iot-agent-1`.

### Opening PostgreSQL in Docker

When the Docker Compose stack is running, open an interactive `psql` session inside the PostgreSQL container:

```bash
docker compose exec postgres psql -U iot_user -d iot_db
```

Useful `psql` commands:

```sql
\dt          -- list tables
\d tasks     -- describe the tasks table
SELECT * FROM tasks;
\q           -- quit psql
```

You can also connect from a local database client using:

```text
Host: localhost
Port: 5432
Database: iot_db
User: iot_user
Password: iot_password
```

## Configuration

The main configuration template is `.env.example`. Docker Compose defines most runtime values for containers in `docker-compose.yml`, while secrets and agent replica settings are read from the local `.env` file.

### Backend

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy async database URL | `postgresql+asyncpg://user:password@localhost:5432/dbname` |
| `SECRET_KEY` | Secret used to sign JWT tokens | generated hex token |
| `DEBUG` | Debug mode | `False` |
| `MQTT_BROKER_HOST` | MQTT broker host | `localhost` or `mosquitto` |
| `MQTT_BROKER_PORT` | MQTT broker port | `1883` |
| `MQTT_CLIENT_ID` | Backend MQTT client ID | `iot-backend` |
| `MQTT_KEEPALIVE` | MQTT keepalive in seconds | `60` |
| `MQTT_QOS` | MQTT publish/subscribe QoS | `1` |
| `MQTT_TASK_DISPATCH_TOPIC` | Topic used to dispatch tasks to agents | `iot/task/dispatch` |
| `MQTT_TASK_RESULT_TOPIC` | Topic used to receive results from agents | `iot/task/result` |
| `MQTT_DEVICE_HEARTBEAT_TOPIC` | Topic used for device heartbeats | `iot/device/heartbeat` |
| `DEVICE_OFFLINE_TIMEOUT_SECONDS` | Time after which a device is considered offline and removed from the database | `15` |
| `ENCRYPT_PAYLOAD` | Encrypt MQTT payloads between backend and agents | `true` |
| `ENCRYPT_WEBSOCKET_PAYLOADS` | Encrypt WebSocket messages sent to the frontend | `true` |
| `ENCRYPT_DB` | Encrypt task payload and result fields in PostgreSQL | `true` |
| `NACL_SECRET_KEY` | 32-byte hex key for MQTT/WebSocket encryption | generated hex token |
| `DB_ENCRYPTION_KEY` | 32-byte hex key for database field encryption | generated hex token |

### Frontend

| Variable | Description | Docker Compose value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Browser-facing API base URL | `/backend-api` |
| `NEXT_PUBLIC_WS_BASE_URL` | Browser-facing WebSocket base URL | `ws://localhost:8000` |
| `NEXT_PUBLIC_WS_NACL_SECRET_KEY` | Browser-side WebSocket decryption key, set from `NACL_SECRET_KEY` in Docker Compose | same as `NACL_SECRET_KEY` |
| `INTERNAL_API_BASE_URL` | Internal backend URL used by Next.js rewrites | `http://backend:8000` |

### Agent and Docker Compose scaling

| Variable | Description | Default |
| --- | --- | --- |
| `AGENT_COUNT` | Number of Docker Compose agent containers (`scale`) | `1` |
| `WORKER_COUNT` | Number of worker threads inside one agent process | `1` |
| `DEVICE_ID` | Device identifier for a manually started single agent | hostname |
| `DEVICE_ID_PREFIX` | Prefix used by Docker Compose replicas when `DEVICE_ID` is empty | `rpi-agent` in Compose |
| `MQTT_BROKER_HOST` | MQTT broker host | `localhost` |
| `MQTT_BROKER_PORT` | MQTT broker port | `1883` |
| `MQTT_TASK_DISPATCH_TOPIC` | Task dispatch topic | `iot/task/dispatch` |
| `MQTT_TASK_RESULT_TOPIC` | Result topic | `iot/task/result` |
| `MQTT_DEVICE_HEARTBEAT_TOPIC` | Heartbeat topic | `iot/device/heartbeat` |
| `HEARTBEAT_INTERVAL_SECONDS` | Heartbeat interval | `5` |
| `TASK_QUEUE_SIZE` | Task queue size | `20` |
| `ENCRYPT_PAYLOAD` | Encrypt MQTT payloads for agents | `true` |

Set agent container and worker count in `.env`:

```env
AGENT_COUNT=4
WORKER_COUNT=1
```

- `AGENT_COUNT` is read by Docker Compose during compose-file interpolation for `scale`.
- `WORKER_COUNT` is passed to agent containers through `env_file`.
- After changing `AGENT_COUNT`, recreate the stack so the new replica count is applied:

```bash
docker compose up -d --build --force-recreate
```

## API

The backend exposes Swagger UI at `http://localhost:8000/docs`.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/health` | Backend health check | No |
| `POST` | `/auth/register` | Register a user | No |
| `POST` | `/auth/login` | Log in and receive a JWT | No |
| `GET` | `/auth/me` | Get the current user | Yes |
| `GET` | `/tasks/devices` | List online devices | Yes |
| `POST` | `/tasks/operations` | Create a single operation | Yes |
| `POST` | `/tasks/upload` | Upload a JSON/CSV/TXT batch file | Yes |
| `POST` | `/tasks/` | Low-level task creation endpoint | Yes |
| `GET` | `/tasks/{task_id}` | Get task status and result | Yes |
| `WS` | `/ws/updates?token=<jwt>` | Real-time updates | Yes |

Example single operation request:

```http
POST /tasks/operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "expression": "21/7"
}
```

## Batch Operations

The `/tasks/upload` endpoint accepts `.json`, `.csv`, and `.txt` files. The backend validates operation format and rejects invalid input, including division by zero.

JSON example:

```json
[
  "12+8",
  "25-7",
  "6*9",
  "144/12"
]
```

CSV example:

```csv
expression
21/7
2+4
6*9
```

An example batch file is available in `batch-operations.json`. The backend distributes operations across active devices and sends batch progress updates over WebSocket. The frontend polls task status until each batch operation receives a final result.

## Dashboard behavior

The web dashboard provides:

- single-operation and batch-operation modes
- realtime communication logs over WebSocket
- recent operation history
- online device list only

Recent history and communication logs are stored in browser `localStorage` per logged-in user, so they remain visible after a page refresh. Offline devices disappear from the dashboard after the backend offline timeout and are removed from the database.

## Project Structure

```text
Projekt-IoT/
|-- app/                    # FastAPI entry point and routes
|-- core/                   # configuration, database, auth, MQTT, WebSocket
|-- models/                 # SQLAlchemy models
|-- schemas/                # Pydantic schemas
|-- agent_runtime/          # MQTT agent runtime logic
|-- agent.py                # agent entry point
|-- frontend/               # Next.js application
|-- backend/                # legacy stub, not used by Docker Compose
|-- batch-operations.json   # example batch file
|-- docker-compose.yml      # local stack
|-- Dockerfile.backend      # backend image
|-- Dockerfile.agent        # agent image
|-- requirements.txt        # Python dependencies
`-- .env.example            # configuration template
```