import {test,expect} from '@playwright/test';
const stamp='2026-10-01T12:00:00Z';
const row={_id:'giving-fixture',title:'Existing Seva',slug:'existing-seva',category:'daily_seva',categoryId:'daily-id',festivalGroup:'',amountType:'fixed',fixedAmountsCents:[8400],description:'',image:'',displayOrder:1,status:'active',createdAt:stamp,updatedAt:stamp};
test('Giving editor hides category assignment and sends only section/festival context',async({page})=>{
 const saved:Array<Record<string,unknown>>=[];
 await page.route('**/api/v1/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  const ok=(data:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data})});
  if(path.includes('/auth/')){const user={id:'admin-fixture',name:'Admin',email:'admin@example.test',role:'admin',status:'active'};return ok(path.endsWith('/refresh')?{accessToken:'fixture-token',user}:user)}
  if(['POST','PUT'].includes(request.method())&&path.includes('/admin/giving')){saved.push(request.postDataJSON());return ok({...row,...request.postDataJSON()})}
  if(path.endsWith('/giving-categories'))return ok([{_id:'daily-id',name:'Daily Seva',slug:'daily-seva',status:'active'}]);
  if(path.endsWith('/giving'))return ok([row]);if(path.endsWith('/events'))return ok([]);return route.fulfill({status:404,body:'{}'});
 });
 await page.goto('/admin/giving');await page.getByRole('button',{name:'Add Opportunity',exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.getByRole('combobox',{name:/^Giving category/})).toHaveCount(0);
 await dialog.getByLabel('Title *',{exact:true}).fill('New Seva');await dialog.getByRole('combobox',{name:/^Catalog section/}).selectOption('utsav');
 await dialog.getByRole('combobox',{name:/^Festival group/}).selectOption('annakut');await dialog.getByLabel('Fixed amounts (USD) *',{exact:true}).fill('501');
 await dialog.getByRole('button',{name:'Save Opportunity',exact:true}).click();await expect(dialog).toHaveCount(0);
 expect(saved[0]).toMatchObject({category:'utsav',festivalGroup:'annakut',fixedAmountsCents:[50100]});expect(saved[0]).not.toHaveProperty('categoryId');
 await page.getByRole('button',{name:'Edit Existing Seva',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('combobox',{name:/^Giving category/})).toHaveCount(0);
 await page.getByRole('dialog').getByRole('combobox',{name:/^Catalog section/}).selectOption('general');
 await page.getByRole('dialog').getByRole('button',{name:'Save Opportunity',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);expect(saved[1]).toMatchObject({category:'general',festivalGroup:''});expect(saved[1]).not.toHaveProperty('categoryId');
});
