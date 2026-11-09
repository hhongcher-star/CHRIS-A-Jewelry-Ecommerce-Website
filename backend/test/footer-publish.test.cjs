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
  const context = vm.createContext({ z, AppError, Buffer, pool: { async query(sql, params) { writes.push({ sql, params }); return [{ affectedRows: 1 }]; } } });
  vm.runInContext(code + '\nthis.publishContent = publishContent;', context);
  return { publishContent: context.publishContent, writes };
}

test('publishes footer with legacy newsletter fields and all three care panels', async () => {
  const { publishContent, writes } = setup();
  const content = {
    brandText: 'Brand', newsletterTitle: 'Previous title', newsletterText: 'Previous text',
    care: { faq: { title: 'FAQ', sections: [['Question', 'Answer']] }, shipping: { title: 'Shipping', sections: [['Delivery', 'Details']] }, returns: { title: 'Returns', sections: [['Policy', 'Details']] } }
  };
  let response;
  await publishContent({ params: { page: 'footer' }, body: { content }, user: { id: 7 } }, { json: result => { response = result; } });
  assert.equal(response.data.published, true);
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0].params[1]), content);
  assert.deepEqual(JSON.parse(writes[0].params[2]), content);
});

test('still rejects unrecognised footer fields', async () => {
  const { publishContent, writes } = setup();
  await assert.rejects(publishContent({ params: { page: 'footer' }, body: { content: { unexpectedField: 'bad' } }, user: { id: 7 } }, { json() {} }), /unsupported field/);
  assert.equal(writes.length, 0);
});
