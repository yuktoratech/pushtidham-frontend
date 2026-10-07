export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "donor" | "admin";
  status: "active" | "disabled";
};
export type AuthResult = { accessToken: string; user: AuthUser };
export type ApiIssue = { path: string; message: string };
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: ApiIssue[] = [],
  ) {
    super(message);
  }
}
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
let accessToken: string | null = null;
let revision = 0;
let refreshPromise: Promise<AuthResult> | null = null;
let onInvalidSession: () => void = () => {};
export function setSessionListener(listener: () => void) {
  onInvalidSession = listener;
}
export function clearAccessToken() {
  revision++;
  accessToken = null;
}
export function beginAuthChange() {
  clearAccessToken();
  return revision;
}
export function getSessionRevision() {
  return revision;
}
export function acceptAccessToken(token: string, version: number) {
  if (version !== revision) return false;
  accessToken = token;
  return true;
}
async function send<T>(
  path: string,
  options: RequestInit = {},
  token = accessToken,
): Promise<T> {
  if (!baseUrl)
    throw new ApiError(
      0,
      "API_CONFIGURATION",
      "Account services are not configured. Please contact the temple.",
    );
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Account services are unavailable. Please try again.",
    );
  }
  let payload: {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string; details?: ApiIssue[] };
  };
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "Account services returned an unexpected response. Please try again.",
    );
  }
  if (!response.ok || payload.success !== true)
    throw new ApiError(
      response.status,
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "The request could not be completed.",
      payload.error?.details,
    );
  return payload.data as T;
}
export function refreshSession(): Promise<AuthResult> {
  if (refreshPromise) return refreshPromise;
  const version = revision;
  const refresh = async () => {
    const result = await send<AuthResult>(
      "/auth/refresh",
      { method: "POST", body: "{}" },
      null,
    );
    if (!acceptAccessToken(result.accessToken, version))
      throw new ApiError(
        401,
        "SESSION_CHANGED",
        "Your session changed. Please try again.",
      );
    return result;
  };
  // Serialize refresh across tabs as well as concurrent requests in this document.
  const pending = (async () => {
    if (typeof navigator !== "undefined" && navigator.locks)
      return await navigator.locks.request("pushtidham-auth-refresh", refresh);
    return await refresh();
  })();
  const shared = pending.finally(() => {
    refreshPromise = null;
  });
  refreshPromise = shared;
  return shared;
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const usedToken = accessToken;
  const usedRevision = revision;
  try {
    return await send<T>(path, options, usedToken);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      (path.startsWith("/auth/") && path !== "/auth/me")
    )
      throw error;
    if (usedRevision !== revision)
      throw new ApiError(
        401,
        "SESSION_CHANGED",
        "Your session changed. Please try again.",
      );
    try {
      if (accessToken === usedToken) await refreshSession();
      return await send<T>(path, options);
    } catch (retryError) {
      if (
        retryError instanceof ApiError &&
        retryError.status === 401 &&
        usedRevision === revision
      ) {
        clearAccessToken();
        onInvalidSession();
      }
      throw retryError;
    }
  }
}
export const authApi = {
  login: (email: string, password: string) =>
    send<AuthResult>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      null,
    ),
  register: (name: string, email: string, password: string) =>
    send<AuthResult>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ name, email, password }) },
      null,
    ),
  logout: () =>
    send<null>("/auth/logout", { method: "POST", body: "{}" }, null),
  me: () => apiRequest<AuthUser>("/auth/me"),
};
export function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS")
      return "Incorrect email or password, or this account is disabled. Please try again or contact the temple.";
    if (error.status === 409)
      return "An account with this email address already exists. Please log in.";
    if (error.status === 429)
      return "Too many attempts. Please wait before trying again.";
    return error.message;
  }
  return "Unable to complete the request. Please try again.";
}
