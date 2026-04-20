export const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE ?? "real";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const IS_MOCK_MODE = DATA_MODE === "mock";
export const IS_REAL_MODE = DATA_MODE === "real";