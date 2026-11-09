const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const crypto = require('node:crypto');

function setup() {
  const source = readFileSync(__dirname + '/../src/controllers/auth.controller.js', 'utf8');
  const begin = source.indexOf('const cookieName');
  const end = source.indexOf('export async function logout');
  const code = source.slice(begin, end).replaceAll('export async function', 'async function');
  const context = vm.createContext({
    crypto, csrfCookieName: 'chrisea_csrf', env: { NODE_ENV: 'production', JWT_REFRESH_EXPIRES_IN: '30d' },
    durationToMilliseconds: () => 1000,
    refreshSession: async () => ({ refreshToken: 'rotated', accessToken: 'access', user: { role: 'admin' } }),
    loginAdminUser: async () => ({ refreshToken: 'new', accessToken: 'access', user: { role: 'admin' } }),
    AppError: class AppError extends Error {}
  });
  vm.runInContext(code + '\nthis.refresh = refresh; this.adminLogin = adminLogin;', context);
  const cookies = {};
  let result;
  const res = { cookie(name, value) { cookies[name] = value; return this; }, clearCookie() { return this; }, status() { return this; }, json(data) { result = data; return this; } };
  return { context, cookies, res, result: () => result };
}

test('refresh preserves a valid security token across tabs', async () => {
  const x = setup();
  const token = crypto.randomBytes(32).toString('base64url');
  await x.context.refresh({ cookies: { chrisea_refresh: 'old', chrisea_csrf: token } }, x.res);
  assert.equal(x.cookies.chrisea_csrf, token);
  assert.equal(x.result().data.csrfToken, token);
});

test('refresh replaces missing or malformed security tokens', async () => {
  const x = setup();
  await x.context.refresh({ cookies: { chrisea_refresh: 'old', chrisea_csrf: 'bad' } }, x.res);
  assert.match(x.cookies.chrisea_csrf, /^[A-Za-z0-9_-]{43}$/);
});

test('a new login creates a fresh security token', async () => {
  const x = setup();
  const old = crypto.randomBytes(32).toString('base64url');
  await x.context.adminLogin({ cookies: { chrisea_csrf: old }, validatedBody: {} }, x.res);
  assert.notEqual(x.cookies.chrisea_csrf, old);
});
