import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/config/database.js';
import { createPromotion, updatePromotion, listPromotions } from '../src/controllers/admin.controller.js';
import { validatePromotion } from '../src/controllers/promotion.controller.js';
import { createOrder } from '../src/controllers/order.controller.js';
import { NO_END_DATE, isUnlimitedPromotionEnd, parsePromotionPeriod } from '../src/utils/promotion-period.js';

const base = { name: 'Test offer', code: 'SAVE10', discountValue: 10, freeShipping: false, minimumSpend: 0, startsAt: '2026-11-01T00:00:00.000Z', endsAt: null, applyAutomatically: false, firstOrderOnly: false, usageLimit: 5, isActive: true };
function response() { const result = {}; return { result, status(code) { result.status = code; return this; }, json(value) { result.body = value; return this; } }; }

test('unlimited marker fits the existing date model and invalid dates are rejected', () => {
  assert.equal(parsePromotionPeriod(base.startsAt, null).ends.toISOString(), NO_END_DATE);
  assert.equal(isUnlimitedPromotionEnd(new Date(NO_END_DATE)), true);
  assert.equal(isUnlimitedPromotionEnd('2026-12-01T00:00:00Z'), false);
  assert.throws(() => parsePromotionPeriod('invalid', null), /valid start date/);
  assert.throws(() => parsePromotionPeriod('2026-11-01T00:00:00Z', '2026-10-01T00:00:00Z'), /end date after/);
});

test('creating and editing unlimited promotions stores the marker without losing usage limits', async () => {
  const calls = [];
  mock.method(pool, 'query', async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('INFORMATION_SCHEMA')) return [[{ columnName: 'free_shipping' }]];
    return [{ insertId: 77, affectedRows: 1 }];
  });
  try {
    const res = response();
    await createPromotion({ body: base }, res);
    const insert = calls.find(call => call.sql.includes('INSERT INTO promotions'));
    assert.equal(insert.params[6].toISOString(), NO_END_DATE);
    assert.equal(insert.params[10], 5);
    assert.equal(res.result.status, 201);
    await updatePromotion({ params: { id: '77' }, body: { ...base, endsAt: '2026-12-01T00:00:00Z' } }, response());
    const update = calls.find(call => call.sql.includes('UPDATE promotions SET code'));
    assert.equal(update.params[6].toISOString(), '2026-12-01T00:00:00.000Z');
    await assert.rejects(createPromotion({ body: { ...base, endsAt: 'invalid' } }, response()), (err) => err.code === 'INVALID_PROMOTION_DATES');
  } finally { mock.restoreAll(); }
});

test('admin list distinguishes no end date from scheduled offers', async () => {
  mock.method(pool, 'query', async () => [[{ id: 1, ends_at: new Date(NO_END_DATE) }, { id: 2, ends_at: new Date('2026-12-01T00:00:00Z') }]]);
  try {
    const res = response();
    await listPromotions({}, res);
    assert.equal(res.result.body.data.promotions[0].ends_at, null);
    assert.equal(res.result.body.data.promotions[1].ends_at.toISOString(), '2026-12-01T00:00:00.000Z');
  } finally { mock.restoreAll(); }
});

test('unlimited promo code is still constrained by its usage limit', async () => {
  let usage = 4;
  mock.method(pool, 'query', async () => [[{ id: 1, code: 'SAVE10', name: 'Test offer', discount_value: 10, minimum_spend: 0, free_shipping: false, first_order_only: false, is_active: true, starts_at: new Date(base.startsAt), ends_at: new Date(NO_END_DATE), usage_limit: 5, usage_count: usage, not_started: 0, expired: 0 }]]);
  try {
    let res = response();
    await validatePromotion({ body: { code: 'SAVE10', subtotal: 100 } }, res);
    assert.equal(res.result.body.data.valid, true);
    assert.equal(res.result.body.data.discountTotal, 10);
    usage = 5; res = response();
    await validatePromotion({ body: { code: 'SAVE10', subtotal: 100 } }, res);
    assert.equal(res.result.body.data.reason, 'USAGE_LIMIT_REACHED');
  } finally { mock.restoreAll(); }
});

test('checkout applies a valid unlimited promotion and records its use', async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {},
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('FROM product_variants pv')) return [[{ id: 1, sku: 'A1', variant_name: 'Default', price: 100, stock_quantity: 5, product_name: 'Ring' }]];
      if (sql.includes('SELECT id, role FROM users')) return [[{ id: 99, role: 'customer' }]];
      if (sql.includes('FROM promotions')) return [[{ id: 7, discount_value: 10, free_shipping: false, minimum_spend: 0, first_order_only: false }]];
      if (sql.includes('FROM site_content')) return [[{ published_content: '{"shippingPrice":15}' }]];
      if (sql.includes('INSERT INTO orders')) return [{ insertId: 42 }];
      return [{ affectedRows: 1 }];
    }
  };
  mock.method(pool, 'query', async (sql) => {
    if (sql.includes('FROM orders') && !sql.includes('INFORMATION_SCHEMA')) return [[]];
    if (sql.includes("COLUMN_NAME = 'payment_method'")) return [[{ dataType: 'varchar' }]];
    if (sql.includes("COLUMN_NAME = 'status'")) return [[{ columnType: "enum('payment_exception')" }]];
    return [[{ COLUMN_NAME: 'payment_notice_token_hash', columnName: 'free_shipping' }]];
  });
  mock.method(pool, 'getConnection', async () => connection);
  try {
    const res = response();
    await createOrder({ body: { customer: { fullName: 'Test User', email: 'test@example.com', phone: '0123456789', addressLine1: '123 Street', city: 'Kuala Lumpur', state: 'KL', postcode: '50000' }, paymentMethod: 'Test', promoCode: 'SAVE10', items: [{ variantId: 1, quantity: 1 }] } }, res);
    assert.equal(res.result.status, 201);
    assert.equal(res.result.body.data.order.discount, 10);
    assert.equal(res.result.body.data.order.total, 105);
    assert.ok(calls.some(call => call.sql.includes('ends_at >= UTC_TIMESTAMP()')));
    assert.ok(calls.some(call => call.sql.includes('UPDATE promotions SET usage_count')));
  } finally { mock.restoreAll(); }
});
