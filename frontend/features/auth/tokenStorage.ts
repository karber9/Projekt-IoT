const TOKEN_KEY = "iot_access_token";
const USER_EMAIL_KEY = "iot_user_email";
const AUTH_NOTICE_KEY = "iot_auth_notice";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(USER_EMAIL_KEY);
}

export function storeUserEmail(email: string): void {
  window.localStorage.setItem(USER_EMAIL_KEY, email);
}

export function clearStoredUserEmail(): void {
  window.localStorage.removeItem(USER_EMAIL_KEY);
}

export function getStoredAuthNotice(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const notice = window.localStorage.getItem(AUTH_NOTICE_KEY);
  window.localStorage.removeItem(AUTH_NOTICE_KEY);
  return notice;
}

export function storeAuthNotice(message: string): void {
  window.localStorage.setItem(AUTH_NOTICE_KEY, message);
}
