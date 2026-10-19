import {test, expect} from '@playwright/test';

for (const path of ['/login', '/admin/login']) {
  test(`${path} clears a stale refresh limit error on the next login attempt`, async ({page}) => {
    let attempts = 0;
    await page.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/auth/refresh')) return route.fulfill({status: 429, contentType: 'application/json', body: JSON.stringify({success: false, error: {code: 'RATE_LIMITED', message: 'Too many authentication requests'}})});
      if (url.pathname.endsWith('/auth/login')) {
        attempts++;
        return route.fulfill({status: 401, contentType: 'application/json', body: JSON.stringify({success: false, error: {code: 'INVALID_CREDENTIALS', message: 'Invalid email or password'}})});
      }
      return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({success: true, data: []})});
    });
    await page.goto(path);
    await page.getByLabel('Email Address').fill('login-check@example.test');
    await page.getByLabel('Password', {exact: true}).fill('synthetic-invalid-password');
    const submit = page.getByRole('button', {name: 'Login', exact: true});
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByText('Incorrect email or password, or this account is disabled. Please try again or contact the temple.', {exact: true})).toBeVisible();
    await expect(page.getByText('Too many attempts. Please wait before trying again.', {exact: true})).toHaveCount(0);
    expect(attempts).toBe(1);
  });
}
