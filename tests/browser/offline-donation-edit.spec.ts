import {test,expect,type Page} from '@playwright/test';

const stamp='2026-10-01T12:00:00.000Z';
const ids={donation:'111111111111111111111111',donor:'222222222222222222222222',next:'333333333333333333333333',giving:'444444444444444444444444',category:'555555555555555555555555',daily:'666666666666666666666666',fixed:'777777777777777777777777'};
async function fixture(page:Page,status='pending',online=false,fail=''){
  let row:Record<string,unknown>={id:ids.donation,donationNumber:'OFFLINE-FIXTURE',type:'general',giving:ids.giving,event:null,designationTitle:'Other',donationPurpose:'Temple library',baseDonationCents:2500,feeContributionCents:null,grossChargedCents:null,actualProviderFeeCents:null,adjustmentLossCents:0,netProceedsCents:null,currency:'USD',paymentProvider:null,paymentMethod:online?'card':'offline',paymentLifecycle:null,displayStatus:status,donationStatus:status,recordKind:online?'verified_online':'offline',providerVerified:online,receiptEligible:status==='completed',createdAt:stamp,donationDate:stamp,completedAt:status==='completed'?stamp:undefined,offlinePaymentMethod:'cash',correctionVersion:0,receiptRevision:status==='completed'?1:0,receiptHistoryTracked:true,adminNote:'Saved note',donor:{id:ids.donor,name:'Original Donor',email:'original@example.test',phone:'123'},references:{offline:'CHECK-1'},adjustments:[]};
  const saved:Array<{body:Record<string,unknown>;key:string|undefined}>=[];
  const history:{entries:unknown[];receipts:unknown[]}={entries:[],receipts:status==='completed'?[{revision:1,previousRevision:null,sha256:'fixture',createdAt:stamp,superseded:false}]:[]};
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    const ok=(data:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data})});
    if(path.includes('/auth/')){const user={id:'admin-fixture',name:'Admin',email:'admin@example.test',role:'admin',status:'active'};return ok(path.endsWith('/refresh')?{accessToken:'fixture-token',user}:user)}
    if(path.endsWith('/offline')&&request.method()==='PATCH'){
      const body=request.postDataJSON();saved.push({body,key:request.headers()['idempotency-key']});
      if(fail==='conflict')return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'CORRECTION_CONFLICT',message:'This donation changed. Reload its details.'}})});
      if(fail==='network'&&saved.length===1)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'UNAVAILABLE',message:'Temporary interruption'}})});
      row={...row,baseDonationCents:body.amountCents,donationPurpose:body.donationPurpose,correctionVersion:1,adminNote:body.adminNote,receiptRevision:status==='completed'?2:0};
      history.entries=[{id:'audit-fixture',actor:'admin-fixture',version:1,reason:body.reason,changes:{amountCents:{before:2500,after:body.amountCents}},receiptImpact:true,receiptRevision:status==='completed'?2:null,createdAt:stamp}];
      return ok({id:ids.donation,version:1,replayed:saved.length>1});
    }
    if(path.endsWith('/corrections'))return ok(history);
    if(path.endsWith('/donors/search'))return ok([{id:ids.next,name:'Correct Donor',email:'correct@example.test',phone:'456',setupRequired:false,welcomeEmailStatus:null}]);
    if(path.endsWith('/donations/'+ids.donation))return ok(row);
    if(path.endsWith('/donations'))return ok([row]);
    if(path.endsWith('/giving-categories'))return ok([{_id:ids.category,name:'General Donation',slug:'general-donation',status:'active'},{_id:ids.daily,name:'Daily Seva',slug:'daily-seva',status:'active'}]);
    if(path.endsWith('/giving'))return ok([{_id:ids.giving,title:'Other',slug:'other',category:'general',categoryId:ids.category,amountType:'custom',fixedAmountsCents:[],status:'active'},{_id:ids.fixed,title:'Fixed Seva',slug:'fixed-seva',category:'daily_seva',categoryId:ids.daily,amountType:'fixed',fixedAmountsCents:[8400],status:'active'}]);
    if(path.endsWith('/events'))return ok([]);
    return route.fulfill({status:404,contentType:'application/json',body:'{}'});
  });
  await page.goto('/admin/donations');await page.getByRole('button',{name:'View Details',exact:true}).click();
  return saved;
}

