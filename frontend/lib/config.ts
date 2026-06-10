export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/backend-api";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ??
  API_BASE_URL.replace(/^http/, "ws");

export const WS_NACL_SECRET_KEY =
  process.env.NEXT_PUBLIC_NACL_SECRET_KEY ?? null;

export const IS_MOCK_MODE =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";