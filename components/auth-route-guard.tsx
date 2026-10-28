"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
export function AuthRouteGuard({
  role,
  children,
}: {
  role?: "admin";
  children: ReactNode;
}) {
  const auth = useAuth();
  const path = usePathname();
  const router = useRouter();
  const allowed =
    auth.status === "authenticated" && (!role || auth.user?.role === role);
  useEffect(() => {
    if (auth.status === "initializing" || auth.error) return;
    if (auth.status === "unauthenticated")
      router.replace(
        role === "admin"
          ? "/admin/login"
          : `/login?returnTo=${encodeURIComponent(path)}`,
      );
    else if (!allowed) router.replace("/account");
  }, [auth.status, auth.error, allowed, path, role, router]);
  if (allowed) return <>{children}</>;
  return (
    <main className="container checkout-empty" role="status">
      {auth.error ? (
        <>
          <p>{auth.error}</p>
          <button className="button" onClick={() => void auth.restore()}>
            Retry account connection
          </button>
        </>
      ) : (
        <p>
          {auth.status === "initializing"
            ? "Checking your session…"
            : "Opening sign-in…"}
        </p>
      )}
    </main>
  );
}
