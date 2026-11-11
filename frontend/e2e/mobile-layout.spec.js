import { expect, test, devices } from '@playwright/test';

test.use({
  isMobile: true,
  hasTouch: true,
  userAgent: devices['Pixel 7'].userAgent,
  reducedMotion: 'reduce',
});

const products = [
  { id: 1, slug: 'vintage-heart-necklace', name: 'Vintage Zircon Heart Pendant Necklace', category: 'Necklaces', short_description: 'S925 Sterling Silver · Vintage Zircon Heart', base_price: 155, discount_percent: 20 },
  { id: 2, slug: 'pearl-bracelet', name: 'Minimalist Natural Pearl Bracelet', category: 'Bracelets', short_description: 'S925 Sterling Silver · Natural Freshwater Pearl', base_price: 110 },
].map(product => ({ ...product, stock_quantity: 8, images: [{ image_url: '/assets/products/enamel-coin-necklace/01-main.png' }], purchase_variant: { id: product.id, price: product.base_price, stock_quantity: 8 } }));

test.beforeEach(async ({ page }) => {
  // A failed web-font request must still leave the fallback font readable.
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    let data = {};
    if (path === '/api/products') data = { products };
    else if (path === '/api/products/inventory') data = { products };
    else if (path === '/api/products/categories') data = { categories: [] };
    else if (path.startsWith('/api/content/')) data = { content: {} };
    else if (path === '/api/reviews') data = { reviews: [] };
    return route.fulfill({ json: { data }, headers: { 'access-control-allow-origin': '*' } });
  });
});

async function enlargeText(page, selector) {
  // Stress text resizing separately from page zoom. Capture all original sizes
  // first so nested elements are doubled once, without compounding inheritance.
  await page.locator(selector).evaluateAll(elements => {
    const sizes = elements.map(el => parseFloat(getComputedStyle(el).fontSize));
    elements.forEach((el, index) => el.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'));
  });
}

async function expectOrderedChildren(locator) {
  const failures = await locator.evaluateAll(elements => elements.flatMap(el => {
    const children = [...el.children].filter(child => getComputedStyle(child).display !== 'none');
    return children.flatMap((child, index) => {
      const box = child.getBoundingClientRect();
      const next = children[index + 1]?.getBoundingClientRect();
      return next && box.bottom > next.top + 1 ? [`${child.tagName}: ${child.textContent}`] : [];
    });
  }));
  expect(failures, 'adjacent text blocks must not overlap').toEqual([]);
}

for (const width of [320, 360, 393, 412, 600, 720, 740, 760, 800, 1440]) {
  test(`home title stays inside the viewport at ${width}px without web fonts`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/?cmsPreview=1');
    await expect(page.locator('.hero-content h1')).toBeVisible();
    await documentFontsReady(page);
    const bounds = await page.locator('.hero-content, .hero-content h1, .hero-cta').evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    }));
    for (const box of bounds) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    if (width <= 760) {
      await enlargeText(page, '.hero-kicker, .hero-content h1, .hero-description, .hero-cta');
      const fits = await page.locator('.hero-content').evaluate(el => {
        const content = el.getBoundingClientRect(), hero = el.closest('section').getBoundingClientRect();
        return { left: content.left, right: content.right, top: content.top, bottom: content.bottom, heroTop: hero.top, heroBottom: hero.bottom, width: el.clientWidth, scrollWidth: el.scrollWidth };
      });
      expect(fits.left, JSON.stringify(fits)).toBeGreaterThanOrEqual(-1);
      expect(fits.right, JSON.stringify(fits)).toBeLessThanOrEqual(width + 1);
      expect(fits.top, JSON.stringify(fits)).toBeGreaterThanOrEqual(fits.heroTop - 1);
      expect(fits.bottom, JSON.stringify(fits)).toBeLessThanOrEqual(fits.heroBottom + 1);
      expect(fits.scrollWidth, JSON.stringify(fits)).toBeLessThanOrEqual(fits.width + 1);
    }
  });
}

async function documentFontsReady(page) {
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [320, 360, 393, 412, 600, 740]) {
  test(`catalogue text can grow at ${width}px without overlapping prices or buttons`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/shop');
    await expect(page.locator('.shop-card')).toHaveCount(products.length);
    // Remove offscreen rendering deferral only for measuring the entire list.
    await page.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' });
    await enlargeText(page, '.shop-card-copy > p, .shop-card-copy h2, .shop-card-copy > span, .shop-card-actions > small, .view-product-button');
    await expectOrderedChildren(page.locator('.shop-card-copy'));
    const clipped = await page.locator('.shop-card-copy > p, .view-product-button').evaluateAll(elements => elements.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
    expect(clipped).toEqual([]);
    if (width <= 560) await expectOrderedChildren(page.locator('.shop-card-actions'));
  });
}

for (const width of [320, 393, 740]) {
  test(`cart recommendations accommodate enlarged text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/cart');
    await expect(page.locator('.cart-recommendations article').first()).toBeVisible();
    await enlargeText(page, '.cart-recommendations h3, .cart-recommendations article > span, .cart-recommendations button');
    await expectOrderedChildren(page.locator('.cart-recommendations article'));
    const clipped = await page.locator('.cart-recommendations button').evaluateAll(elements => elements.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
    expect(clipped).toEqual([]);
  });
}

for (const path of ['/about', '/reviews', '/product/vintage-heart-necklace']) {
  test(`${path} renders on a narrow Android viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    expect(errors).toEqual([]);
    const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    expect(viewportFits).toBe(true);
  });
}
