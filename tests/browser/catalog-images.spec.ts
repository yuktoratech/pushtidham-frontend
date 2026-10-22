import {expect,test,type Page, type Route} from '@playwright/test';

const now='2027-01-10T15:00:00.000Z';
const image='https://images.example.test/catalog/events/00000000-0000-4000-8000-000000000001.webp';
const giving={_id:'giving-image',title:'Mangla Seva',slug:'mangla-seva',description:'Morning seva.',image,amountType:'fixed',fixedAmountsCents:[8400],status:'active',displayOrder:1,createdAt:now,updatedAt:now};
const event={_id:'event-image',title:'Temple Gathering',slug:'temple-gathering',shortDescription:'Community gathering.',description:'Join the community.',startsAt:now,location:'Pushtidham Haveli',image,status:'published',createdAt:now,updatedAt:now};

async function respond(route:Route,status:number,data?:unknown,error?:{code:string;message:string}){
  await route.fulfill({status,contentType:'application/json',body:status===204?'':JSON.stringify(error?{success:false,error}:{success:true,data})});
}

async function mockApi(page:Page){
  await page.route('https://images.example.test/**',route=>route.fulfill({status:404,body:''}));
  await page.route('**/api/v1/**',async route=>{
    const url=new URL(route.request().url());
    const path=url.pathname;
    const method=route.request().method();
    if(path.endsWith('/auth/refresh')||path.endsWith('/auth/me')){
      const user={id:'admin-image',name:'Image Admin',email:'image-admin@example.test',role:'admin',status:'active'};
      return respond(route,200,path.endsWith('/refresh')?{accessToken:'image-token',user}:user);
    }
    if(path.endsWith('/admin/uploads/giving')&&method==='POST')return respond(route,201,{url:'https://images.example.test/catalog/giving/00000000-0000-4000-8000-000000000002.png',key:'giving/00000000-0000-4000-8000-000000000002.png',contentType:'image/png',size:45});
    if(path.endsWith('/admin/uploads/events')&&method==='POST')return respond(route,503,undefined,{code:'IMAGE_STORAGE_UNAVAILABLE',message:'Image uploads are not configured'});
    if(path.endsWith('/admin/uploads')&&method==='DELETE')return respond(route,204);
    if(path.endsWith('/admin/giving')&&method==='GET')return respond(route,200,[giving]);
    if(path.endsWith('/admin/events')&&method==='GET')return respond(route,200,[event]);
    if(path.includes('/admin/giving/')&&method==='PUT')return respond(route,200,{...giving,...route.request().postDataJSON()});
    if(path.includes('/admin/events/')&&method==='PUT')return respond(route,200,{...event,...route.request().postDataJSON()});
    if(path.endsWith('/giving/mangla-seva'))return respond(route,200,giving);
    if(path.endsWith('/events/temple-gathering'))return respond(route,200,event);
    if(path.endsWith('/giving'))return respond(route,200,[giving]);
    if(path.endsWith('/events'))return respond(route,200,[event]);
    return respond(route,404,undefined,{code:'NOT_FOUND',message:'Mock route not found'});
  });
}

async function noOverflow(page:Page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  const dialog=page.getByRole('dialog');
  if(await dialog.count())expect(await dialog.evaluate(element=>element.scrollWidth)).toBeLessThanOrEqual(await dialog.evaluate(element=>element.clientWidth));
}

test('Giving and Event image controls are usable at desktop and mobile widths',async({page})=>{
  await mockApi(page);
  for(const width of [390,1280]){
    await page.setViewportSize({width,height:900});
    await page.goto('/admin/giving');
    await page.getByRole('button',{name:'Edit Mangla Seva'}).click();
    await expect(page.getByRole('group',{name:'Catalog image'})).toBeVisible();
    await expect(page.getByLabel('Image URL or asset path')).toHaveCount(0);
    await noOverflow(page);
    await page.getByRole('button',{name:'Cancel'}).click();

    await page.goto('/admin/events');
    await page.getByRole('button',{name:'Edit Temple Gathering'}).click();
    await expect(page.getByRole('group',{name:'Catalog image'})).toBeVisible();
    await expect(page.getByLabel('Image URL or asset path')).toHaveCount(0);
    await noOverflow(page);
    await page.getByRole('button',{name:'Cancel'}).click();
  }
});

