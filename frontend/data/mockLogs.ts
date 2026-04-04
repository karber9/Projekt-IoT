export type LogItem = {
    id: string;
    timestamp: string;
    level: "info" | "success" | "warning" | "error";
    source: string;
    message: string;
  };
  
  export const mockLogs: LogItem[] = [
    {
      id: "log-001",
      timestamp: "12:41:03",
      level: "info",
      source: "server",
      message: "Operation request received.",
    },
    {
      id: "log-002",
      timestamp: "12:41:04",
      level: "success",
      source: "mqtt",
      message: "Message delivered to device dev-001.",
    },
    {
      id: "log-003",
      timestamp: "12:41:05",
      level: "info",
      source: "device",
      message: "Device dev-001 acknowledged operation.",
    },
    {
      id: "log-004",
      timestamp: "12:41:08",
      level: "warning",
      source: "mqtt",
      message: "Device dev-003 heartbeat delayed.",
    },
  ];