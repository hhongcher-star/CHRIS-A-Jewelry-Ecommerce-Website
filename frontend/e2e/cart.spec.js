import { expect, test } from '@playwright/test';

test('malformed persisted cart cannot crash the cart page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('chrisea-cart', '{bad json'));
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible();
  await expect(page.getByText('Your bag is waiting')).toBeVisible();
});

test('non-array persisted cart is discarded', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('chrisea-cart', JSON.stringify({ slug: 'ring', quantity: 999 })));
  await page.goto('/cart');
  await expect(page.getByText('Your bag is waiting')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('chrisea-cart')))).toEqual([]);
});
