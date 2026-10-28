import {expect, test, type Page} from '@playwright/test';

const user = {id: 'fixture-donor', name: 'Account Donor', email: 'fixture@example.test', phone: '', role: 'donor', status: 'active'};
const rows = [
  {id: 'offline', designationTitle: 'Archived Seva', baseDonationCents: 1001, donationStatus: 'completed', displayStatus: 'completed', recordKind: 'offline', providerVerified: false, paymentMethod: 'offline', createdAt: '2026-10-28T17:00:00Z'},
  {id: 'online', designationTitle: 'Online Seva', baseDonationCents: 2500, donationStatus: 'completed', displayStatus: 'succeeded', recordKind: 'verified_online', providerVerified: true, paymentMethod: 'card', createdAt: '2026-10-27T17:00:00Z'},
  {id: 'pending', designationTitle: 'Pending Seva', baseDonationCents: 5000, donationStatus: 'pending', displayStatus: 'pending', recordKind: 'offline', providerVerified: false, paymentMethod: 'offline', createdAt: '2026-10-26T17:00:00Z'},
  {id: 'rejected', designationTitle: 'Rejected Seva', baseDonationCents: 500, donationStatus: 'rejected', displayStatus: 'failed', recordKind: 'offline', providerVerified: false, paymentMethod: 'offline', createdAt: '2026-10-25T17:00:00Z'},
].map(row => ({...row, donationNumber: `FIXTURE-${row.id}`, currency: 'USD', paymentProvider: null}));

async function mock(page: Page, options: {empty?: boolean; fail?: () => boolean; expired?: boolean; paused?: Promise<void>} = {}) {
  let donations = 0;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204});
    if (path.endsWith('/auth/refresh')) {
      await options.paused;
      if (options.expired) return route.fulfill({status: 401, json: {success: false, error: {code: 'UNAUTHENTICATED', message: 'Authentication required'}}});
      data = {accessToken: 'fixture-access', user};
    } else if (path.endsWith('/auth/me')) data = user;
    else if (path.endsWith('/donations')) {
      donations++;
      expect(route.request().headers().authorization).toBe('Bearer fixture-access');
      if (options.fail?.()) return route.fulfill({status: 503, json: {success: false, error: {code: 'UNAVAILABLE', message: 'Donations are temporarily unavailable.'}}});
      data = options.empty ? [] : rows;
    }
    return route.fulfill({json: {success: true, data}});
  });
  return () => donations;
}

test('overview waits for auth, shows linked online/offline totals, and survives reload', async ({page}) => {
  let release!: () => void;
  const paused = new Promise<void>(resolve => { release = resolve; });
  const requests = await mock(page, {paused});
  await page.goto('/account');
  await expect(page.getByText('Checking your session…')).toBeVisible();
  expect(requests()).toBe(0);
  release();
  const cards = page.locator('.account-summary-card');
  await expect(cards.nth(0).locator('strong')).toHaveText('$35.01');
  await expect(cards.nth(1).locator('strong')).toHaveText('4');
  await expect(cards.nth(2)).toContainText('$10.01');
  await expect(cards.nth(2)).toContainText('Archived Seva');
  await expect(cards.nth(2)).toContainText('Oct 28, 2026');
  await page.reload();
  await expect(cards.nth(0).locator('strong')).toHaveText('$35.01');
  await page.goto('/account/donations');
  await expect(page.locator('.account-donation-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.account-donation-table tbody tr').nth(0)).toContainText('Download receipt');
  await expect(page.locator('.account-donation-table tbody tr').nth(2)).toContainText('Receipt available after verification');
});

test('empty account has zero totals and an explicit empty state', async ({page}) => {
  await mock(page, {empty: true});
  await page.goto('/account');
  await expect(page.locator('.account-summary-card').nth(0)).toContainText('$0.00');
  await expect(page.locator('.account-summary-card').nth(1).locator('strong')).toHaveText('0');
  await expect(page.locator('.account-summary-card').nth(2)).toContainText('No donations yet.');
  await expect(page.getByText('Unavailable', {exact: true})).toHaveCount(0);
});

test('API failure is retryable and cannot leave cards stuck unavailable', async ({page}) => {
  let failing = true;
  await mock(page, {fail: () => failing});
  await page.goto('/account');
  await expect(page.locator('.account-demo-notice[role="alert"]')).toContainText('Donations are temporarily unavailable.');
  failing = false;
  await page.getByRole('button', {name: 'Retry donation summary'}).click();
  await expect(page.locator('.account-summary-card').nth(0)).toContainText('$35.01');
  await expect(page.locator('.account-demo-notice[role="alert"]')).toHaveCount(0);
});

test('expired session follows login flow without requesting donor records', async ({page}) => {
  const requests = await mock(page, {expired: true});
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  expect(requests()).toBe(0);
});
