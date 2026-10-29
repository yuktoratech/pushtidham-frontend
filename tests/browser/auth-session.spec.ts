import {test,expect,type BrowserContext} from '@playwright/test';
const user={id:'fixture-donor',name:'Session Fixture',email:'session@example.test',phone:'',role:'donor',status:'active'};
async function fixtures(context:BrowserContext){
 let refreshCookie='',serial=0,session=false,cold=false,expired=false;
 let refreshCalls=0;
 await context.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  const ok=(data:unknown,headers:Record<string,string>={})=>route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data})});
  const invalid=()=>route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'UNAUTHENTICATED',message:'Authentication required'}})});
  if(path.includes('/auth/')){
   // Authentication must use the first-party frontend URL, never the Render host.
   expect(url.origin).toBe('http://localhost:3000');
   if(path.endsWith('/login')){session=true;refreshCookie='fixture-'+(++serial);return ok({accessToken:'fixture-access',user},{'Set-Cookie':`refresh_token=${refreshCookie}; Path=/api/v1/auth; HttpOnly; SameSite=Lax`})}
   if(path.endsWith('/refresh')){
    refreshCalls++;
    if(cold)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'AUTH_UPSTREAM_UNAVAILABLE',message:'Account services are temporarily unavailable. Please retry.'}})});
    if(!session||!req.headers().cookie?.includes(`refresh_token=${refreshCookie}`))return invalid();
    await new Promise(resolve=>setTimeout(resolve,40));
    expired=false;refreshCookie='fixture-'+(++serial);
    return ok({accessToken:'fixture-access',user},{'Set-Cookie':`refresh_token=${refreshCookie}; Path=/api/v1/auth; HttpOnly; SameSite=Lax`});
   }
   if(path.endsWith('/logout')){session=false;return ok(null,{'Set-Cookie':'refresh_token=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0'})}
   if(path.endsWith('/me'))return session&&!expired?ok(user):invalid();
   return route.fulfill({status:500,body:'unexpected auth action'});
  }
  if(path.endsWith('/donations')){
   if(expired)return invalid();return ok([]);
  }
  if(path.endsWith('/giving-categories')||path.endsWith('/giving')||path.endsWith('/events'))return ok([]);
  return route.fulfill({status:404,body:'{}'});
 });
 return {cold:(value:boolean)=>{cold=value},expire:()=>{expired=true},refreshes:()=>refreshCalls};
}

test('login, all account pages, refresh, new tab, expired token and cross-tab logout',async({page,context})=>{
 test.setTimeout(60000);
 const state=await fixtures(context);
 await page.goto('/login');await page.getByLabel('Email Address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Fixture-Password-123!');
 await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/account$/);
 const cookies=await context.cookies();expect(cookies.find(cookie=>cookie.name==='refresh_token')?.httpOnly).toBe(true);
 for(const [link,path,title] of [['My Profile','/account/profile','My Profile'],['Donation History','/account/donations','Donation History'],['Change Password','/account/change-password','Change Password']] as const){
  await page.getByRole('navigation',{name:'Donor account navigation',exact:true}).getByRole('link',{name:link,exact:true}).click();
  await expect(page).toHaveURL(new RegExp(path+'$'));await expect(page.getByRole('heading',{name:title,exact:true}).first()).toBeVisible();
 }
 await page.reload();await expect(page.getByRole('heading',{name:'Change Password',exact:true,level:1})).toBeVisible();
 const tab=await context.newPage();await tab.goto('/account/profile');await expect(tab.getByRole('heading',{name:'My Profile',exact:true})).toBeVisible();
 // Expired token gets one serialized refresh and safe reads resume.
 state.expire();const before=state.refreshes();
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect.poll(()=>state.refreshes()).toBeGreaterThan(before);
 await expect(page).toHaveURL(/\/account\/change-password$/);
 await tab.getByRole('navigation',{name:'Donor account navigation',exact:true}).getByRole('link',{name:'Logout',exact:true}).click();
 await expect(tab).toHaveURL(/\/login/);await expect(page).toHaveURL(/\/login/);
 await page.goto('/account');await expect(page).toHaveURL(/\/login\?returnTo=/);
});

test('Render cold start on a protected refresh shows retry and restores without redirecting to Login',async({page,context})=>{
 const state=await fixtures(context);
 await page.goto('/login');await page.getByLabel('Email Address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Fixture-Password-123!');await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/account$/);
 state.cold(true);await page.goto('/account/profile');
 await expect(page.getByRole('button',{name:'Retry account connection'})).toBeVisible();await expect(page).toHaveURL(/\/account\/profile$/);
 state.cold(false);await page.getByRole('button',{name:'Retry account connection'}).click();
 await expect(page.getByRole('heading',{name:'My Profile',exact:true})).toBeVisible();await expect(page).toHaveURL(/\/account\/profile$/);
});
