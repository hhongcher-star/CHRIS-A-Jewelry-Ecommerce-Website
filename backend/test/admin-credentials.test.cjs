const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const bcrypt = require('bcryptjs');

class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

async function setup({ role = 'admin', duplicate = false } = {}) {
  const calls = [];
  const passwordHash = await bcrypt.hash('original-password', 4);
  const connection = {
    async beginTransaction() { calls.push('begin'); },
    async commit() { calls.push('commit'); },
    async rollback() { calls.push('rollback'); },
    release() { calls.push('release'); },
    async execute(sql, params) {
      calls.push([sql, params]);
      if (sql.startsWith('SELECT')) return [[{ id: 7, role, status: 'active', email: 'old@example.com', password_hash: passwordHash }]];
      if (duplicate && sql.startsWith('UPDATE users')) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
      return [[]];
    }
  };
  const source = readFileSync(__dirname + '/../src/services/auth.service.js', 'utf8');
  const fn = source.slice(source.indexOf('export async function updateAdminCredentials'), source.indexOf('export async function refreshSession')).replace('export async function', 'async function');
  const context = vm.createContext({ pool: { getConnection: async () => connection }, bcrypt, env: { BCRYPT_ROUNDS: 4 }, AppError });
  vm.runInContext(fn + '\nthis.update = updateAdminCredentials;', context);
  return { update: context.update, calls };
}

test('updates credentials and revokes refresh sessions in one transaction', async () => {
  const { update, calls } = await setup();
  await update(7, { currentPassword: 'original-password', newEmail: 'new@example.com', newPassword: 'replacement-password' });
  const updateCall = calls.find(item => Array.isArray(item) && item[0].startsWith('UPDATE users'));
  assert.equal(updateCall[1][1], 'new@example.com');
  assert.ok(await bcrypt.compare('replacement-password', updateCall[1][2]));
  assert.ok(calls.some(item => Array.isArray(item) && item[0].includes('UPDATE auth_sessions')));
  assert.ok(calls.includes('commit'));
});

test('wrong current password rolls back without changing the account', async () => {
  const { update, calls } = await setup();
  await assert.rejects(update(7, { currentPassword: 'wrong', newEmail: 'new@example.com' }), { code: 'INVALID_CREDENTIALS' });
  assert.ok(calls.includes('rollback'));
  assert.ok(!calls.some(item => Array.isArray(item) && item[0].startsWith('UPDATE')));
});

test('duplicate email rolls back', async () => {
  const { update, calls } = await setup({ duplicate: true });
  await assert.rejects(update(7, { currentPassword: 'original-password', newEmail: 'taken@example.com' }), { code: 'EMAIL_IN_USE' });
  assert.ok(calls.includes('rollback'));
});

test('non-admin cannot update credentials through this service', async () => {
  const { update, calls } = await setup({ role: 'customer' });
  await assert.rejects(update(7, { currentPassword: 'original-password', newPassword: 'replacement-password' }), { code: 'INVALID_CREDENTIALS' });
  assert.ok(calls.includes('rollback'));
});
