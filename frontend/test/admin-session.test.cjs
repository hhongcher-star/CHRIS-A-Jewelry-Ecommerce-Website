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

test('retries a rejected save after restoring the security token', async () => {
  const requests = [];
  const ctx = setup(async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('/auth/refresh')) return { ok: true, status: 200, json: async () => ({ data: { user: { role: 'admin' }, csrfToken: 'fresh' } }) };
    if (requests.length === 1) return { ok: false, status: 403, json: async () => ({ error: { code: 'INVALID_CSRF_TOKEN', message: 'Invalid token' } }) };
    return { ok: true, status: 200, json: async () => ({ data: 'saved' }) };
  });
  assert.equal(await ctx.api('/admin/products/1', { method: 'PUT', body: '{"name":"Ring"}' }), 'saved');
  assert.equal(requests.length, 3);
  assert.equal(requests[2].options.headers['X-CSRF-Token'], 'fresh');
  assert.equal(requests[2].options.body, '{"name":"Ring"}');
});

test('does not retry unrelated permission errors', async () => {
  let calls = 0;
  const ctx = setup(async () => {
    calls++;
    return { ok: false, status: 403, json: async () => ({ error: { code: 'FORBIDDEN', message: 'Not allowed' } }) };
  });
  await assert.rejects(ctx.api('/admin/products/1', { method: 'PUT', body: '{}' }), /Not allowed/);
  assert.equal(calls, 1);
});

test('does not retry a second rejected security token', async () => {
  let saves = 0;
  let refreshes = 0;
  const ctx = setup(async url => {
    if (url.endsWith('/auth/refresh')) { refreshes++; return { ok: true, status: 200, json: async () => ({ data: { user: { role: 'admin' }, csrfToken: 'fresh' } }) }; }
    saves++;
    return { ok: false, status: 403, json: async () => ({ error: { code: 'INVALID_CSRF_TOKEN', message: 'Invalid token' } }) };
  });
  await assert.rejects(ctx.api('/admin/products/1', { method: 'PUT', body: '{}' }), /Invalid token/);
  assert.equal(saves, 2);
  assert.equal(refreshes, 1);
});
