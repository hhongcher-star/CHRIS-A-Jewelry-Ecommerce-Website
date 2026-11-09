const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const source = readFileSync(__dirname + '/../src/services/create-admin-account.js', 'utf8');
const code = source.replace(/import[^\n]+\n/g, '').replace('export async function', 'async function');
const context = vm.createContext({ bcrypt, z, Buffer });
vm.runInContext(code + '\nthis.createAdminAccount = createAdminAccount;', context);
const create = context.createAdminAccount;

test('creates a new independent admin with hashed password', async () => {
  let params, sql;
  const pool = { execute: async (query, values) => { sql = query; params = values; } };
  assert.equal(await create(pool, 4, { email: ' Owner@Example.com ', password: 'Example-password-123' }), 'owner@example.com');
  assert.match(sql, /INSERT INTO users/);
  assert.doesNotMatch(sql, /ON DUPLICATE KEY UPDATE/);
  assert.equal(params[0], 'owner@example.com');
  assert.ok(await bcrypt.compare('Example-password-123', params[1]));
});

test('duplicate email does not update existing account', async () => {
  const pool = { execute: async () => { throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }); } };
  await assert.rejects(create(pool, 4, { email: 'existing@example.com', password: 'Example-password-123' }), /No account was changed/);
});

test('rejects weak and oversized passwords without database writes', async () => {
  let writes = 0;
  const pool = { execute: async () => { writes++; } };
  await assert.rejects(create(pool, 4, { email: 'owner@example.com', password: 'short' }), /at least 12/);
  await assert.rejects(create(pool, 4, { email: 'owner@example.com', password: 'x'.repeat(73) }), /72 UTF-8 bytes/);
  assert.equal(writes, 0);
});
