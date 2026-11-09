const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { z } = require('zod');
class AppError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
function setup() {
  const source = readFileSync(__dirname + '/../src/controllers/content.controller.js', 'utf8');
  const code = source.slice(source.indexOf('const allowedPages')).replaceAll('export async function', 'async function');
  const writes = [];
  const ctx = vm.createContext({ z, AppError, Buffer, pool: { async query(sql, params) { writes.push({ sql, params }); return [{ affectedRows: 1 }]; } } });
  vm.runInContext(code + '\nthis.publishContent = publishContent;', ctx);
  return { publishContent: ctx.publishContent, writes };
}
test('publishes Reviews with legacy social content and chosen review button action', async () => {
  const { publishContent, writes } = setup();
  const content = { hero: { title: 'Reviews' }, feed: { items: [] }, cta: { buttonMode: 'link', buttonHref: 'https://example.com/reviews' }, social: { instagram: 'legacy data' } };
  let output;
  await publishContent({ params: { page: 'reviews' }, body: { content }, user: { id: 1 } }, { json: result => { output = result; } });
  assert.equal(output.data.published, true);
  assert.deepEqual(JSON.parse(writes[0].params[1]), content);
  assert.deepEqual(JSON.parse(writes[0].params[2]), content);
});
test('still rejects unknown top-level Reviews fields', async () => {
  const { publishContent, writes } = setup();
  await assert.rejects(publishContent({ params: { page: 'reviews' }, body: { content: { unexpected: 1 } }, user: { id: 1 } }, { json() {} }), /unsupported field/);
  assert.equal(writes.length, 0);
});
