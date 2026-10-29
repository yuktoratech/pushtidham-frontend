import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compiled=ts.transpileModule(readFileSync(new URL('../lib/auth-proxy.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {proxyAuth}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const origin='https://frontend.example.test';
const upstream='https://backend.example.test/api/v1';
const req=(action='refresh',headers={},body='{}')=>new Request(`${origin}/api/v1/auth/${action}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body});

test('proxy preserves Origin and authorization, forwards only refresh cookie and scopes response to the frontend',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(String(url),upstream+'/auth/refresh');
  assert.equal(options.headers.get('origin'),origin);
  assert.equal(options.headers.get('cookie'),'refresh_token=synthetic-fixture');
  assert.equal(options.headers.get('authorization'),'Bearer fixture-access');
  assert.equal(options.redirect,'manual');
  return new Response('{"success":true}',{headers:{'Set-Cookie':'refresh_token=synthetic-next; Path=/api/v1/auth; Domain=backend.example.test; HttpOnly; Secure; SameSite=None; Max-Age=604800'}});
 });
 const response=await proxyAuth(req('refresh',{Cookie:'analytics=private; refresh_token=synthetic-fixture; framework=private',Authorization:'Bearer fixture-access'}),'refresh',upstream);
 const cookie=response.headers.get('set-cookie');
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Path=\/api\/v1\/auth/);assert.match(cookie,/Max-Age=604800/);assert.doesNotMatch(cookie,/Domain=/);
 assert.match(response.headers.get('cache-control'),/no-store/);
});

test('missing or untrusted Origin is blocked before upstream access',async t=>{
 t.mock.method(globalThis,'fetch',()=>assert.fail('upstream must not be called'));
 assert.equal((await proxyAuth(req('refresh',{Origin:'https://attacker.example.test'}),'refresh',upstream)).status,403);
 const missing=new Request(origin+'/api/v1/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 assert.equal((await proxyAuth(missing,'logout',upstream)).status,403);
 assert.equal((await proxyAuth(req('refresh',{'Sec-Fetch-Site':'cross-site'}),'refresh',upstream)).status,403);
});

test('proxy rejects arbitrary routes, redirects, invalid upstreams and oversized JSON',async t=>{
 t.mock.method(globalThis,'fetch',()=>assert.fail('upstream must not be called'));
 assert.equal((await proxyAuth(req(),'../../webhooks/stripe',upstream)).status,404);
 assert.equal((await proxyAuth(req(),'__proto__',upstream)).status,404);
 assert.equal((await proxyAuth(req('me'),'me',upstream)).status,405);
 assert.equal((await proxyAuth(req(),'refresh','https://backend.example.test/api/v1?target=other')).status,503);
 assert.equal((await proxyAuth(req(),'refresh','https://username:password@backend.example.test/api/v1')).status,503);
 assert.equal((await proxyAuth(req('refresh',{},'x'.repeat(33000)),'refresh',upstream)).status,413);
});

test('logout clears the same host-only cookie and never forwards unrelated Set-Cookie headers',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('{}',{headers:{'Set-Cookie':'refresh_token=; Path=/api/v1/auth; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT'}}));
 const response=await proxyAuth(req('logout'),'logout',upstream);
 assert.match(response.headers.get('set-cookie'),/Expires=Thu, 01 Jan 1970/);
 assert.match(response.headers.get('set-cookie'),/Path=\/api\/v1\/auth/);
 t.mock.restoreAll();
 t.mock.method(globalThis,'fetch',async()=>new Response('{}',{headers:{'Set-Cookie':'unrelated=private; Path=/'}}));
 assert.equal((await proxyAuth(req(),'refresh',upstream)).headers.get('set-cookie'),null);
});

test('cold starts do not become invalid sessions or clear refresh cookies',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('isolated network failure')});
 const response=await proxyAuth(req(),'refresh',upstream);
 assert.equal(response.status,503);assert.equal(response.headers.get('set-cookie'),null);
 assert.equal((await response.json()).error.code,'AUTH_UPSTREAM_UNAVAILABLE');
 t.mock.restoreAll();
 t.mock.method(globalThis,'fetch',async()=>new Response('',{status:302,headers:{Location:'https://other.example.test'}}));
 assert.equal((await proxyAuth(req(),'refresh',upstream)).status,502);
});

test('upstream invalid-session and rate-limit responses retain their status',async t=>{
 for(const status of [401,429]){
  t.mock.method(globalThis,'fetch',async()=>new Response('{"success":false}',{status,headers:{'Retry-After':'60'}}));
  const response=await proxyAuth(req(),'refresh',upstream);assert.equal(response.status,status);assert.equal(response.headers.get('retry-after'),'60');
  t.mock.restoreAll();
 }
});
