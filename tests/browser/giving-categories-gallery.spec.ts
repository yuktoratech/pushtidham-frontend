import {test,expect,type Page} from '@playwright/test';
const date='2026-10-01T12:00:00Z';
const category={_id:'507f1f77bcf86cd799439011',name:'Daily Seva',slug:'daily-seva',description:'Daily devotional seva.',image:'/images/diya.webp',status:'active',displayOrder:1,createdAt:date,updatedAt:date};
const festival={...category,_id:'507f1f77bcf86cd799439012',name:'Dolotsav',slug:'dolotsav'};
const giving={_id:'507f1f77bcf86cd799439013',categoryId:category._id,title:'Mangla Seva',slug:'mangla-seva',description:'Support daily seva.',image:'/images/diya.webp',category:'daily_seva',festivalGroup:'',amountType:'fixed',fixedAmountsCents:[8400],status:'active',displayOrder:1,createdAt:date,updatedAt:date};
const option={...giving,_id:'507f1f77bcf86cd799439014',categoryId:festival._id,title:'Mukhya Manorathi',slug:'utsav-dolotsav-mukhya-manorathi',category:'utsav',festivalGroup:'dolotsav',fixedAmountsCents:[100100]};
const event={_id:'507f1f77bcf86cd799439015',title:'Festival details',slug:'festival-details',description:'Line one\nLine two',shortDescription:'Information only',startsAt:'2027-01-01T15:00:00Z',location:'Haveli',status:'published',image:'/images/diya.webp',gallery:[{url:'/images/temple.webp',alt:'Temple gallery image',displayOrder:0}],createdAt:date,updatedAt:date};
async function mock(page:Page,admin=false,empty=false){
 const writes:string[]=[];
 await page.route('**/api/v1/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname;
  const ok=(data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({success:true,data})});
  if(route.request().method()!=='GET'&&!path.endsWith('/auth/refresh'))writes.push(path);
  if(path.includes('/auth/'))return admin?ok(path.endsWith('/refresh')?{accessToken:'isolated-token',user:{id:'admin',name:'Admin',email:'admin@example.test',role:'admin',status:'active'}}:{id:'admin',name:'Admin',email:'admin@example.test',role:'admin',status:'active'}):route.fulfill({status:401,body:'{}'});
  if(path.endsWith('/giving-categories'))return ok(empty?[]:[category,festival]);
  if(path.endsWith('/giving/mangla-seva'))return ok(giving);
  if(path.endsWith('/giving/utsav-dolotsav-mukhya-manorathi'))return ok(option);
  if(path.endsWith('/giving'))return ok(empty?[]:url.searchParams.get('categoryId')===festival._id?[option]:url.searchParams.get('categoryId')===category._id?[giving]:[giving,option]);
  if(path.endsWith('/giving/mangla-seva'))return ok(giving);
  if(path.endsWith('/events'))return ok([event]);
  if(path.endsWith('/events/festival-details'))return ok(event);
  return route.fulfill({status:404,body:'{}'});
 });
 return writes;
}
test('category membership, amount reset, checkout context and payment guard',async({page})=>{
 const writes=await mock(page);
 await page.goto('/donate?giving=mangla-seva');
 await expect(page.getByRole('group',{name:'Giving opportunity'}).getByRole('button',{name:/Mangla Seva/})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByText('$84.00',{exact:true}).first()).toBeVisible();
 await page.getByRole('group',{name:'Donation category'}).getByRole('button',{name:/Utsav/}).click();
 await page.getByRole('group',{name:'Festival'}).getByRole('button',{name:/Dolotsav/}).click();
 await expect(page.getByRole('group',{name:'Giving opportunity'}).getByRole('button',{name:/Mangla Seva/})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Continue to Checkout'})).toBeDisabled();
 await page.getByRole('button',{name:/Mukhya Manorathi/}).click();
 await expect(page.getByText('$1,001.00',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'Continue to Checkout'}).click();
 await expect(page).toHaveURL(new RegExp('categoryId='+festival._id));
 expect(new URL(page.url()).searchParams.get('givingCategory')).toBe('dolotsav');
 await expect(page.getByRole('heading',{name:'Online Payments Unavailable'})).toBeVisible();
 expect(writes.filter(path=>path.includes('/payments/'))).toEqual([]);
});
test('empty categories and old Event URLs give honest informational states',async({page})=>{
 await mock(page,false,true);await page.goto('/donate?event=festival-details');
 await expect(page.getByRole('heading',{name:'Giving categories are being prepared'})).toBeVisible();
 await expect(page.getByText('Events are information only.',{exact:false})).toBeVisible();
});
test('category selection and gallery remain usable at all approved widths',async({page})=>{
 test.setTimeout(90_000);
 await mock(page);
 for(const width of [320,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/donate');
  await expect(page.getByRole('group',{name:'Donation category'}).getByRole('button',{name:/Daily Seva/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.goto('/events/festival-details');
  await expect(page.getByRole('button',{name:'Next image'})).toBeVisible();
  await page.getByRole('button',{name:'Next image'}).click();
  await expect(page.getByAltText('Temple gallery image')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  expect(await page.locator('a[href*="event="]').count()).toBe(0);
 }
});
test('gallery reduced motion, keyboard, play and slide indicators',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await mock(page);await page.goto('/events/festival-details');
 await expect(page.getByRole('button',{name:'Play slideshow'})).toBeVisible();
 await page.getByRole('region',{name:'Festival details photos'}).focus();
 await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'Show image 2'})).toHaveAttribute('aria-current','true');
 await page.getByRole('button',{name:'Play slideshow'}).click();
 await expect(page.getByRole('button',{name:'Pause slideshow'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Show image 1'})).toHaveAttribute('aria-current','true',{timeout:7000});
 const gallery=page.getByRole('region',{name:'Festival details photos'});
 await gallery.dispatchEvent('pointerdown',{pointerType:'touch',clientX:220});
 await gallery.dispatchEvent('pointerup',{pointerType:'touch',clientX:100});
 await expect(page.getByRole('button',{name:'Show image 2'})).toHaveAttribute('aria-current','true');
});
test('category management is developer-only and Event gallery previews use isolated reads only',async({page})=>{
 const writes=await mock(page,true);
 await page.goto('/admin/giving-categories');await expect(page.getByRole('heading',{name:'Access denied'})).toBeVisible();
 await page.goto('/admin/events');await page.getByRole('button',{name:'Edit Festival details'}).click();
 await expect(page.getByLabel('Select gallery images')).toHaveAttribute('multiple','');
 await expect(page.getByRole('button',{name:'Use as cover'})).toBeVisible();
 await page.getByRole('button',{name:'Remove image 1'}).click();
 await expect(page.getByRole('button',{name:'Use as cover'})).toHaveCount(0);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(writes).toEqual([]);
});

test('gallery upload failure, retry, cover and ordering use mocked storage only',async({page})=>{
 await mock(page,true);
 let attempts=0,saved:Record<string,unknown>|undefined;
 await page.route('**/api/v1/admin/uploads/events**',route=>{
  attempts++;
  return route.fulfill({status:attempts===1?502:201,contentType:'application/json',body:JSON.stringify(attempts===1?{success:false,error:{code:'IMAGE_UPLOAD_FAILED',message:'Fixture upload failure'}}:{success:true,data:{url:attempts===2?'/images/annakut.webp':'/images/darshan.webp',key:'fixture-only',size:100,contentType:'image/webp'}})});
 });
 await page.route('**/api/v1/admin/events/'+event._id,async route=>{
  saved=route.request().postDataJSON();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:{...event,...saved}})});
 });
 await page.goto('/admin/events');
 await page.getByRole('button',{name:'Edit Festival details'}).click();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=','base64');
 await page.getByLabel('Select gallery images').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:png},{name:'two.png',mimeType:'image/png',buffer:png}]);
 await expect(page.getByRole('button',{name:'Remove unsaved image'})).toHaveCount(2);
 await page.getByRole('button',{name:'Save Event',exact:true}).click();
 await expect(page.getByText('Upload or remove the selected gallery files before saving.')).toBeVisible();
 expect(saved).toBeUndefined();
 await page.getByRole('button',{name:'Upload selected images / retry failures'}).click();
 await expect(page.getByText('Fixture upload failure')).toBeVisible();
 await page.getByRole('button',{name:'Upload selected images / retry failures'}).click();
 await expect(page.getByRole('button',{name:'Remove unsaved image'})).toHaveCount(0);
 await page.getByRole('button',{name:'Move up',exact:true}).nth(2).click();
 await page.getByRole('button',{name:'Use as cover'}).nth(1).click();
 await page.getByRole('button',{name:'Save Event',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(attempts).toBe(3);expect(saved?.image).toBe('/images/darshan.webp');
 expect((saved?.gallery as {url:string}[]).map(row=>row.url)).toEqual(['/images/temple.webp','/images/darshan.webp','/images/annakut.webp']);
});

test('developer-only category route and Giving/Event editors fit mobile and desktop',async({page})=>{
 await mock(page,true);
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/admin/giving-categories');await expect(page.getByRole('heading',{name:'Access denied'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.goto('/admin/giving');await page.getByRole('button',{name:'Edit Mangla Seva'}).click();
  await expect(page.getByRole('dialog').getByRole('combobox',{name:'Giving category',exact:true})).toHaveValue(category._id);
  await expect(page.getByRole('dialog').getByRole('combobox',{name:'Status *',exact:true})).toHaveValue('active');
  expect(await page.locator('label[for="catalog-status"]').evaluate((label:HTMLLabelElement)=>label.control?.id)).toBe('catalog-status');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.goto('/admin/events');await page.getByRole('button',{name:'Edit Festival details'}).click();
  await expect(page.getByLabel('Select gallery images')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
 }
});
