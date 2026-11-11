import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
const product = { id: 1, slug: 'audit-ring', name: 'Audit Ring', category: 'Rings', base_price: 150, discount_percent: 0, stock_quantity: 10, images: [{ image_url: '/assets/products/enamel-coin-necklace/01-main.png' }], purchase_variant: { id: 1, price: 150, stock_quantity: 10 } };
const cart = [{ slug: 'audit-ring', name: 'Audit Ring', variantId: 1, quantity: 2 }];

async function mockApi(page, options = {}) {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const item = options.product || product;
    let data = {};
    if (path === '/api/products' && options.unavailable) return route.fulfill({ status: 503, json: { error: { message: 'Temporarily unavailable' } }, headers: { 'access-control-allow-origin': '*' } });
    if (path === '/api/products') data = { products: [item] };
    else if (path === '/api/products/audit-ring') data = { product: options.liveProduct || item };
    else if (path === '/api/products/inventory') data = { products: [item] };
    else if (path === '/api/products/categories') data = { categories: [] };
    else if (path.startsWith('/api/content/')) data = { content: {} };
    else if (path === '/api/promotions/validate') {
      const body = route.request().postDataJSON();
      options.validations?.push(body);
      if (options.promotion) data = await options.promotion(body);
      else data = body.code === 'SAVE10' && body.subtotal >= 200 && body.phone !== '0199999999'
        ? { valid: true, promotion: { name: 'Minimum RM200 offer', discount_value: 10, free_shipping: true }, discountTotal: body.subtotal * .1 }
        : { valid: false, reason: body.phone === '0199999999' ? 'FIRST_ORDER_ONLY' : 'MINIMUM_SPEND', minimumSpend: 200, shortfall: 200 - body.subtotal };
    } else if (path === '/api/orders') {
      options.orders?.push(route.request().postDataJSON());
      await options.beforeOrder?.();
      data = { order: { id: 42, orderNumber: 'CHR-TEST', items: [{ variantId: 1, name: 'Audit Ring', price: 'RM 150.00', quantity: 2 }], subtotal: 300, discount: 0, shipping: 0, total: 300, status: 'pending_payment' } };
    }
    return route.fulfill({ json: { data }, headers: { 'access-control-allow-origin': '*' } });
  });
}

async function openCart(page, options = {}) {
  await mockApi(page, options);
  await page.addInitScript(items => localStorage.setItem('chrisea-cart', JSON.stringify(items)), cart);
  await page.goto('/cart');
  await expect(page.locator('.cart-quantity > span')).toHaveText('2');
}

async function applyPromotion(page) {
  await page.getByLabel('Phone', { exact: true }).fill('0123456789');
  await page.locator('#promo').fill('SAVE10');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.locator('.cart-summary-total')).toContainText('270.00');
  await page.getByRole('button', { name: 'Continue checkout', exact: true }).click();
}

test('revalidates a manual promotion when quantity drops below its minimum', async ({ page }) => {
  const validations = [];
  await openCart(page, { validations });
  await applyPromotion(page);
  await page.getByRole('button', { name: 'Decrease Audit Ring quantity' }).click();
  await expect(page.locator('.cart-summary-total')).toContainText('165.00');
  await expect(page.locator('.cart-promo')).toContainText('minimum RM 200.00');
  await expect(page.locator('.cart-summary-row').filter({ hasText: 'Discount' })).toHaveCount(0);
  expect(validations.some(request => request.code === 'SAVE10' && request.subtotal === 150)).toBe(true);
});

test('changed contact details and an edited code cannot retain an old discount', async ({ page }) => {
  const orders = [];
  await openCart(page, { orders });
  await applyPromotion(page);
  await page.getByLabel('Phone', { exact: true }).fill('0199999999');
  await expect(page.locator('.cart-summary-total')).toContainText('300.00');
  await expect(page.locator('.cart-promo')).toContainText('first-time buyers');
  await page.getByLabel('Phone', { exact: true }).fill('0123456789');
  await expect(page.locator('.cart-summary-total')).toContainText('270.00');
  await page.locator('#promo').fill('UNAPPLIED');
  await expect(page.locator('.cart-summary-total')).toContainText('300.00');
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await expect(page.locator('.cart-checkout-error')).toContainText('apply a valid promo code or clear it');
  expect(orders).toEqual([]);
});

