import {test,expect,type Page} from '@playwright/test';
const stamp='2026-10-01T12:00:00Z';
const category=(id:string,slug:string,name:string)=>({_id:id,slug,name,status:'active',description:'',image:'',displayOrder:1,createdAt:stamp,updatedAt:stamp});
const categories=[category('cat-daily','daily-seva','Daily Seva'),category('cat-general','general-donation','General Donation'),category('cat-festival','dolotsav','Dolotsav')];
const item=(id:string,title:string,categoryId:string,amountType:string,amounts:number[],slug=id,kind='general')=>({_id:id,title,slug,categoryId,category:kind,amountType,fixedAmountsCents:amounts,status:'active',description:'',image:'',displayOrder:1,createdAt:stamp,updatedAt:stamp});
const giving=[item('daily','Mangla Seva','cat-daily','fixed_and_custom',[5100],'mangla-seva','daily_seva'),item('general','Mahaprasad','cat-general','fixed',[50100]),item('other','Other','cat-general','custom',[]),item('utsav','Mukhya Manorathi','cat-festival','fixed',[100100],'utsav-option','utsav')];
const donor={id:'donor-existing',name:'Saved Donor',email:'saved@example.test',phone:'1234567890',setupRequired:false,welcomeEmailStatus:null};
async function setup(page:Page,failFirst=false){
 const saves:Array<{body:Record<string,unknown>;key:string|undefined}>=[];
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  const ok=(data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({success:true,data})});
  if(path.includes('/auth/')){const user={id:'admin',name:'Admin',email:'admin@example.test',role:'admin',status:'active'};return ok(path.endsWith('/refresh')?{accessToken:'fixture-token',user}:user)}
  if(path.endsWith('/giving-categories'))return ok(categories);
  if(path.endsWith('/giving'))return ok(giving);
  if(path.endsWith('/events'))return ok([]);
  if(path.endsWith('/donors/search'))return ok(donor.email.startsWith(url.searchParams.get('email')||'')?[donor]:[]);
  if(path.endsWith('/donations/offline')){
   saves.push({body:req.postDataJSON(),key:req.headers()['idempotency-key']});
   if(failFirst&&saves.length===1)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,error:{message:'Interrupted save response'}})});
   await new Promise(resolve=>setTimeout(resolve,100));
   return ok({id:'donation-fixture',donationNumber:'PD-FIXTURE-001',donor:{...donor,email:String(saves.at(-1)!.body.donorEmail)},replayed:saves.length>1},201);
  }
  if(path.endsWith('/donations'))return ok([]);
  return route.fulfill({status:404,body:'{}'});
 });
 await page.goto('/admin/donations');await page.getByRole('button',{name:'Add Offline Donation',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Add Offline Donation',exact:true})).toBeVisible();
 return saves;
}

test('offline hierarchy, amount rules and existing donor autofill',async({page})=>{
 const saves=await setup(page);
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('daily-seva');
 await page.getByRole('combobox',{name:'Subcategory / Giving',exact:true}).selectOption('daily');
 await expect(page.getByRole('button',{name:'$51.00',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'$51.00',exact:true}).click();
 await expect(page.getByLabel('Donation amount (USD)')).toHaveValue('51.00');
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('utsav');
 await expect(page.getByLabel('Donation amount (USD)')).toHaveCount(0);
 await page.getByRole('combobox',{name:'Subcategory / Festival',exact:true}).selectOption('cat-festival');
 await page.getByRole('combobox',{name:'Giving',exact:true}).selectOption('utsav');
 await expect(page.getByLabel('Donation amount (USD)')).toHaveValue('1001.00');
 await page.getByLabel('Search donor email').fill('saved@example.test');
 await page.getByRole('button',{name:/Saved Donor saved@example.test/}).click();
 await expect(page.getByLabel('Full name')).toHaveValue('Saved Donor');
 await expect(page.getByLabel('Full name')).toHaveAttribute('readonly','');
 await page.getByRole('button',{name:'Save Donation & Add Next'}).click();
 await expect(page.getByText('Donation saved: PD-FIXTURE-001')).toBeVisible();
 expect(saves).toHaveLength(1);expect(saves[0].body).toMatchObject({user:donor.id,donorName:'Saved Donor',type:'event',categoryId:'cat-festival',giving:'utsav',amountCents:100100,offlinePaymentMethod:'cash'});
 await expect(page.getByRole('combobox',{name:'Category',exact:true})).toHaveValue('');
});

test('Other purpose, new donor and retry retain the same idempotency identity',async({page})=>{
 const saves=await setup(page,true);
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('general-donation');
 await page.getByRole('combobox',{name:'Subcategory / Giving',exact:true}).selectOption('other');
 await page.getByLabel('Donation amount (USD)').fill('25');
 await page.getByLabel('Donation purpose (required)').fill('   ');
 await page.getByLabel('Search donor email').fill('new@example.test');
 await expect(page.getByText('No exact account match.',{exact:false})).toBeVisible();
 await page.getByLabel('Full name').fill('New Donor');
 await page.getByRole('button',{name:'Save Donation & Add Next'}).click();
 await expect(page.getByText('Donation purpose is required for Other.',{exact:true})).toBeVisible();expect(saves).toHaveLength(0);
 await page.getByLabel('Donation purpose (required)').fill('Temple library');
 await page.getByRole('combobox',{name:'Payment method',exact:true}).selectOption('check');
 await page.getByRole('button',{name:'Save Donation & Add Next'}).click();
 await expect(page.getByRole('button',{name:'Retry Same Donation'})).toBeVisible();
 await page.getByRole('button',{name:'Retry Same Donation'}).click();
 await expect(page.getByText('Donation saved: PD-FIXTURE-001')).toBeVisible();
 expect(saves).toHaveLength(2);expect(saves[0].key).toBe(saves[1].key);expect(saves[0].body).toEqual(saves[1].body);
 expect(saves[0].body).toMatchObject({giving:'other',amountCents:2500,donationPurpose:'Temple library',donorName:'New Donor',offlinePaymentMethod:'check'});
 expect(saves[0].body).not.toHaveProperty('password');
});

test('offline entry is usable at mobile and desktop sizes',async({page})=>{
 await setup(page);
 for(const width of [375,430,1440]){
  await page.setViewportSize({width,height:950});
  await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('general-donation');
  await page.getByRole('combobox',{name:'Subcategory / Giving',exact:true}).selectOption('general');
  await expect(page.getByLabel('Donation amount (USD)')).toHaveValue('501.00');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.getByRole('button',{name:'Save Donation & Add Next'}).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Save Donation & Add Next'})).toBeVisible();
 }
});
