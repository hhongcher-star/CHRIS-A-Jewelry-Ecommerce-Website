const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function createController(rows, variants) {
  const source = readFileSync(__dirname + '/../src/controllers/admin.controller.js', 'utf8');
  const code = source.slice(source.indexOf('export async function listProducts'), source.indexOf('export async function getProduct')).replace('export async function', 'async function');
  const calls = [];
  const pool = { async query(sql, params) {
    calls.push({ sql, params });
    if (sql.includes('COUNT(*) AS total')) return [[{ total: rows.length }]];
    if (sql.includes('FROM product_variants WHERE product_id IN')) return [variants];
    return [rows];
  } };
  const context = vm.createContext({ pool, pagination: () => ({ page: 1, pageSize: 100, offset: 0 }) });
  vm.runInContext(code + '\nthis.listProducts = listProducts;', context);
  return { listProducts: context.listProducts, calls };
}

test('listProducts returns every SKU for each product and searches variants', async () => {
  const { listProducts, calls } = createController([{ id: 1, name: 'Ring' }, { id: 2, name: 'Chain' }], [{ product_id: 1, sku: 'RING-001' }, { product_id: 1, sku: 'RING-002' }, { product_id: 2, sku: 'CHAIN-001' }]);
  let payload;
  await listProducts({ query: { q: 'ring-002' } }, { json: data => { payload = data; } });
  assert.deepEqual(Array.from(payload.data.products[0].skus), ['RING-001', 'RING-002']);
  assert.deepEqual(Array.from(payload.data.products[1].skus), ['CHAIN-001']);
  const count = calls.find(call => call.sql.includes('COUNT(*) AS total'));
  assert.match(count.sql, /EXISTS.*sku_variant\.sku LIKE/);
  assert.deepEqual(Array.from(count.params), ['%ring-002%', '%ring-002%', '%ring-002%']);
});

test('products without variants have an empty SKU list', async () => {
  const { listProducts } = createController([{ id: 3, name: 'Pendant' }], []);
  let payload;
  await listProducts({ query: {} }, { json: data => { payload = data; } });
  assert.equal(payload.data.products[0].skus.length, 0);
});

test('empty result does not issue an invalid IN query', async () => {
  const { listProducts, calls } = createController([], []);
  let payload;
  await listProducts({ query: {} }, { json: data => { payload = data; } });
  assert.equal(payload.data.products.length, 0);
  assert.equal(calls.length, 2);
});
