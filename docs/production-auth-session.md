# Production session fix

Observed on October 29, 2026:

- The deployed frontend bundle calls `https://pushtidham-backend.onrender.com/api/v1` directly, including authentication.
- Backend health and auth OPTIONS return the exact Vercel origin with `Access-Control-Allow-Credentials: true`.
- A cookie-less logout response (no account/session/database write) confirms refresh cookie attributes: `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`, no Domain.
- These are different sites (`vercel.app` / `onrender.com`). A Lax cookie cannot accompany the cross-site POST used for refresh. Login initially works through its in-memory access token; document navigation loses that token and restoration fails. Browser third-party-cookie blocking would also make a direct `SameSite=None` design unreliable. No authenticated production session or provider-dashboard credentials were inspected.

## Implemented architecture

Only authentication is proxied through Next.js `/api/v1/auth/[action]`. Other existing API calls keep their Render URL and bearer authorization. The proxy has a fixed server-configured upstream, a route/method allowlist, a 32 KiB request cap, no upstream redirect following, no caching, and an exact same-origin check for mutations. It forwards the actual browser Origin to Render; it never fabricates a trusted Origin. Only the refresh cookie is forwarded upstream. Response cookies are host-only, HttpOnly, Secure on HTTPS, `SameSite=Lax`, and use the same auth path for creation and deletion. No refresh token is stored in JavaScript/localStorage or included in client state.

Session restoration waits before protected redirects. Temporary upstream/network/429 failures have an explicit unavailable/retry state and preserve an already authenticated identity. Refresh, login, registration and logout share the browser Web Lock, while requests in one document also share the refresh promise. Stale errors cannot invalidate a superseding session. Login changes and logout propagate through BroadcastChannel. Server rotation, hashed tokens and replay revocation remain unchanged. Backend refresh has its own 60/minute IP budget, still under the existing global 120/minute limiter; login retains its existing 20/15-minute budget. No client-forwarded IP header is trusted by the new proxy. As with the existing global limiter, monitor shared proxy egress limits for larger deployments before changing any limit.

## Exact deployment configuration (prepared, not applied)

Vercel production:

```dotenv
NEXT_PUBLIC_API_URL=https://pushtidham-backend.onrender.com/api/v1
AUTH_API_URL=https://pushtidham-backend.onrender.com/api/v1
```

`AUTH_API_URL` is server-only and falls back to the existing absolute `NEXT_PUBLIC_API_URL` if omitted. Do not set the latter to a relative URL: non-auth APIs remain on Render. The upstream must be a distinct server origin with the `/api/v1` base. Existing local development can continue using the absolute localhost backend API URL; no local environment edit is required.

Render should retain:

```dotenv
NODE_ENV=production
FRONTEND_URL=https://pushtidham-frontend-lilac.vercel.app
COOKIE_SAME_SITE=lax
```

The public responses confirm Secure and the allowed origin, but Render/Vercel dashboard environment variables were not accessible. Do not rotate JWT secrets or change payment configuration. No wildcard CORS, cookie Domain sharing or third-party-cookie browser exception is needed. Preserve the deployment's correctly configured trusted proxy hop count.

After approval, deploy the frontend proxy/state changes to Vercel and the dedicated refresh limiter to Render. Runtime Next.js functions must be enabled; this is not a static export. Users must sign in once after deployment because existing Render-domain cookies are not transferred to Vercel. Validate login, account navigation, reload/new tab, refresh and logout after deployment with an authorized test account. This local task does not claim authenticated production verification and does not deploy.

## Focused checks

- `node --test tests/auth-client.test.mjs tests/auth-state.test.mjs tests/auth-proxy.test.mjs`
- `npx playwright test tests/browser/auth-session.spec.ts tests/browser/login-retry.spec.ts --workers=1` (isolated browser fixtures, no production login)
- Backend `npx tsx --test tests/auth-session.test.ts` (isolated local MongoDB)
- TypeScript, targeted ESLint, diff checks.
