// Authentication alone uses this fixed upstream proxy. Public APIs retain their existing URL.
// Refresh cookies are scoped to the frontend host and are never exposed to browser JavaScript.
const actions: Record<string, string[]> = {
  login: ['POST'], register: ['POST'], refresh: ['POST'], logout: ['POST'],
  me: ['GET'], profile: ['PATCH'], 'change-password': ['POST'],
  'forgot-password': ['POST'], 'reset-password': ['POST'],
};
const cookiePath = '/api/v1/auth';
const maxBody = 32 * 1024;
const fail = (status: number, code: string, message: string) => Response.json(
  {success: false, error: {code, message}},
  {status, headers: {'Cache-Control': 'private, no-store, max-age=0'}},
);

export async function proxyAuth(request: Request, action: string, upstream: string | undefined) {
  if (!Object.hasOwn(actions, action)) return fail(404, 'NOT_FOUND', 'Route not found');
  if (!actions[action].includes(request.method)) return fail(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  const frontend = new URL(request.url);
  const origin = request.headers.get('origin');
  // Keep CSRF protection at both the proxy and backend. Never synthesize a trusted Origin.
  if ((request.method !== 'GET' && origin !== frontend.origin) || (origin && origin !== frontend.origin) || request.headers.get('sec-fetch-site') === 'cross-site')
    return fail(403, 'UNTRUSTED_ORIGIN', 'A trusted frontend Origin is required');
  let target: URL;
  try {
    target = new URL(upstream ?? '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
    if ((target.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && local && target.protocol === 'http:')) || target.origin === frontend.origin || target.username || target.password || target.search || target.hash || target.pathname.replace(/\/$/, '') !== '/api/v1') throw new Error();
    target.pathname = `${cookiePath}/${action}`;
  } catch {
    return fail(503, 'AUTH_PROXY_CONFIGURATION', 'Account services are not configured. Please contact the temple.');
  }
  const headers = new Headers({Accept: 'application/json'});
  if (origin) headers.set('Origin', origin);
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('Authorization', authorization);
  // Do not forward analytics, framework or other application cookies to Render.
  const refresh = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('refresh_token='));
  if (refresh) headers.set('Cookie', refresh);
  let body: Uint8Array | undefined;
  if (request.method !== 'GET') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
      return fail(415, 'UNSUPPORTED_MEDIA_TYPE', 'JSON is required');
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBody) { await reader.cancel(); return fail(413, 'BODY_TOO_LARGE', 'Request body too large'); }
        chunks.push(value);
      }
    }
    body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    headers.set('Content-Type', 'application/json');
  }
  try {
    const response = await fetch(target, {
      method: request.method, headers, ...(body ? {body: body as BodyInit} : {}),
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(40000),
    });
    if (response.status >= 300 && response.status < 400) return fail(502, 'AUTH_UPSTREAM_UNAVAILABLE', 'Account services are temporarily unavailable. Please retry.');
    const output = new Headers({'Content-Type': 'application/json', 'Cache-Control': 'private, no-store, max-age=0'});
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) output.set('Retry-After', retryAfter);
    for (const value of response.headers.getSetCookie()) {
      const parts = value.split(';').map(part => part.trim());
      if (!parts[0]?.startsWith('refresh_token=')) continue;
      const expiry = parts.slice(1).filter(part => /^(expires|max-age)=/i.test(part));
      // No Domain attribute: this is a first-party host-only cookie, including on Vercel.
      output.append('Set-Cookie', [parts[0], `Path=${cookiePath}`, 'HttpOnly', 'SameSite=Lax',
        ...(frontend.protocol === 'https:' || process.env.NODE_ENV === 'production' ? ['Secure'] : []), ...expiry].join('; '));
    }
    return new Response(await response.arrayBuffer(), {status: response.status, headers: output});
  } catch {
    // Network errors and cold starts must never masquerade as invalid credentials or clear cookies.
    return fail(503, 'AUTH_UPSTREAM_UNAVAILABLE', 'Account services are temporarily unavailable. Please retry.');
  }
}