test('an old promotion response cannot restore a discount after the code changes', async ({ page }) => {
  let release, started;
  const responseReady = new Promise(resolve => { release = resolve; });
  const requestStarted = new Promise(resolve => { started = resolve; });
  await openCart(page, { promotion: async body => {
    if (!body.code) return { valid: false };
    started();
    await responseReady;
    return { valid: true, promotion: { name: 'Offer', discount_value: 10, free_shipping: true }, discountTotal: 30 };
  } });
  await page.getByLabel('Phone', { exact: true }).fill('0123456789');
  await page.locator('#promo').fill('SAVE10');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await requestStarted;
  await page.locator('#promo').fill('CHANGED');
  release();
  await expect(page.locator('.cart-summary-total')).toContainText('300.00');
  await expect(page.locator('.promo-success-modal')).toHaveCount(0);
});

for (const path of ['/', '/shop', '/product/audit-ring', '/cart']) {
  test(`product API failure shows an error and preserves saved cart at ${path}`, async ({ page }) => {
    const options = { unavailable: true };
    await mockApi(page, options);
    await page.addInitScript(items => {
      if (!localStorage.getItem('chrisea-cart')) localStorage.setItem('chrisea-cart', JSON.stringify(items));
    }, cart);
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'The collection is temporarily unavailable.' })).toBeVisible();
    await expect(page.locator('.shop-card, .product-card')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('chrisea-cart'))[0].quantity)).toBe(2);
    options.unavailable = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'The collection is temporarily unavailable.' })).toHaveCount(0);
    await expect(page.locator('main')).toContainText('Audit Ring');
  });
}

for (const status of ['pending_payment', 'pending_verification']) {
  test(`downloadable receipt matches ${status} and includes its discount`, async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(status => {
      sessionStorage.setItem('chrisea-latest-receipt', JSON.stringify({ id: 'CHR-AUDIT', orderId: 1, placedAt: new Date().toISOString(), items: [], subtotal: 300, discount: .1, shipping: 0, total: 270, status, reviewExpiresAt: new Date(Date.now() + 3600000).toISOString() }));
      window.auditCanvasText = [];
      const drawText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) { window.auditCanvasText.push(text); return drawText.call(this, text, ...rest); };
    }, status);
    await page.goto('/receipt');
    const label = status === 'pending_verification' ? 'Awaiting verification' : 'Pending payment';
    await expect(page.locator('.receipt-meta')).toContainText(label);
    await expect.poll(() => page.evaluate(() => window.auditCanvasText)).toContain(label);
    const imageText = await page.evaluate(() => window.auditCanvasText);
    expect(imageText).toContain('Discount');
    expect(imageText).toContain('− RM 30.00');
    expect(imageText).toContain('RM 270.00');
    if (status === 'pending_verification') expect(imageText).not.toContain('Pending payment');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download receipt' }).click();
    const downloaded = await download;
    expect(downloaded.suggestedFilename()).toBe('CHRISEA-CHR-AUDIT.png');
    await downloaded.saveAs(test.info().outputPath('receipt.png'));
  });
}

test('shows purchasable-variant stock and adds the available variant', async ({ page }) => {
  const available = { ...product, purchase_variant: { id: 2, price: 150, stock_quantity: 3 }, variants: [{ id: 1, stock_quantity: 0 }, { id: 2, stock_quantity: 3 }, { id: 3, stock_quantity: 7 }] };
  await mockApi(page, { product: available });
  await page.goto('/product/audit-ring');
  await expect(page.locator('.product-stock-status')).toContainText('only 3 left');
  await page.locator('.product-add').click();
  await expect(page.locator('.bag-button b')).toHaveText('1');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('chrisea-cart')));
  expect(saved[0].variantId).toBe(2);
  await page.goto('/cart');
  await expect(page.locator('.cart-item-info')).toContainText('3 in stock');
});

test('a saved variant remains purchasable when the default variant changes', async ({ page }) => {
  const variants = [{ id: 1, price: 150, stock_quantity: 4 }, { id: 2, price: 150, stock_quantity: 6 }];
  await openCart(page, { product: { ...product, variants }, liveProduct: { ...product, variants, purchase_variant: variants[1] } });
  await page.getByRole('button', { name: 'Increase Audit Ring quantity' }).click();
  await expect(page.locator('.cart-quantity > span')).toHaveText('3');
  await expect(page.locator('.cart-checkout-error')).toHaveCount(0);
});

