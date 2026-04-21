import { ALLOWED_OPERATIONS } from "./constants";

export type Operation = (typeof ALLOWED_OPERATIONS)[number];

export type Device = {
  device_id: string;
  name: string;
  status: string;
};

export type OperationRequest = {
  operation: Operation;
  a: number;
  b: number;
  device_id: string;
};

export type OperationResponse = {
  operation_id: string;
  status: string;
};

export type HistoryItem = {
  id: string;
  operation: Operation;
  a: number;
  b: number;
  device_id: string;
  operation_id: string;
  status: string;
};