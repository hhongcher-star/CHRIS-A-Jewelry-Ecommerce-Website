import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { pool } from '../src/config/database.js';
import { expirePendingOrders, reportPayment } from '../src/controllers/order.controller.js';
import { updateOrderStatus, updateProduct } from '../src/controllers/admin.controller.js';

test('expired unpaid order releases inventory once and records cancellation', async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('SELECT order_number, status')) return [[{ order_number: 'CHR-TEST', status: 'pending_payment' }]];
      if (sql.includes('SELECT variant_id, quantity')) return [[{ variant_id: 7, quantity: 2 }]];
      return [{ affectedRows: 1 }];
    }
  };
  mock.method(pool, 'query', async () => [[{ id: 15 }]]);
  mock.method(pool, 'getConnection', async () => connection);
  try {
    assert.equal(await expirePendingOrders(), 1);
    assert.equal(calls.filter((call) => typeof call === 'object' && call.sql.includes('stock_quantity = stock_quantity +')).length, 1);
    assert.equal(calls.filter((call) => typeof call === 'object' && call.sql.includes("status = 'cancelled'")).length, 1);
    assert.ok(calls.includes('commit'));
    assert.ok(calls.includes('release'));
  } finally {
    mock.restoreAll();
  }
});

test('expiry skips an order confirmed after the scan', async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => {},
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => {},
    query: async (sql) => { calls.push(sql); return [[]]; }
  };
  mock.method(pool, 'query', async () => [[{ id: 15 }]]);
  mock.method(pool, 'getConnection', async () => connection);
  try {
    await expirePendingOrders();
    assert.equal(calls.filter((call) => call.includes('stock_quantity')).length, 0);
    assert.ok(calls.includes('commit'));
  } finally {
    mock.restoreAll();
  }
});

test('changing a recycled order cannot return inventory a second time', async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => {},
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => {},
    query: async (sql) => {
      calls.push(sql);
      return [[{ status: 'pending_payment', order_number: 'CHR-TEST', deleted_at: new Date() }]];
    }
  };
  mock.method(pool, 'getConnection', async () => connection);
  try {
    await assert.rejects(updateOrderStatus({ params: { id: '15' }, body: { status: 'cancelled' }, user: { id: 1 } }, {}), (error) => error.code === 'ORDER_IN_RECYCLE_BIN');
    assert.equal(calls.filter((call) => call.includes('stock_quantity')).length, 0);
    assert.ok(calls.includes('rollback'));
  } finally {
    mock.restoreAll();
  }
});

test('stale product editor stock cannot overwrite an intervening sale', async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => {},
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => {},
    query: async (sql) => {
      calls.push(sql);
      if (sql.includes('SELECT id FROM products')) return [[{ id: 1 }]];
      if (sql.includes('SELECT id FROM categories')) return [[{ id: 1 }]];
      if (sql.includes('SELECT id FROM product_variants')) return [[{ id: 7 }]];
      if (sql.includes('SELECT stock_quantity FROM product_variants')) return [[{ stock_quantity: 4 }]];
      return [{ affectedRows: 1 }];
    }
  };
  mock.method(pool, 'getConnection', async () => connection);
  const body = {
    name: 'Pearl Ring', category: 'Rings', price: 100, discountPercent: 0,
    sku: 'RING-001', variantName: 'Default', stockQuantity: 6, status: 'active', imageUrls: [],
    variants: [{ id: 7, sku: 'RING-001', variantName: 'Default', price: 100, stockQuantity: 6, expectedStockQuantity: 5, isActive: true }]
  };
  try {
    await assert.rejects(updateProduct({ params: { id: '1' }, body, user: { id: 1 } }, {}), (error) => error.code === 'STOCK_CHANGED');
    assert.equal(calls.filter((call) => call.includes('SET stock_quantity =')).length, 0);
    assert.ok(calls.includes('rollback'));
  } finally {
    mock.restoreAll();
  }
});

test('payment notice requires the order token and records verification status', async () => {
  const calls = [];
  const token = 'a'.repeat(64);
  const connection = {
    beginTransaction: async () => {},
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => {},
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('payment_notice_token_hash = ?')) return [[{ status: 'pending_payment', deleted_at: null }]];
      if (sql.includes('within_window')) return [[{ within_window: 1 }]];
      if (sql.includes('UNIX_TIMESTAMP(updated_at)')) return [[{ reported_at: 1792588175 }]];
      return [{ affectedRows: 1 }];
    }
  };
  mock.method(pool, 'query', async (sql) => [sql.includes('payment_method') ? [{ dataType: 'varchar' }] : [{ COLUMN_NAME: 'payment_notice_token_hash' }]]);
  mock.method(pool, 'getConnection', async () => connection);
  const response = { json: (payload) => payload };
  try {
    const result = await reportPayment({ params: { id: '9' }, body: { paymentNoticeToken: token } }, response);
    assert.equal(result.data.status, 'pending_verification');
    assert.equal(calls.find((call) => typeof call === 'object' && call.sql.includes('payment_notice_token_hash = ?')).params[1], crypto.createHash('sha256').update(token).digest('hex'));
    assert.ok(calls.some((call) => typeof call === 'object' && call.sql.includes("status = 'pending_verification'")));
    assert.ok(calls.includes('commit'));
  } finally {
    mock.restoreAll();
  }
});
