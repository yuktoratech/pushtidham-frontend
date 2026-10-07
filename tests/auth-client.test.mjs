import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/api-client.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
let moduleNumber = 0;
async function client() {
  process.env.NEXT_PUBLIC_API_URL = "http://api.example.test/api/v1";
  return import(
    "data:text/javascript;base64," +
      Buffer.from(compiled + "\n// " + moduleNumber++).toString("base64")
  );
}
const response = (data, status = 200) =>
  new Response(
    JSON.stringify(
      status === 200
        ? { success: true, data }
        : {
            success: false,
            error: {
              code: "UNAUTHENTICATED",
              message: "Authentication required",
            },
          },
    ),
    { status, headers: { "Content-Type": "application/json" } },
  );
test("simultaneous unauthorized requests perform one refresh and retry with the new memory token", async (t) => {
  const api = await client();
  let refreshes = 0;
  let retries = 0;
  const version = api.beginAuthChange();
  api.acceptAccessToken("expired-test-token", version);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.credentials, "include");
    if (url.endsWith("/auth/refresh")) {
      refreshes++;
      assert.equal(new Headers(options.headers).has("Authorization"), false);
      await new Promise((resolve) => setTimeout(resolve, 20));
      return response({
        accessToken: "fresh-test-token",
        user: { role: "donor" },
      });
    }
    if (
      new Headers(options.headers).get("Authorization") ===
      "Bearer expired-test-token"
    )
      return response(null, 401);
    retries++;
    return response({ ok: true });
  });
  const results = await Promise.all([
    api.apiRequest("/private"),
    api.apiRequest("/private"),
    api.apiRequest("/private"),
  ]);
  assert.equal(refreshes, 1);
  assert.equal(retries, 3);
  assert.ok(results.every((result) => result.ok));
});
test("a still-unauthorized retry stops and invalidates exactly once without an infinite loop", async (t) => {
  const api = await client();
  let refreshes = 0;
  let requests = 0;
  let invalidations = 0;
  api.setSessionListener(() => invalidations++);
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/auth/refresh")) {
      refreshes++;
      return response({
        accessToken: "fresh-test-token",
        user: { role: "donor" },
      });
    }
    requests++;
    return response(null, 401);
  });
  await assert.rejects(
    api.apiRequest("/private"),
    (error) => error.status === 401,
  );
  assert.equal(refreshes, 1);
  assert.equal(requests, 2);
  assert.equal(invalidations, 1);
});
test("an old refresh response cannot overwrite a newer login token", async (t) => {
  const api = await client();
  let finish;
  const ready = new Promise((resolve) => {
    finish = resolve;
  });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/refresh")) {
      await ready;
      return response({
        accessToken: "stale-test-token",
        user: { role: "donor" },
      });
    }
    assert.equal(
      new Headers(options.headers).get("Authorization"),
      "Bearer new-login-test-token",
    );
    return response({ ok: true });
  });
  const old = api.refreshSession();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const version = api.beginAuthChange();
  api.acceptAccessToken("new-login-test-token", version);
  finish();
  await assert.rejects(old, (error) => error.code === "SESSION_CHANGED");
  assert.ok((await api.apiRequest("/private")).ok);
});
test("logout never hides backend failure by refreshing and network errors are normalized", async (t) => {
  const api = await client();
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    requests++;
    assert.ok(url.endsWith("/auth/logout"));
    return response(null, 401);
  });
  await assert.rejects(api.authApi.logout(), (error) => error.status === 401);
  assert.equal(requests, 1);
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Network failure");
  });
  await assert.rejects(
    api.authApi.login("test@example.test", "non-secret-test-value"),
    (error) => error.code === "NETWORK_ERROR",
  );
});
