import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewButtonMode, safeReviewLink } from '../src/content-links.js';

test('legacy default keeps the built-in review form', () => {
  assert.equal(reviewButtonMode({ buttonHref: 'mailto:hello@chrisea.com' }), 'form');
  assert.equal(reviewButtonMode({}), 'form');
});

test('custom legacy links and explicit actions are respected', () => {
  assert.equal(reviewButtonMode({ buttonHref: 'https://example.com/reviews' }), 'link');
  assert.equal(reviewButtonMode({ buttonHref: 'https://example.com/reviews', buttonMode: 'form' }), 'form');
  assert.equal(reviewButtonMode({ buttonHref: 'mailto:hello@chrisea.com', buttonMode: 'link' }), 'link');
});

test('rejects unsafe or malformed links', () => {
  assert.equal(safeReviewLink('https://example.com/reviews'), 'https://example.com/reviews');
  assert.equal(safeReviewLink('/reviews'), '/reviews');
  assert.equal(safeReviewLink('mailto:hello@example.com'), 'mailto:hello@example.com');
  for (const link of ['javascript:alert(1)', '//evil.example', '/\\evil.example', 'data:text/html,x', 'https://example.com/ bad', '']) assert.equal(safeReviewLink(link), null);
});
