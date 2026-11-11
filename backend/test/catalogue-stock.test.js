import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/config/database.js';
import { catalogueProducts } from '../src/controllers/catalog.controller.js';

test('public catalogue selects an in-stock active variant and preserves variant quantities', async () => {
  mock.method(pool, 'query', async sql => {
    if (sql.includes('FROM products p')) return [[{ id: 1, name: 'Ring' }, { id: 2, name: 'Sold out ring' }]];
    if (sql.includes('FROM product_images')) return [[]];
    if (sql.includes('FROM product_variants')) return [[
      { id: 10, product_id: 1, stock_quantity: 0 },
      { id: 11, product_id: 1, stock_quantity: 3 },
      { id: 12, product_id: 1, stock_quantity: 7 },
      { id: 20, product_id: 2, stock_quantity: 0 },
    ]];
    throw new Error('Unexpected query');
  });
  try {
    let result;
    await catalogueProducts({}, { json: value => { result = value; } });
    const [available, soldOut] = result.data.products;
    assert.equal(available.purchase_variant.id, 11);
    assert.equal(available.purchase_variant.stock_quantity, 3);
    assert.equal(available.stock_quantity, 10);
    assert.equal(available.variants.length, 3);
    assert.equal(soldOut.purchase_variant.stock_quantity, 0);
  } finally { mock.restoreAll(); }
});
