import { ALLOWED_OPERATIONS } from "./constants";

export type Operation = (typeof ALLOWED_OPERATIONS)[number];

export type HistoryItem = {
    id: string;
    operation: Operation;
    a: number;
    b: number;
    response: "success";
  };