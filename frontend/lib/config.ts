export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/backend-api";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ??
  API_BASE_URL.replace(/^http/, "ws");
