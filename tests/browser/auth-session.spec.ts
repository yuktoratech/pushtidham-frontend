import {test,expect,type BrowserContext} from '@playwright/test';
const user={id:'fixture-donor',name:'Session Fixture',email:'session@example.test',phone:'',role:'donor',status:'active'};
async function fixtures(context:BrowserContext,role='donor'){
 const identity={...user,role};
 let refreshCookie='',serial=0,session=false,cold=false,expired=false;
 let gate:Promise<void>|null=null;
 let refreshCalls=0;
 await context.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  const ok=(data:unknown,headers:Record<string,string>={})=>route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data})});
  const invalid=()=>route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'UNAUTHENTICATED',message:'Authentication required'}})});
  if(path.includes('/auth/')){
   // Authentication must use the first-party frontend URL, never the Render host.
   expect(url.origin).toBe('http://localhost:3000');
   if(path.endsWith('/login')){session=true;refreshCookie='fixture-'+(++serial);return ok({accessToken:'fixture-access',user:identity},{'Set-Cookie':`refresh_token=${refreshCookie}; Path=/api/v1/auth; HttpOnly; SameSite=Lax`})}
   if(path.endsWith('/refresh')){
    refreshCalls++;
    if(cold)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'AUTH_UPSTREAM_UNAVAILABLE',message:'Account services are temporarily unavailable. Please retry.'}})});
    if(!session||!req.headers().cookie?.includes(`refresh_token=${refreshCookie}`))return invalid();
    if(gate)await gate;
    await new Promise(resolve=>setTimeout(resolve,40));
    expired=false;refreshCookie='fixture-'+(++serial);
    return ok({accessToken:'fixture-access',user:identity},{'Set-Cookie':`refresh_token=${refreshCookie}; Path=/api/v1/auth; HttpOnly; SameSite=Lax`});
   }
   if(path.endsWith('/logout')){session=false;return ok(null,{'Set-Cookie':'refresh_token=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0'})}
   if(path.endsWith('/me'))return session&&!expired?ok(identity):invalid();
   return route.fulfill({status:500,body:'unexpected auth action'});
  }
  if(path.endsWith('/donations')){
   if(expired)return invalid();return ok([]);
  }
  if(path.endsWith('/giving-categories')||path.endsWith('/giving')||path.endsWith('/events'))return ok([]);
  return route.fulfill({status:404,body:'{}'});
 });
 return {cold:(value:boolean)=>{cold=value},expire:()=>{expired=true},revoke:()=>{session=false},refreshes:()=>refreshCalls,pause:()=>{let release!:()=>void;gate=new Promise(resolve=>{release=resolve});return()=>{gate=null;release()}}};
}