for(const status of ['pending','completed','rejected'])test(`${status}: prefilled correction, review, save and audit on mobile`,async({page},testInfo)=>{
  await page.setViewportSize({width:375,height:812});const saved=await fixture(page,status);
  const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Edit Donation',exact:true}).click();
  await expect(dialog.getByRole('textbox',{name:'Internal admin note',exact:true})).toHaveValue('Saved note');
  await expect(dialog.getByRole('textbox',{name:'Donation amount (USD)',exact:true})).toHaveValue('25.00');
  for(const width of [375,430,1440]){await page.setViewportSize({width,height:900});expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBeTruthy();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy()}
  await page.setViewportSize({width:375,height:812});
  if(status==='pending')await page.screenshot({path:testInfo.outputPath('offline-editor-375.png')});
  await dialog.getByRole('textbox',{name:'Donation amount (USD)',exact:true}).fill('35');
  await dialog.getByRole('textbox',{name:'Correction reason (required)',exact:true}).fill('Incorrect amount entered');
  await dialog.getByRole('button',{name:'Review Changes',exact:true}).click();
  await expect(dialog.getByText('After: $35.00',{exact:true})).toBeVisible();expect(saved).toHaveLength(0);
  expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBeTruthy();
  if(status==='pending')await page.screenshot({path:testInfo.outputPath('offline-review-375.png')});
  await dialog.getByRole('button',{name:'Confirm & Save',exact:true}).click();
  await expect(dialog.getByText('Correction saved. Current donation details and list have been refreshed.')).toBeVisible();
  await expect(dialog.getByText('Reason: Incorrect amount entered',{exact:true})).toBeVisible();
  expect(saved).toHaveLength(1);expect(saved[0].body).toMatchObject({expectedVersion:0,amountCents:3500,donorId:ids.donor,reason:'Incorrect amount entered'});expect(saved[0].body).not.toHaveProperty('status');
  for(const width of [375,430,1440]){await page.setViewportSize({width,height:900});expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBeTruthy()}
});

test('donor reassignment confirmation, conflict feedback and draft preservation',async({page})=>{
  const saved=await fixture(page,'pending',false,'conflict'),dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:'Edit Donation',exact:true}).click();
  await dialog.getByLabel('Find an existing donor by email',{exact:true}).fill('correct@');
  await dialog.getByRole('button',{name:'Correct Donor · correct@example.test',exact:true}).click();
  await dialog.getByRole('textbox',{name:'Correction reason (required)',exact:true}).fill('Wrong donor selected');
  await dialog.getByRole('button',{name:'Review Changes',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('Confirm reassignment');expect(saved).toHaveLength(0);
  await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Review Changes',exact:true}).click();
  await dialog.getByRole('button',{name:'Confirm & Save',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('This donation changed');
  await dialog.getByRole('button',{name:'Back to edit',exact:true}).click();await expect(dialog.getByRole('textbox',{name:'Correction reason (required)',exact:true})).toHaveValue('Wrong donor selected');
  expect(saved[0].body).toMatchObject({donorId:ids.next,confirmDonorReassignment:true});
});

test('validation and category dependencies retain fixed/custom rules',async({page})=>{
  const saved=await fixture(page),dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Edit Donation',exact:true}).click();
  await dialog.getByRole('textbox',{name:'Donation amount (USD)',exact:true}).fill('0');await dialog.getByRole('textbox',{name:'Correction reason (required)',exact:true}).fill('Fix amount');
  await dialog.getByRole('button',{name:'Review Changes',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('$1 to $10,000');
  await dialog.getByRole('textbox',{name:'Donation amount (USD)',exact:true}).fill('25');await dialog.getByRole('textbox',{name:'Correction reason (required)',exact:true}).fill('   ');
  await dialog.getByRole('button',{name:'Review Changes',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('Enter a correction reason');
  await dialog.getByRole('combobox',{name:'Donation category',exact:true}).selectOption(ids.daily);await expect(dialog.getByRole('combobox',{name:'Giving',exact:true})).toHaveValue('');
  await dialog.getByRole('combobox',{name:'Giving',exact:true}).selectOption(ids.fixed);await expect(dialog.getByRole('combobox',{name:'Donation amount (USD)',exact:true})).toHaveValue('84.00');expect(saved).toHaveLength(0);
});

test('uncertain network response retries exactly the same correction identity',async({page})=>{
  const saved=await fixture(page,'pending',false,'network'),dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Edit Donation',exact:true}).click();
  await dialog.getByRole('textbox',{name:'Internal admin note',exact:true}).fill('Corrected note');await dialog.getByRole('textbox',{name:'Correction reason (required)',exact:true}).fill('Clarify note');
  await dialog.getByRole('button',{name:'Review Changes',exact:true}).click();await dialog.getByRole('button',{name:'Confirm & Save',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'Back to edit',exact:true})).toBeDisabled();await dialog.getByRole('button',{name:'Retry Same Correction',exact:true}).click();
  await expect(dialog.getByText('Correction saved. Current donation details and list have been refreshed.')).toBeVisible();expect(saved).toHaveLength(2);expect(saved[0]).toEqual(saved[1]);
});

test('online donation has no financial edit action',async({page})=>{
  await fixture(page,'completed',true);await expect(page.getByRole('dialog').getByRole('button',{name:'Edit Donation',exact:true})).toHaveCount(0);
});
