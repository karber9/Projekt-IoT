export type LogItem = {
  id: string;
  deviceId: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  source: "server" | "mqtt" | "device";
  message: string;
};

export const mockLogs: LogItem[] = [
  {
    id: "log-001",
    deviceId: "server",
    timestamp: "12:41:03",
    level: "info",
    source: "server",
    message: "Task request received from dashboard.",
  },
  {
    id: "log-002",
    deviceId: "server",
    timestamp: "12:41:04",
    level: "success",
    source: "mqtt",
    message: "Router selected an available destination client.",
  },
  {
    id: "log-003",
    deviceId: "dev-001",
    timestamp: "12:41:05",
    level: "info",
    source: "mqtt",
    message: "Operation forwarded to Conveyor Controller.",
  },
  {
    id: "log-004",
    deviceId: "dev-001",
    timestamp: "12:41:06",
    level: "success",
    source: "device",
    message: "Device acknowledged operation execution.",
  },
  {
    id: "log-005",
    deviceId: "dev-002",
    timestamp: "12:42:10",
    level: "info",
    source: "server",
    message: "Sorting Arm remains idle with no pending tasks.",
  },
  {
    id: "log-006",
    deviceId: "dev-003",
    timestamp: "12:43:12",
    level: "warning",
    source: "mqtt",
    message: "Packaging Unit heartbeat delayed.",
  },
  {
    id: "log-007",
    deviceId: "dev-003",
    timestamp: "12:43:20",
    level: "error",
    source: "device",
    message: "Device disconnected before task confirmation.",
  },
];