test('login, all account pages, refresh, new tab, expired token and cross-tab logout',async({page,context})=>{
 test.setTimeout(60000);
 const browserErrors:string[]=[];
 page.on('pageerror',error=>browserErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&/hydration|hydrating|didn't match|server rendered HTML/i.test(message.text()))browserErrors.push(message.text())});
 const state=await fixtures(context);
 await page.goto('/login');await page.getByLabel('Email Address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Fixture-Password-123!');
 await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/account$/);
 const cookies=await context.cookies();expect(cookies.find(cookie=>cookie.name==='refresh_token')?.httpOnly).toBe(true);
 const refreshesAfterLogin=state.refreshes();
 await page.locator('.account-shell').evaluate(node=>node.setAttribute('data-navigation-test','retained'));
 for(const [link,path,title] of [['My Profile','/account/profile','My Profile'],['Donation History','/account/donations','Donation History'],['Change Password','/account/change-password','Change Password']] as const){
  await page.getByRole('navigation',{name:'Donor account navigation',exact:true}).getByRole('link',{name:link,exact:true}).click();
  await expect(page).toHaveURL(new RegExp(path+'$'));await expect(page.getByRole('heading',{name:title,exact:true}).first()).toBeVisible();
  await expect(page.locator('.account-shell')).toHaveAttribute('data-navigation-test','retained');
  await expect(page.getByText('Checking your session…',{exact:true})).toHaveCount(0);
  expect(state.refreshes()).toBe(refreshesAfterLogin);
 }
 await page.goBack();await expect(page).toHaveURL(/\/account\/donations$/);
 await page.goForward();await expect(page).toHaveURL(/\/account\/change-password$/);
 await expect(page.locator('.account-shell')).toHaveAttribute('data-navigation-test','retained');expect(state.refreshes()).toBe(refreshesAfterLogin);
 for(const width of [375,430]){
  await page.setViewportSize({width,height:900});
  await page.getByRole('navigation',{name:'Account navigation',exact:true}).getByRole('link',{name:'My Profile',exact:true}).click();
  await expect(page.getByRole('heading',{name:'My Profile',exact:true,level:1})).toBeVisible();
  await expect(page.locator('.account-shell')).toHaveAttribute('data-navigation-test','retained');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 await page.setViewportSize({width:1280,height:900});
 await page.getByRole('navigation',{name:'Donor account navigation',exact:true}).getByRole('link',{name:'Change Password',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Change Password',exact:true,level:1})).toBeVisible();expect(state.refreshes()).toBe(refreshesAfterLogin);
 const release=state.pause();
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.getByRole('heading',{name:'Preparing your account'})).toBeVisible();
 await expect(page.locator('.account-password-form')).toHaveCount(0);
 await expect(page.locator('.account-shell')).toBeVisible();
 release();await expect(page.getByRole('heading',{name:'Change Password',exact:true,level:1})).toBeVisible();
 const tab=await context.newPage();await tab.goto('/account/profile');await expect(tab.getByRole('heading',{name:'My Profile',exact:true})).toBeVisible();
 // Expired token gets one serialized refresh and safe reads resume.
 state.expire();const before=state.refreshes();
 const finishRefresh=state.pause();
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect.poll(()=>state.refreshes()).toBeGreaterThan(before);
 await expect(page.locator('.account-password-form')).toBeVisible();await expect(page.locator('.account-session-state')).toHaveCount(0);
 finishRefresh();
 await expect(page).toHaveURL(/\/account\/change-password$/);
 await tab.getByRole('navigation',{name:'Donor account navigation',exact:true}).getByRole('link',{name:'Logout',exact:true}).click();
 await expect(tab).toHaveURL(/\/login/);await expect(page).toHaveURL(/\/login/);
 await page.goto('/account');await expect(page).toHaveURL(/\/login\?returnTo=/);
 expect(browserErrors).toEqual([]);
});

test('revoked sessions redirect only after a definitive authentication failure',async({page,context})=>{
 const state=await fixtures(context);
 await page.goto('/login');await page.getByLabel('Email Address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Fixture-Password-123!');await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/account$/);
 state.revoke();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page).toHaveURL(/\/login/);await expect(page.locator('.account-workspace')).toHaveCount(0);
});

test('admin navigation also preserves its document and avoids route-by-route refresh',async({page,context})=>{
 const state=await fixtures(context,'admin');
 await page.goto('/admin/login');await page.getByLabel('Email Address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Fixture-Password-123!');await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/admin$/);
 const baseline=state.refreshes();await page.locator('.adm-sidebar').evaluate(node=>node.setAttribute('data-navigation-test','retained'));
 await page.getByRole('navigation',{name:'Admin navigation'}).getByRole('link',{name:'Giving',exact:true}).click();await expect(page).toHaveURL(/\/admin\/giving$/);
 await expect(page.locator('.adm-sidebar')).toHaveAttribute('data-navigation-test','retained');expect(state.refreshes()).toBe(baseline);
});

test('Render cold start on a protected refresh shows retry and restores without redirecting to Login',async({page,context})=>{
 const state=await fixtures(context);
 await page.goto('/login');await page.getByLabel('Email Address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Fixture-Password-123!');await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/account$/);
 state.cold(true);await page.goto('/account/profile');
 await expect(page.getByRole('button',{name:'Retry account connection'})).toBeVisible();await expect(page).toHaveURL(/\/account\/profile$/);
 state.cold(false);await page.getByRole('button',{name:'Retry account connection'}).click();
 await expect(page.getByRole('heading',{name:'My Profile',exact:true})).toBeVisible();await expect(page).toHaveURL(/\/account\/profile$/);
});
