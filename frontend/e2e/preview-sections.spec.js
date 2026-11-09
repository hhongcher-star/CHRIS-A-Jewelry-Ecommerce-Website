import { test, expect, devices } from '@playwright/test';

const sections = [
  ['Home', [['hero','.hero-slider'],['categories','.category-grid'],['arrivals','#new'],['editorial','#promotion'],['story','#story'],['promise','#reviews']]],
  ['About', [['hero','.about-hero'],['story','.about-origin'],['values','.about-values'],['About','.about-quote'],['journey','.about-journey'],['cta','.about-cta']]],
  ['Shop', [['promotion','.shop-promotion'],['favourites','.sale-favorites'],['catalogue','.shop-catalog']]],
  ['Payment method', [['hero','.cart-hero'],['recommendations','.cart-recommendations'],['benefits','.cart-benefits'],['Payment method','.cart-payment-picker']]],
  ['Reviews', [['hero','.reviews-hero'],['feed','.reviews-feed'],['cta','.reviews-cta']]],
  ['Announcement bar', [['Announcement bar','.announcement']]],
  ['Footer', [['Footer','#contact'],['faq','.care-modal-panel'],['shipping','.care-modal-panel'],['returns','.care-modal-panel']]]
];

async function checkPreview(browser, mobile) {
  const { defaultBrowserType: _browserType, ...iphone } = devices['iPhone 13'];
  const context = await browser.newContext({ baseURL:'http://127.0.0.1:4173', ...(mobile ? iphone : { viewport:{ width:1440, height:900 } }) });
  const page = await context.newPage();
  const headers = { 'access-control-allow-origin':'http://127.0.0.1:4173', 'access-control-allow-credentials':'true', 'access-control-allow-headers':'content-type,x-csrf-token', 'access-control-allow-methods':'GET,POST,PATCH,PUT,DELETE,OPTIONS' };
  await context.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (req.method() === 'OPTIONS') return route.fulfill({ status:204, headers });
    let data = {};
    if (path === '/api/auth/refresh') data = { user:{ id:1, role:'admin', full_name:'Test Admin' }, csrfToken:'token' };
    else if (path === '/api/admin/dashboard') data = { summary:{ products:0, stock:0, orders:0, payments_to_review:0, customers:0, total_sales:0, average_order_value:0 }, sales:{}, categorySales:[], paymentSales:[], recentOrders:[], lowStock:[] };
    else if (path === '/api/admin/products') data = { products:[], pagination:{ pages:1 } };
    else if (path === '/api/admin/categories') data = { categories:[] };
    else if (path.startsWith('/api/admin/content/')) data = { draft:{}, published:{} };
    else if (path.startsWith('/api/content/')) data = { content:{} };
    else if (path === '/api/products' || path === '/api/products/inventory') data = { products:[] };
    else if (path === '/api/products/categories') data = { categories:[] };
    else if (path === '/api/reviews') data = { reviews:[] };
    return route.fulfill({ status:200, headers, contentType:'application/json', body:JSON.stringify({data}) });
  });
  try {
    await page.goto('/atelier-9q7m2x4k8v6p');
    if (mobile) await page.getByRole('button',{ name:'Open navigation' }).click();
    await page.locator('.admin-sidebar').getByRole('button',{ name:/Website Content/ }).click();
    const frame = page.frameLocator('.admin-site-preview iframe');
    for (const [tab, items] of sections) {
      await page.locator('.admin-content-tabs').getByRole('button',{ name:tab, exact:true }).click();
      for (const [section, selector] of items) {
        await page.locator('.admin-visual-controls nav').getByRole('button',{ name:section, exact:true }).click();
        const selected = frame.locator(selector + '.cms-preview-selected');
        await expect(selected, tab + ' / ' + section).toBeAttached();
        const marker = await selected.evaluate(el => ({ text:getComputedStyle(el,'::after').content, display:getComputedStyle(el,'::after').display }));
        expect(marker.text).toContain('EDITING THIS SECTION');
        expect(marker.display).not.toBe('none');
        if (tab === 'Footer' && section !== 'Footer') {
          const expected = { faq:'Frequently Asked Questions', shipping:'Shipping & Delivery', returns:'Return & Refund' };
          await expect(frame.locator('.care-modal-panel h2')).toHaveText(expected[section]);
        }
      }
    }
    await page.locator('.admin-content-tabs').getByRole('button',{ name:'Payment method', exact:true }).click();
    await page.locator('.admin-visual-controls nav').getByRole('button',{ name:'Payment method', exact:true }).click();
    await expect(frame.getByText('Preview only — shown at checkout when the cart has items.')).toBeVisible();
    await page.goto('/cart');
    await expect(page.locator('.cart-payment-picker')).toHaveCount(0);
  } finally {
    await context.close();
  }
}

test('all editor sections have markers in mobile preview', async ({ browser }) => {
  test.setTimeout(90000);
  await checkPreview(browser, true);
});
test('all editor sections have markers in desktop preview', async ({ browser }) => {
  test.setTimeout(90000);
  await checkPreview(browser, false);
});
