import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { pool } from '../src/config/database.js';
import { createOrder, getOrderStatus } from '../src/controllers/order.controller.js';

test('order status requires its private token and exposes only status information', async () => {
  const token = 'a'.repeat(64);
  let suppliedHash;
  mock.method(pool, 'query', async (sql, params) => {
    if (sql.includes('INFORMATION_SCHEMA')) {
      if (sql.includes("COLUMN_NAME = 'payment_method'")) return [[{ dataType: 'varchar' }]];
      if (sql.includes("COLUMN_NAME = 'status'")) return [[{ columnType: "enum('payment_exception')" }]];
      return [[{ COLUMN_NAME: 'payment_notice_token_hash' }]];
    }
    suppliedHash = params[1];
    return [suppliedHash === crypto.createHash('sha256').update(token).digest('hex') ? [{ status: 'payment_confirmed', updated_at: 100 }] : []];
  });
  const res = { setHeader() {}, json(body) { return body; } };
  try {
    const result = await getOrderStatus({ params: { id: '2' }, body: { paymentNoticeToken: token } }, res);
    assert.deepEqual(result.data, { status: 'payment_confirmed' });
    await assert.rejects(getOrderStatus({ params: { id: '2' }, body: { paymentNoticeToken: 'b'.repeat(64) } }, res), error => error.code === 'ORDER_NOT_FOUND');
    await assert.rejects(getOrderStatus({ params: { id: '2' }, body: { paymentNoticeToken: 'bad' } }, res), error => error.code === 'INVALID_PAYMENT_NOTICE');
  } finally { mock.restoreAll(); }
});

test('checkout rejects phone numbers without seven digits', async () => {
  mock.method(pool, 'query', async sql => {
    if (sql.includes('FROM orders')) return [[]];
    if (sql.includes("COLUMN_NAME = 'payment_method'")) return [[{ dataType: 'varchar' }]];
    if (sql.includes("COLUMN_NAME = 'status'")) return [[{ columnType: "enum('payment_exception')" }]];
    return [[{ COLUMN_NAME: 'payment_notice_token_hash', columnName: 'free_shipping' }]];
  });
  try {
    for (const phone of ['abcdefghi', 'abc1234567']) {
      await assert.rejects(createOrder({ body: { customer: { fullName: 'Test User', phone, addressLine1: '123 Street', city: 'KL', state: 'KL', postcode: '50000' }, items: [{ variantId: 1, quantity: 1 }] } }, {}), error => error.code === 'INVALID_CHECKOUT');
    }
  } finally { mock.restoreAll(); }
});