test('choosing a product option uses its own stock, price and cart identity', async ({ page }) => {
  const variants = [{ id: 1, variant_name: 'Gold', price: 150, stock_quantity: 0 }, { id: 2, variant_name: 'Silver', price: 150, stock_quantity: 3 }, { id: 3, variant_name: 'Rose Gold', price: 160, stock_quantity: 7 }];
  await mockApi(page, { product: { ...product, variants, purchase_variant: variants[1] } });
  await page.goto('/product/audit-ring');
  await expect(page.getByRole('button', { name: 'Gold Sold out', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Rose Gold 7 available', exact: true }).click();
  await expect(page.locator('.product-price')).toContainText('160.00');
  await expect(page.locator('.product-stock-status')).toContainText('7 available');
  await page.locator('.product-add').click();
  await expect(page.locator('.bag-button b')).toHaveText('1');
  await page.goto('/cart');
  await expect(page.locator('.cart-item-info')).toContainText('Rose Gold');
  await expect(page.locator('.cart-item > strong')).toHaveText('RM 160.00');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('chrisea-cart'))[0].variantId)).toBe(3);
});

for (const withoutLocks of [false, true]) {
  test(`cart and badge synchronize across tabs${withoutLocks ? ' without Web Locks' : ''}`, async ({ page, context }) => {
    if (withoutLocks) await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined }));
    await openCart(page);
    const second = await context.newPage();
    await mockApi(second);
    await second.goto('/cart');
    await expect(second.locator('.cart-quantity > span')).toHaveText('2');
    await second.getByRole('button', { name: 'Increase Audit Ring quantity' }).click();
    await expect(page.locator('.cart-quantity > span')).toHaveText('3');
    await expect(page.locator('.bag-button b')).toHaveText('3');
    await page.getByRole('button', { name: 'Decrease Audit Ring quantity' }).click();
    await expect(second.locator('.cart-quantity > span')).toHaveText('2');
    await expect(second.locator('.bag-button b')).toHaveText('2');
    await second.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByText('Your bag is waiting')).toBeVisible();
    await expect(page.locator('.bag-button b')).toHaveText('0');
  });
}

test('simultaneous tab additions preserve both quantity changes', async ({ page, context }) => {
  await openCart(page);
  const second = await context.newPage();
  await mockApi(second);
  await second.goto('/cart');
  await expect(second.locator('.cart-quantity > span')).toHaveText('2');
  await Promise.all([
    page.getByRole('button', { name: 'Increase Audit Ring quantity' }).click(),
    second.getByRole('button', { name: 'Increase Audit Ring quantity' }).click(),
  ]);
  await expect(page.locator('.cart-quantity > span')).toHaveText('4');
  await expect(second.locator('.cart-quantity > span')).toHaveText('4');
});

test('checkout removes purchased quantities without deleting another tab addition', async ({ page, context }) => {
  let completeOrder, started;
  const gate = new Promise(resolve => { completeOrder = resolve; });
  const received = new Promise(resolve => { started = resolve; });
  const orders = [];
  await openCart(page, { orders, beforeOrder: () => { started(); return gate; } });
  for (const [label, value] of [['Full name', 'Test Customer'], ['Phone', '0123456789'], ['Address', '123 Test Street'], ['City', 'Kuala Lumpur'], ['State', 'KL'], ['Postcode', '50000']]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await expect(page.getByRole('button', { name: 'Place order', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await received;
  const second = await context.newPage();
  await mockApi(second);
  await second.goto('/cart');
  await expect(second.locator('.cart-quantity > span')).toHaveText('2');
  await second.getByRole('button', { name: 'Increase Audit Ring quantity' }).click();
  await expect(second.locator('.cart-quantity > span')).toHaveText('3');
  completeOrder();
  await expect(page.locator('.qr-payment-modal')).toBeVisible();
  await expect(second.locator('.cart-quantity > span')).toHaveText('1');
  expect(orders[0].items).toEqual([{ variantId: 1, quantity: 2 }]);
  const receipt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('chrisea-latest-receipt')));
  expect(receipt.total).toBe(300);
  expect(receipt.items[0].quantity).toBe(2);
});
