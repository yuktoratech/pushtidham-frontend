import {
  acceptAccessToken,
  authApi,
  authErrorMessage,
  beginAuthChange,
  clearAccessToken,
  refreshSession,
  setSessionListener,
  ApiError,
  getSessionRevision,
  type AuthUser,
} from "./api-client";
export type AuthState = {
  status: "initializing" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  error: string | null;
};
const initial: AuthState = { status: "initializing", user: null, error: null };
let state = initial;
const listeners = new Set<() => void>();
let restoration: Promise<void> | null = null;
let channel: BroadcastChannel | null = null;
let verification: Promise<void> | null = null;
function publish(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}
function clearDemoAuth() {
  for (const role of ["donor", "admin"])
    for (const storage of ["localStorage", "sessionStorage"] as const)
      try {
        window[storage].removeItem(`pushthidham-demo-session-v1-${role}`);
      } catch {
        /* Other demo data stays intact. */
      }
}
setSessionListener(() =>
  publish({ status: "unauthenticated", user: null, error: null }),
);
export const subscribeAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getAuthState = () => state;
export const getServerAuthState = () => initial;
export async function restoreAuth(force = false) {
  if (restoration) return restoration;
  if (!force && state.status !== "initializing") return;
  clearDemoAuth();
  if (!channel && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("pushtidham-auth");
    channel.onmessage = (event) => {
      if (event.data === "logout") {
        clearAccessToken();
        publish({ status: "unauthenticated", user: null, error: null });
      }
    };
  }
  publish(initial);
  const version = beginAuthChange();
  restoration = (async () => {
    try {
      const result = await refreshSession();
      const user = await authApi.me();
      if (acceptAccessToken(result.accessToken, version))
        publish({ status: "authenticated", user, error: null });
    } catch (error) {
      if (getAuthState().status === "initializing")
        publish({
          status: "unauthenticated",
          user: null,
          error:
            error instanceof ApiError && error.status === 401
              ? null
              : authErrorMessage(error),
        });
    } finally {
      restoration = null;
    }
  })();
  return restoration;
}
async function authenticate(
  action: () => Promise<{ accessToken: string; user: AuthUser }>,
) {
  // Wait for startup's cookie rotation before changing the signed-in identity.
  if (restoration) await restoration;
  const version = beginAuthChange();
  const result = await action();
  if (!acceptAccessToken(result.accessToken, version))
    throw new ApiError(
      401,
      "SESSION_CHANGED",
      "Your session changed. Please try again.",
    );
  const user = await authApi.me();
  if (version !== getSessionRevision())
    throw new ApiError(
      401,
      "SESSION_CHANGED",
      "Your session changed. Please try again.",
    );
  clearDemoAuth();
  publish({ status: "authenticated", user, error: null });
  return user;
}
export const login = (email: string, password: string) =>
  authenticate(() => authApi.login(email, password));
export const register = (name: string, email: string, password: string) =>
  authenticate(() => authApi.register(name, email, password));
export async function logout() {
  if (restoration) await restoration;
  await authApi.logout(); // A failed revocation keeps the session visible and allows retry.
  clearAccessToken();
  clearDemoAuth();
  publish({ status: "unauthenticated", user: null, error: null });
  channel?.postMessage("logout");
}
export async function verifyAuth() {
  if (state.status !== "authenticated") return;
  if (verification) return verification;
  const version = getSessionRevision();
  verification = (async () => {
    try {
      const user = await authApi.me();
      if (version === getSessionRevision() && state.status === "authenticated")
        publish({ status: "authenticated", user, error: null });
    } catch (error) {
      if (version === getSessionRevision() && state.status === "authenticated")
        publish({ ...state, error: authErrorMessage(error) });
    } finally {
      verification = null;
    }
  })();
  return verification;
}
export function userContact(user: AuthUser | null) {
  const [firstName = "", ...last] = user?.name.split(/\s+/) ?? [];
  return {
    firstName,
    lastName: last.join(" "),
    email: user?.email ?? "",
    phone: "",
  };
}
