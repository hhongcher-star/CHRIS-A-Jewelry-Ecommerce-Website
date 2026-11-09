const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function setup(fetch) {
  const source = readFileSync(__dirname + '/../src/components/AdminApp.jsx', 'utf8');
  const start = source.indexOf('const REMEMBER_KEY');
  const end = source.indexOf('async function loadAllAdminRecords');
  const context = vm.createContext({ fetch, AbortSignal, window: { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout }, API_URL: '/api' });
  vm.runInContext(source.slice(start, end) + '\nthis.api = api; this.refreshAuthentication = refreshAuthentication;', context);
  return context;
}

test('concurrent failed requests share one refresh', async () => {
  let refreshes = 0;
  let calls = 0;
  const ctx = setup(async url => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return { ok: true, status: 200, json: async () => ({ data: { user: { role: 'admin' }, csrfToken: 'new' } }) };
    }
    calls++;
    if (calls <= 2) return { status: 401 };
    return { ok: true, status: 200, json: async () => ({ data: 'ok' }) };
  });
  assert.deepEqual(await Promise.all([ctx.api('/admin/a'), ctx.api('/admin/b')]), ['ok', 'ok']);
  assert.equal(refreshes, 1);
});

test('server errors are not reported as expired sessions', async () => {
  const ctx = setup(async () => ({ ok: false, status: 503, json: async () => ({}) }));
  await assert.rejects(ctx.refreshAuthentication(), /Unable to restore your session/);
});