test('upload, validation, missing configuration and catalog save remain distinct',async({page})=>{
  await mockApi(page);
  await page.setViewportSize({width:390,height:900});
  await page.goto('/admin/giving');
  await page.getByRole('button',{name:'Edit Mangla Seva'}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('input[type=file]').last().setInputFiles({name:'seva.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,0,0,0,0,0,0,0,0,73,69,78,68,0,0,0,0])});
  await expect(page.getByText('Image uploaded. Save the record to apply it.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Save Opportunity'})).toBeEnabled();
  await page.getByRole('button',{name:'Save Opportunity'}).click();
  await expect(page.getByText('Mangla Seva updated.')).toBeVisible();

  await page.goto('/admin/events');
  await page.getByRole('button',{name:'Edit Temple Gathering'}).click();
  await page.locator('input[type=file]').last().setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg><script/></svg>')});
  await expect(page.getByText('Choose a JPG, JPEG, PNG, or WebP image.')).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('input[type=file]').last().setInputFiles({name:'event.webp',mimeType:'image/webp',buffer:Buffer.alloc(32)});
  await expect(page.getByText('Image uploads are not configured')).toBeVisible();
  await expect(page.getByLabel('Title *',{exact:true})).toHaveValue('Temple Gathering');
});

test('public catalog images fall back safely on listing, detail and featured event views',async({page})=>{
  await mockApi(page);
  await page.goto('/giving');
  await expect(page.locator('.giving-opportunity-card img')).toHaveAttribute('src','/images/diya.webp');
  await page.goto('/giving/mangla-seva');
  await expect(page.locator('.giving-detail-image')).toHaveAttribute('src','/images/diya.webp');
  await page.goto('/events');
  await expect(page.locator('.events-list-card img')).toHaveAttribute('src','/images/devotional-hero.webp');
  await page.goto('/events/temple-gathering');
  await expect(page.locator('.event-detail-photo')).toHaveAttribute('src','/images/devotional-hero.webp');
  await page.goto('/');
  await expect(page.locator('.event-card img')).toHaveAttribute('src','/images/devotional-hero.webp');
});

test('JPG, JPEG, PNG and WebP select, preview and save their optimized URL for Giving and Events', async ({page}) => {
  test.setTimeout(60_000);
  await mockApi(page);
  let uploads = 0;
  let releaseUpload: () => void = () => {};
  const optimized = 'https://images.example.test/catalog/giving/00000000-0000-4000-8000-000000000003.webp';
  await page.route('**/api/v1/admin/uploads/*', async route => {
    uploads++;
    await new Promise<void>(resolve => {releaseUpload = resolve;});
    return respond(route, 201, {url: optimized, key: 'giving/00000000-0000-4000-8000-000000000003.webp', contentType: 'image/webp', size: 100});
  });
  for (const width of [390, 1280]) {
    await page.setViewportSize({width, height: 900});
    for (const kind of ['giving', 'events']) {
      for (const [extension, mimeType] of [['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['webp', 'image/webp']]) {
        await page.goto(`/admin/${kind}`);
        await page.getByRole('button', {name: kind === 'giving' ? 'Edit Mangla Seva' : 'Edit Temple Gathering'}).click();
        const input = page.locator('input[type=file]').last();
        await expect(input).toHaveAttribute('accept', /\.jpg,\.jpeg,\.png,\.webp/);
        const expectedUploads = uploads + 1;
        page.once('dialog', dialog => dialog.accept());
        // Network is mocked: backend format/signature decoding is tested separately.
        await input.setInputFiles({name: `fixture.${extension}`, mimeType, buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')});
        const save = page.getByRole('button', {name: kind === 'giving' ? 'Save Opportunity' : 'Save Event'});
        await expect(page.getByRole('button', {name: 'Uploading image…', exact: true})).toBeDisabled();
        await expect(page.locator('.adm-image-preview')).toHaveAttribute('src', /^blob:/);
        await expect.poll(() => uploads).toBe(expectedUploads);
        releaseUpload();
        await expect(page.getByText('Image uploaded. Save the record to apply it.')).toBeVisible();
        await expect(save).toBeEnabled();
        await noOverflow(page);
        const saved = page.waitForRequest(req => req.method() === 'PUT' && req.url().includes(`/admin/${kind}/`));
        await save.click();
        expect((await saved).postDataJSON().image).toBe(optimized);
      }
    }
  }
  expect(uploads).toBe(16);
});

test('files above 15 MiB stay local and corrupt-image responses are clear', async ({page}) => {
  await mockApi(page);
  let uploads = 0;
  await page.route('**/api/v1/admin/uploads/giving**', route => {
    uploads++;
    return respond(route, 415, undefined, {code: 'INVALID_IMAGE', message: 'Upload a valid JPEG, PNG, or WebP image'});
  });
  await page.goto('/admin/giving');
  await page.getByRole('button', {name: 'Edit Mangla Seva'}).click();
  await page.locator('input[type=file]').last().setInputFiles({name: 'large.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(15 * 1024 * 1024 + 1)});
  await expect(page.getByText('The image is too large. Choose a file no larger than 15 MiB.')).toBeVisible();
  expect(uploads).toBe(0);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('input[type=file]').last().setInputFiles({name: 'corrupt.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('corrupt')});
  await expect(page.getByText('This file could not be read as a valid JPG, JPEG, PNG, or WebP image. Please export it again and retry.')).toBeVisible();
  expect(uploads).toBe(1);
});

test('Giving and Events allow original files below and exactly 15 MiB', async ({page}) => {
  await mockApi(page);
  let uploads = 0;
  await page.route('**/api/v1/admin/uploads/*', route => {
    uploads++;
    return respond(route, 201, {url: image, key: 'events/00000000-0000-4000-8000-000000000001.webp', contentType: 'image/webp', size: 100});
  });
  for (const kind of ['giving', 'events']) {
    for (const size of [15 * 1024 * 1024 - 1, 15 * 1024 * 1024]) {
      await page.goto(`/admin/${kind}`);
      await page.getByRole('button', {name: kind === 'giving' ? 'Edit Mangla Seva' : 'Edit Temple Gathering'}).click();
      page.once('dialog', dialog => dialog.accept());
      // Only frontend byte validation is under test; transport/storage are mocked.
      await page.locator('input[type=file]').last().setInputFiles({name: 'boundary.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(size)});
      await expect(page.getByText('Image uploaded. Save the record to apply it.')).toBeVisible();
    }
  }
  expect(uploads).toBe(4);
});

test('decoder and storage failures are distinct from local preview failures', async ({page}) => {
  await mockApi(page);
  let nextCode = 'IMAGE_DECODE_FAILED';
  let calls = 0;
  await page.route('**/api/v1/admin/uploads/giving**', route => {
    calls++;
    return respond(route, nextCode === 'IMAGE_DECODE_FAILED' ? 415 : 502, undefined, {code: nextCode, message: 'Sanitized server error'});
  });
  await page.goto('/admin/giving');
  await page.getByRole('button', {name: 'Edit Mangla Seva'}).click();
  for (const code of ['IMAGE_DECODE_FAILED', 'IMAGE_UPLOAD_FAILED']) {
    nextCode = code;
    page.once('dialog', dialog => dialog.accept());
    await page.locator('input[type=file]').last().setInputFiles({name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('preview-cannot-decode-this')});
    await expect(page.getByText(code === 'IMAGE_DECODE_FAILED'
      ? 'This image could not be decoded. It may be damaged or use an unsupported encoding. Please export it again as JPG, PNG, or WebP.'
      : 'The image could not be uploaded. Please check your connection and try again. Your form values are unchanged.')).toBeVisible();
    await expect(page.getByLabel('Title *', {exact: true})).toHaveValue('Mangla Seva');
  }
  expect(calls).toBe(2);
});
