import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const apiSource=compile('../lib/api-client.ts'),stateSource=compile('../lib/auth-state.ts');
let serial=0;
async function fixture(t){
 process.env.NEXT_PUBLIC_API_URL='https://backend.example.test/api/v1';
 const previous=globalThis.BroadcastChannel;
 globalThis.BroadcastChannel=class{onmessage=null;postMessage(){};close(){}};
 t.after(()=>{globalThis.BroadcastChannel=previous});
 const url='data:text/javascript;base64,'+Buffer.from(apiSource+'\n//state-test-'+(++serial)).toString('base64');
 return import('data:text/javascript;base64,'+Buffer.from(stateSource.replace('"./api-client"',JSON.stringify(url))).toString('base64'));
}
const user={id:'fixture-donor',name:'Fixture Donor',email:'fixture@example.test',role:'donor',status:'active'};
const response=(data,status=200)=>new Response(JSON.stringify(status===200?{success:true,data}:{success:false,error:{code:status===401?'UNAUTHENTICATED':'AUTH_UPSTREAM_UNAVAILABLE',message:'Account services unavailable'}}),{status});

test('startup cold start stays recoverable and an authenticated connection error never signs out',async t=>{
 const auth=await fixture(t);let cold=true;
 t.mock.method(globalThis,'fetch',async url=>cold?response(null,503):response(url.endsWith('/refresh')?{accessToken:'fixture-access',user}:user));
 await auth.restoreAuth();assert.equal(auth.getAuthState().status,'unavailable');assert.ok(auth.getAuthState().error);
 cold=false;await auth.restoreAuth(true);assert.equal(auth.getAuthState().status,'authenticated');
 cold=true;await auth.restoreAuth(true);assert.equal(auth.getAuthState().status,'authenticated');assert.deepEqual(auth.getAuthState().user,user);
});

test('definitively invalid refresh signs out and no token is persisted',async t=>{
 const auth=await fixture(t);t.mock.method(globalThis,'fetch',async()=>response(null,401));
 await auth.restoreAuth();assert.equal(auth.getAuthState().status,'unauthenticated');assert.equal(auth.getAuthState().user,null);assert.equal(auth.getAuthState().error,null);
});
