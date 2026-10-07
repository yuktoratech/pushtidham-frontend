"use client";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getAuthState,
  getServerAuthState,
  subscribeAuth,
  restoreAuth,
  verifyAuth,
  login,
  register,
  logout,
  type AuthState,
} from "../lib/auth-state";
const AuthContext = createContext<
  | (AuthState & {
      login: typeof login;
      register: typeof register;
      logout: typeof logout;
      restore: () => Promise<void>;
    })
  | null
>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribeAuth,
    getAuthState,
    getServerAuthState,
  );
  useEffect(() => {
    void restoreAuth();
    const check = () => {
      if (document.visibilityState === "visible") void verifyAuth();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        restore: () => restoreAuth(true),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required");
  return context;
}
