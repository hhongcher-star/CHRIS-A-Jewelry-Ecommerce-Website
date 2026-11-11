import { expect, test } from '@playwright/test';
test.use({ reducedMotion: 'reduce' });

test('receipt refreshes payment status using its private token', async ({ page }) => {
  const requests = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/orders/42/status') {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { data: { status: 'payment_confirmed' } }, headers: { 'access-control-allow-origin': '*' } });
    }
    return route.fulfill({ json: { data: { products: [], categories: [], content: {} } }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.addInitScript(() => sessionStorage.setItem('chrisea-latest-receipt', JSON.stringify({ id: 'CHR-TEST', orderId: 42, paymentNoticeToken: 'a'.repeat(64), placedAt: new Date().toISOString(), items: [], subtotal: 100, discount: 0, shipping: 15, total: 115, status: 'pending_verification', paymentInformation: 'Transfer by QR', reviewExpiresAt: new Date(Date.now() + 3600000).toISOString() })));
  await page.goto('/receipt');
  await expect(page.locator('.receipt-meta')).toContainText('Payment confirmed');
  await expect(page.locator('.receipt-payment')).toContainText('Payment confirmed');
  await expect(page.locator('.receipt-payment')).not.toContainText('Complete your payment');
  expect(requests[0]).toEqual({ paymentNoticeToken: 'a'.repeat(64) });
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('chrisea-latest-receipt')).status)).toBe('payment_confirmed');
});

test('expired payment review tells the customer their payment notice was received', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ json: { data: { products: [], categories: [], content: {} } }, headers: { 'access-control-allow-origin': '*' } }));
  await page.addInitScript(() => sessionStorage.setItem('chrisea-latest-receipt', JSON.stringify({ id: 'CHR-TEST', placedAt: new Date().toISOString(), items: [], subtotal: 100, discount: 0, shipping: 15, total: 115, status: 'pending_verification', paymentInformation: 'Transfer by QR', reviewExpiresAt: new Date(Date.now() - 1000).toISOString() })));
  await page.goto('/receipt');
  await expect(page.locator('.receipt-payment')).toContainText('Your payment notice was received');
  await expect(page.locator('.receipt-payment')).not.toContainText('before making a transfer');
});

test('catalogue refreshes prices and stock while the page remains open', async ({ page }) => {
  await page.clock.install();
  let price = 100, stock = 5, requests = 0;
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    let data = { content: {}, categories: [], products: [] };
    if (path === '/api/products') {
      requests++;
      data = { products: [{ id: 1, slug: 'test-ring', name: 'Test Ring', category: 'Rings', base_price: price, stock_quantity: stock, purchase_variant: { id: 1, price, stock_quantity: stock }, images: [] }] };
    }
    return route.fulfill({ json: { data }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/shop');
  await expect(page.locator('.shop-card-actions strong')).toHaveText('RM 100.00');
  price = 125; stock = 2;
  await page.clock.fastForward(31_000);
  await expect(page.locator('.shop-card-actions strong')).toHaveText('RM 125.00');
  await expect(page.locator('.shop-card-actions small')).toContainText('2 left');
  expect(requests).toBeGreaterThanOrEqual(2);
});
