"use client";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { authErrorMessage } from "../lib/api-client";
export function LogoutLink({
  children,
  className,
  admin = false,
}: {
  children: ReactNode;
  className?: string;
  admin?: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <a
        href={admin ? "/admin/login" : "/login"}
        className={className}
        aria-disabled={pending}
        onClick={async (event) => {
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          setPending(true);
          setError("");
          try {
            await auth.logout();
            router.replace(
              admin ? "/admin/login?loggedOut=1" : "/login?loggedOut=1",
            );
          } catch (failure) {
            setError(authErrorMessage(failure));
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : children}
      </a>
      {error && (
        <p className="auth-error" role="alert">
          {error} You are still signed in. Retry logout.
        </p>
      )}
    </>
  );
}
