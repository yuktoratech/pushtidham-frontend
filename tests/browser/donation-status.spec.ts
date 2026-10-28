import {test, expect, type Page} from '@playwright/test';

const statuses = ['completed', 'pending', 'processing', 'failed', 'canceled', 'rejected'];
async function fixtures(page: Page, admin: boolean) {
  const user = {id: 'fixture-user', name: 'Fixture User', email: 'fixture@example.test', role: admin ? 'admin' : 'donor', status: 'active'};
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname;
    let data: unknown = [];
    if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204});
    if (path.endsWith('/auth/refresh')) data = {accessToken: 'fixture-token', user};
    else if (path.endsWith('/auth/me')) data = user;
    else if (path.endsWith('/donations')) data = statuses.filter(status => !url.searchParams.get('status') || status === url.searchParams.get('status')).map((status, index) => ({id: status, donationNumber: `FIXTURE-${status}`, type: 'general', designationTitle: 'Fixture Giving', baseDonationCents: 100, grossChargedCents: 100, currency: 'USD', donationStatus: status === 'completed' ? 'completed' : status === 'rejected' ? 'rejected' : 'pending', displayStatus: status, paymentLifecycle: status === 'pending' ? 'requires_action' : status === 'completed' ? 'succeeded' : status, paymentMethod: status === 'rejected' ? 'offline' : 'card', recordKind: status === 'completed' ? 'verified_online' : status === 'rejected' ? 'offline' : 'online', providerVerified: status === 'completed', receiptEligible: status === 'completed', paymentProvider: 'stripe', createdAt: `2026-10-${28 - index}T17:00:00Z`, donor: {name: 'Fixture Donor', email: 'fixture@example.test'}}));
    return route.fulfill({json: {success: true, data}});
  });
}

test('admin uses simple status badges and can filter failed donations', async ({page}) => {
  await fixtures(page, true);
  await page.goto('/admin/donations');
  await expect(page.locator('.adm-donations-table .adm-badge')).toHaveText(['Completed', 'Pending', 'Processing', 'Failed', 'Canceled', 'Rejected']);
  await expect(page.getByText('Verified online', {exact: true})).toHaveCount(0);
  await expect(page.getByText('Requires action', {exact: true})).toHaveCount(0);
  await page.locator('.adm-filters select').first().selectOption('failed');
  await expect(page.locator('.adm-donations-table .adm-badge')).toHaveText(['Failed']);
});

test('donor history uses the same statuses and only eligible completed receipts', async ({page}) => {
  await fixtures(page, false);
  await page.goto('/account/donations');
  const table = page.locator('.account-donation-table');
  await expect(table.locator('.account-status')).toHaveText(['Completed', 'Pending', 'Processing', 'Failed', 'Canceled', 'Rejected']);
  await expect(table.getByRole('button', {name: 'Download receipt'})).toHaveCount(1);
  await expect(table.getByText('Requires action', {exact: true})).toHaveCount(0);
});
