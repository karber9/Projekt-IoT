// data/mockDevices.ts
export type Device = {
  id: string;
  name: string;
  status: "online" | "offline";
  lastSeen: string;
  topic: string;
  serverConnection: "connected" | "disconnected";
  heartbeat: string;
  activity: string;
};

export const mockDevices: Device[] = [
  {
    id: "dev-001",
    name: "Conveyor Controller",
    status: "online",
    lastSeen: "just now",
    topic: "factory/conveyor/dev-001",
    serverConnection: "connected",
    heartbeat: "2s ago",
    activity: "Idle",
  },
  {
    id: "dev-002",
    name: "Sorting Arm",
    status: "online",
    lastSeen: "10s ago",
    topic: "factory/sorter/dev-002",
    serverConnection: "connected",
    heartbeat: "5s ago",
    activity: "Waiting for task",
  },
  {
    id: "dev-003",
    name: "Packaging Unit",
    status: "offline",
    lastSeen: "3m ago",
    topic: "factory/packaging/dev-003",
    serverConnection: "disconnected",
    heartbeat: "No recent heartbeat",
    activity: "Unavailable",
  },
];