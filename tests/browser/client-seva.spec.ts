import {test,expect,type Page} from '@playwright/test';
const stamp='2026-10-19T12:00:00Z';
const daily=[['mangla-seva','Mangla Seva',8400],['palna-seva','Palna Seva',15100],['silver-palna-seva','Silver Palna Seva',20100],['rajbhog-seva','Rajbhog Seva',30100],['gold-palna-seva','Golden Palna Seva',25100],['shayan-seva','Shayan Palna',10100],['whole-day-manorathi','Whole Day Seva',40100]] as const;
const festivalGroups={dolotsav:'Dolotsav','pragatya-divas-maha-bhog':'Pragatya Divas / Maha Bhog','nand-mahotsav':'Nand Mahotsav','adhikmas-hindola':'Adhikmas / Hindola',annakut:'Annakut'};
const common=[['Mukhya Manorathi',100100],['Sahayak Manorathi',50100],['Palana',15100]] as const;
const categories=[{_id:'daily-id',name:'Daily Seva',slug:'daily-seva',description:'Daily seva',image:'',status:'active' as const,displayOrder:0,createdAt:stamp,updatedAt:stamp},...Object.entries(festivalGroups).map(([slug,name],index)=>({_id:'festival-'+slug,name,slug,description:name,image:'',status:'active' as const,displayOrder:index+1,createdAt:stamp,updatedAt:stamp})),{_id:'general-id',name:'General Donation',slug:'general-donation',description:'General donations',image:'',status:'active' as const,displayOrder:8,createdAt:stamp,updatedAt:stamp}];
const giving=daily.map(([slug,title,amount],index)=>({_id:'daily-'+index,slug,title,categoryId:'daily-id',category:'daily_seva' as const,festivalGroup:'',amountType:'fixed' as const,fixedAmountsCents:[amount],status:'active' as const,displayOrder:index,description:'Client-confirmed seva.',image:'',createdAt:stamp,updatedAt:stamp}));
const utsav=Object.keys(festivalGroups).flatMap((key)=>{
  const options=key==='adhikmas-hindola'?[['Weekday Manorathi',22500],['Weekend Manorathi',35100]]:key==='annakut'?[['Mukhya Manorathi',300100],['Sahayak Manorathi',200100],['Sha-Sahayak Manorathi',100100],['Manorathi',20100]]:common;
  return options.map(([title,amount],index)=>({...giving[0],_id:'utsav-'+key+'-'+index,categoryId:'festival-'+key,slug:'utsav-'+key+'-'+String(title).toLowerCase().replaceAll(' ','-'),title,category:'utsav' as const,festivalGroup:key,fixedAmountsCents:[amount]}));
});
const all=[...giving,...utsav,{...giving[0],_id:'mahaprasad',categoryId:'general-id',slug:'mahaprasad-manorathi',title:'Mahaprasad Manorathi',category:'general' as const,fixedAmountsCents:[50100]}];
async function mockApi(page:Page,admin=false) {
  await page.route('**/api/v1/**',route=>{
    const path=new URL(route.request().url()).pathname;
    const ok=(data:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data})});
    if(path.endsWith('/auth/refresh')||path.endsWith('/auth/me')){
      if(!admin)return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'UNAUTHENTICATED',message:'Sign in'}})});
      const user={id:'fixture-admin',name:'Fixture Admin',email:'fixture@example.test',role:'admin',status:'active'};
      return ok(path.endsWith('/refresh')?{accessToken:'fixture-only',user}:user);
    }
    if(path.endsWith('/giving-categories'))return ok(categories);
    if(path.startsWith('/api/v1/giving/'))return ok(all.find(row=>row.slug===path.split('/').pop())||all[0]);
    if(path.endsWith('/giving'))return ok(all);
    if(path.endsWith('/events'))return ok([]);
    return route.fulfill({status:404,body:'{}'});
  });
}

test('confirmed Daily Seva and Mahaprasad display without mixing festival options into General',async({page})=>{
  await mockApi(page);await page.goto('/giving');
  await expect(page.getByRole('heading',{name:'Daily Seva',exact:true})).toBeVisible();
  await expect(page.locator('.giving-opportunity-card')).toHaveCount(8);
  for(const [,title]of daily)await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  await expect(page.locator('.giving-opportunity-card').filter({hasText:'Golden Palna Seva'})).toContainText('$251.00');
  await expect(page.getByRole('heading',{name:'Mahaprasad Manorathi'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Mukhya Manorathi',exact:true})).toHaveCount(0);
});

test('five Utsav groups and fifteen options preserve Event selection and fixed pricing across refresh',async({page})=>{
  await mockApi(page);
  for(const width of [375,1280]){
    await page.setViewportSize({width,height:900});await page.goto('/events');
    await expect(page.locator('.utsav-card')).toHaveCount(5);
    await expect(page.locator('.utsav-card a')).toHaveCount(15);
    const card=page.locator('.utsav-card').filter({has:page.getByRole('heading',{name:'Annakut',exact:true})});
    await expect(card).toContainText('Mukhya Manorathi — $3,001.00');
    await card.getByRole('link',{name:'Mukhya Manorathi — $3,001.00',exact:true}).click();
    await expect(page.getByRole('group',{name:'Donation category'}).getByRole('button',{name:'Utsav'})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('group',{name:'Festival'}).getByRole('button',{name:'Annakut'})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('group',{name:'Giving opportunity'}).getByRole('button',{name:/Mukhya Manorathi/})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.donation-amount-option')).toHaveCount(1);
    await expect(page.getByLabel('Custom amount (USD)')).toHaveCount(0);
    await page.reload();await expect(page.getByRole('group',{name:'Giving opportunity'}).getByRole('button',{name:/Mukhya Manorathi/})).toHaveAttribute('aria-pressed','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByText('Online payments are currently unavailable for this client demo.')).toBeVisible();
  }
});

test('admin reuses Giving editor for festival options and retains R2 upload controls',async({page})=>{
  await mockApi(page,true);
  for(const width of [375,1280]){
    await page.setViewportSize({width,height:900});await page.goto('/admin/giving');
    await page.getByRole('button',{name:'Edit Mukhya Manorathi',exact:true}).first().click();
    await expect(page.getByLabel('Catalog section')).toHaveValue('utsav');
    await expect(page.getByLabel('Festival group')).toHaveValue('dolotsav');
    await expect(page.getByLabel('Fixed amounts (USD) *',{exact:true})).toHaveValue('1001');
    await expect(page.getByRole('group',{name:'Catalog image'})).toContainText('Maximum 15 MiB');
    await expect(page.getByLabel('Image URL or asset path')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
  }
});
