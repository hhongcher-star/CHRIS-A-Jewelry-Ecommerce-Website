const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('independent tabs serialize refreshes and both restore their sessions', async () => {
  const source = readFileSync(__dirname + '/../src/components/AdminApp.jsx', 'utf8');
  const code = source.slice(source.indexOf('const REMEMBER_KEY'), source.indexOf('async function loadAllAdminRecords'));
  let queue = Promise.resolve(), active = 0, maxActive = 0, count = 0;
  const locks = { request(_name, fn) { const next = queue.then(fn); queue = next.catch(() => {}); return next; } };
  const fetch = async url => {
    if (!url.endsWith('/auth/refresh')) throw new Error('unexpected request');
    active++; count++; maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 20));
    active--;
    return { status: 200, ok: true, json: async () => ({ data: { user: { role: 'admin' }, csrfToken: 'same-token' } }) };
  };
  function tab() {
    const c = vm.createContext({ fetch, AbortSignal, navigator: { locks }, API_URL: '/api', window: { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout } });
    vm.runInContext(code + '\nthis.refreshAuthentication = refreshAuthentication;', c);
    return c;
  }
  const a = tab(), b = tab();
  const results = await Promise.all([a.refreshAuthentication(), b.refreshAuthentication()]);
  assert.equal(results.length, 2);
  assert.equal(count, 2);
  assert.equal(maxActive, 1);
});

test('refresh still works when Web Locks is unavailable', async () => {
  const source = readFileSync(__dirname + '/../src/components/AdminApp.jsx', 'utf8');
  const code = source.slice(source.indexOf('const REMEMBER_KEY'), source.indexOf('async function loadAllAdminRecords'));
  const fetch = async () => ({ status: 200, ok: true, json: async () => ({ data: { user: { role: 'admin' }, csrfToken: 'token' } }) });
  const c = vm.createContext({ fetch, AbortSignal, API_URL: '/api', window: { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout } });
  vm.runInContext(code + '\nthis.refreshAuthentication = refreshAuthentication;', c);
  assert.equal((await c.refreshAuthentication()).csrfToken, 'token');
});
