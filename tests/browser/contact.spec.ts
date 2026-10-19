import {expect, test, type Page} from '@playwright/test';

async function fillContact(page: Page) {
  await page.getByLabel('Full Name').fill('Test Visitor');
  await page.getByLabel('Email Address').fill('visitor@example.test');
  await page.getByLabel('Phone Number').fill('+1 352 555 0100');
  await page.getByLabel('Subject').fill('Temple visit');
  await page.locator('#contact-message').fill('Please share general visiting information.');
}

test('validates required fields without making a request', async ({page}) => {
  let requests = 0;
  await page.route('**/api/v1/contact', route => { requests++; return route.abort(); });
  await page.goto('/contact');
  await page.getByRole('button', {name: 'Send Message'}).click();
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await expect(page.getByText('Please enter your email address.')).toBeVisible();
  await expect(page.getByText('Please enter a subject.')).toBeVisible();
  await expect(page.getByText('Please enter your message.')).toBeVisible();
  expect(requests).toBe(0);
});

test('submits once, shows loading, then clears only after success', async ({page}) => {
  let requests = 0;
  let accept!: () => void;
  const accepted = new Promise<void>(resolve => { accept = resolve; });
  await page.route('**/api/v1/contact', async route => {
    requests++;
    await accepted;
    await route.fulfill({status: 202, contentType: 'application/json', body: JSON.stringify({success: true, data: null})});
  });
  await page.goto('/contact');
  await fillContact(page);
  const submit = page.getByRole('button', {name: 'Send Message'});
  await submit.click();
  await expect(page.getByRole('button', {name: 'Sending...'})).toBeDisabled();
  await expect(page.locator('#contact-message')).toHaveValue('Please share general visiting information.');
  await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit());
  await page.waitForTimeout(50);
  expect(requests).toBe(1);
  accept();
  await expect(page.getByText('Thank you! Your message has been sent successfully.')).toBeVisible();
  await expect(page.getByLabel('Full Name')).toHaveValue('');
  await expect(page.locator('#contact-message')).toHaveValue('');
  await expect(page.getByText('Review Your Message')).toHaveCount(0);
  await expect(page.getByText('Open in Email App')).toHaveCount(0);
});

test('preserves values after a sanitized delivery failure and allows retry', async ({page}) => {
  let requests = 0;
  await page.route('**/api/v1/contact', async route => {
    requests++;
    if (requests === 1) return route.fulfill({status: 503, contentType: 'application/json', body: JSON.stringify({success: false, error: {code: 'MAIL_UNAVAILABLE', message: 'internal provider detail'}})});
    return route.fulfill({status: 202, contentType: 'application/json', body: JSON.stringify({success: true, data: null})});
  });
  await page.goto('/contact');
  await fillContact(page);
  await page.getByRole('button', {name: 'Send Message'}).click();
  const deliveryAlert = page.locator('.contact-submit-error');
  await expect(deliveryAlert).toContainText('We could not send your message right now.');
  await expect(deliveryAlert).not.toContainText('internal provider detail');
  await expect(page.getByLabel('Email Address')).toHaveValue('visitor@example.test');
  await expect(page.getByRole('button', {name: 'Send Message'})).toBeEnabled();
  await page.getByRole('button', {name: 'Send Message'}).click();
  await expect(page.getByText('Thank you! Your message has been sent successfully.')).toBeVisible();
  expect(requests).toBe(2);
});

test('contact form and directions action remain usable at desktop and mobile widths', async ({page}) => {
  for (const width of [320, 375, 390, 430, 1280]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/contact');
    await expect(page.getByRole('button', {name: 'Send Message'})).toBeVisible();
    await expect(page.locator('.contact-directions-button')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
