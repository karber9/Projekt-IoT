# IoT Project Frontend

Frontend is a Next.js dashboard for authenticated users to send operations to the backend, monitor active devices, inspect realtime communication logs, and upload batch operation files.

## Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Native `fetch` API client
- WebSocket client for realtime updates

## Local Run

From `frontend/`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

Docker Compose normally exposes the frontend on:

```text
http://localhost:3000
```

## Environment Variables

The frontend reads public configuration from:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_WS_BASE_URL
INTERNAL_API_BASE_URL
```

Current Docker Compose values:

```text
NEXT_PUBLIC_API_BASE_URL=/backend-api
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
INTERNAL_API_BASE_URL=http://backend:8000
```

`NEXT_PUBLIC_API_BASE_URL` is used by the browser API client. `NEXT_PUBLIC_WS_BASE_URL` is used by the WebSocket client. `INTERNAL_API_BASE_URL` is used by Next.js rewrites/proxying inside Docker.

## User Flows

### Authentication

The frontend supports:

- registration
- login
- current user lookup
- logout
- protected dashboard route
- expired token handling

The access token is stored by the frontend auth provider and attached as:

```text
Authorization: Bearer <token>
```

### Single Operation

The user can send one operation with:

```ts
{
  expression: string; // e.g. "21/7" or "2+4"
}
```

The backend chooses an online device automatically.

### Batch Operation

The user can switch from `Single operation` to `File batch` mode and upload a JSON, CSV, or TXT file.

Batch mode always sends the whole file to the backend. The frontend does not select devices for batch operations. The backend is expected to distribute operations across active devices.

## Batch File Format

Supported extensions:

- `.json`
- `.csv`
- `.txt`

### JSON

JSON must contain an array of expression strings:

```json
[
  "21/7",
  "2+4",
  "6*9"
]
```

### CSV / TXT

CSV can contain an `expression` header:

```csv
expression
21/7
2+4
```

TXT and CSV may also contain one expression per line.

Validation performed by the frontend:

- file is present
- file is not empty
- extension is supported
- JSON root is an array
- operation list is not empty
- each item is a valid expression
- expression uses one of `+`, `-`, `*`, `/`
- division by zero is rejected

No backend file size limit is currently defined in the frontend contract.

## API Contracts

### Register

```http
POST /auth/register
Content-Type: application/json
```

```ts
type RegisterRequest = {
  email: string;
  password: string;
};
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```ts
type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
};
```

### Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

### Devices

```http
GET /tasks/devices
Authorization: Bearer <token>
```

```ts
type Device = {
  device_id: string;
  status?: "online" | "offline" | "busy" | "error" | "unknown" | string;
  name?: string;
  last_seen?: string;
  encryption_status?: "unknown" | "available" | "missing_key" | "error" | string;
  public_key_fingerprint?: string;
  last_key_rotation?: string;
};
```

### Single Operation

```http
POST /tasks/operations
Authorization: Bearer <token>
Content-Type: application/json
```

```ts
type OperationRequest = {
  expression: string;
};
```

### Batch Upload

```http
POST /tasks/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form field:

```text
file=<JSON, CSV, or TXT file>
```

Expected response:

```ts
type OperationResponse = {
  operation_id: string;
  task_id?: number;
  user_id?: number;
  expression?: string;
  device_id?: string;
  status: string;
  result?: string | number | null;
};
```

### Operation Status

```http
GET /tasks/{operation_id}
Authorization: Bearer <token>
```

The frontend uses this endpoint as a fallback when WebSocket result events are delayed or missed.

## WebSocket Contracts

Connection:

```text
GET /ws/updates?token=<access_token>
```

Supported incoming events:

```ts
type DeviceUpdatedEvent = {
  type: "device.updated";
  device_id: string;
  status: string;
  last_seen?: string;
};
```

```ts
type TaskUpdatedEvent = {
  type: "task.updated";
  task_id: number;
  status: string;
  result?: string | number | null;
  device_id?: string;
};
```

```ts
type BatchProgressEvent = {
  type: "batch.progress";
  batch_id: string;
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
};
```

```ts
type CommunicationLogEvent = {
  type: "communication.log";
  log: {
    id: string;
    timestamp: string;
    direction: "frontend->server" | "server->device" | "device->server" | "server";
    device_id?: string;
    task_id?: number;
    message_type: string;
    status: string;
    payload_preview?: string;
    error?: string;
  };
};
```

Recommended backend log message types for future compatibility:

```text
batch.started
batch.operation.assigned
batch.completed
operation.requested
operation.assigned
mqtt.dispatched
mqtt.result
task.updated
device.status_changed
error
```

## Realtime Logs

The logs panel supports:

- filtering by device
- filtering by category
- filtering by direction
- clearing filters
- rendering task, device, batch and communication events

The frontend keeps only the latest realtime events in memory.

## Encryption Contract

The frontend does not generate, store or rotate cryptographic keys. Encryption is expected to be handled by the backend and/or devices.

If backend exposes encryption metadata for devices, the frontend can display it in the devices panel.

Optional device fields:

```ts
type DeviceEncryptionStatus =
  | "unknown"
  | "available"
  | "missing_key"
  | "error";

type DeviceEncryptionFields = {
  encryption_status?: DeviceEncryptionStatus | string;
  public_key_fingerprint?: string;
  last_key_rotation?: string;
};
```

Frontend expectations:

- `available` means the device has usable encryption metadata.
- `missing_key` means backend/device cannot encrypt until a key is available.
- `error` means backend/device reported an encryption problem.
- `unknown` means backend did not confirm encryption state.

Frontend security boundaries:

- do not store private keys in `localStorage`, `sessionStorage` or React state
- do not send private keys through WebSocket logs
- do not render full secret material in the UI
- only display safe metadata such as fingerprints and status

## Known Limitations

- Automated tests are not configured because installing new test dependencies was skipped.
- Batch final results use `GET /tasks/{operation_id}` polling as a fallback.
- Full backend-side batch lifecycle events are not guaranteed yet.
- Frontend does not implement encryption logic and should not store private keys.
- Backend should define an explicit upload file size limit.

## Useful Commands

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
```
