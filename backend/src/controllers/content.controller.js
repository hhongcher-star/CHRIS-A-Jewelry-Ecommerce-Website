import { z } from 'zod';
import { pool } from '../config/database.js';
import { AppError } from '../errors/app-error.js';

const allowedPages = new Set(['home', 'about', 'shop', 'cart', 'reviews', 'announcement', 'footer']);
const MAX_CONTENT_BYTES = 256 * 1024;
const pageKeys = {
  home: new Set(['hero', 'promise', 'arrivals', 'editorial', 'categories', 'story', '_mobileImages', '_imageAdjustments']),
  about: new Set(['hero', 'story', 'valuesEyebrow', 'valuesTitle', 'values', 'quote', 'journey', 'cta', '_mobileImages', '_imageAdjustments']),
  shop: new Set(['promotion', 'favourites', 'catalogue', '_mobileImages', '_imageAdjustments']),
  cart: new Set(['hero', 'recommendations', 'benefits', 'paymentMethods', 'shippingPrice', '_mobileImages', '_imageAdjustments']),
  reviews: new Set(['hero', 'feed', 'cta', '_mobileImages', '_imageAdjustments']),
  announcement: new Set(['messages']),
  footer: new Set(['brandText', 'socialLabel', 'shopTitle', 'careTitle', 'newsletterTitle', 'newsletterText', 'copyright', 'legalText', 'care'])
};
const contentSchema = z.record(z.string().min(1).max(100), z.unknown());

function validateContent(key, value) {
  const parsed = contentSchema.safeParse(value);
  if (!parsed.success) throw new AppError(400, 'INVALID_CONTENT', 'The page content is invalid.');
  const json = JSON.stringify(parsed.data);
  if (Buffer.byteLength(json, 'utf8') > MAX_CONTENT_BYTES) throw new AppError(413, 'CONTENT_TOO_LARGE', 'Page content must be 256 KB or smaller.');
  if (Object.keys(parsed.data).some((field) => !pageKeys[key].has(field))) throw new AppError(400, 'INVALID_CONTENT_FIELD', 'The page content contains an unsupported field.');
  const inspect = (item, depth = 0) => {
    if (depth > 8) throw new AppError(400, 'INVALID_CONTENT_DEPTH', 'Page content is nested too deeply.');
    if (typeof item === 'string' && item.length > 10000) throw new AppError(400, 'INVALID_CONTENT_VALUE', 'A content field is too long.');
    if (typeof item === 'number' && !Number.isFinite(item)) throw new AppError(400, 'INVALID_CONTENT_VALUE', 'A content number is invalid.');
    if (Array.isArray(item)) {
      if (item.length > 100) throw new AppError(400, 'INVALID_CONTENT_LIST', 'A content list contains too many entries.');
      item.forEach((entry) => inspect(entry, depth + 1));
    } else if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      if (keys.length > 100 || keys.some((field) => ['__proto__', 'prototype', 'constructor'].includes(field))) throw new AppError(400, 'INVALID_CONTENT_OBJECT', 'A content object is invalid.');
      Object.values(item).forEach((entry) => inspect(entry, depth + 1));
    } else if (!['string', 'number', 'boolean', 'undefined'].includes(typeof item) && item !== null) {
      throw new AppError(400, 'INVALID_CONTENT_VALUE', 'A content value is invalid.');
    }
  };
  inspect(parsed.data);
  return { content: parsed.data, json };
}

function pageKey(req) {
  const key = String(req.params.page || '').toLowerCase();
  if (!allowedPages.has(key)) throw new AppError(404, 'CONTENT_PAGE_NOT_FOUND', 'This website content page does not exist.');
  return key;
}

function parseContent(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

export async function publicContent(req, res) {
  const key = pageKey(req);
  const [rows] = await pool.query('SELECT published_content FROM site_content WHERE page_key = ? LIMIT 1', [key]);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, data: { page: key, content: parseContent(rows[0]?.published_content) } });
}

export async function adminContent(req, res) {
  const key = pageKey(req);
  const [rows] = await pool.query('SELECT page_key, draft_content, published_content, published_at, updated_at FROM site_content WHERE page_key = ? LIMIT 1', [key]);
  const row = rows[0];
  res.json({ success: true, data: { page: key, draft: parseContent(row?.draft_content), published: parseContent(row?.published_content), publishedAt: row?.published_at || null, updatedAt: row?.updated_at || null } });
}

export async function saveContentDraft(req, res) {
  const key = pageKey(req);
  const parsed = validateContent(key, req.body?.content);
  const { json } = parsed;
  await pool.query(`
    INSERT INTO site_content (page_key, draft_content, updated_by)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE draft_content = VALUES(draft_content), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
  `, [key, json, req.user.id]);
  res.json({ success: true, data: { page: key, draft: parsed.content } });
}

export async function publishContent(req, res) {
  const key = pageKey(req);
  const suppliedContent = req.body?.content;
  if (suppliedContent !== undefined) {
    const parsed = validateContent(key, suppliedContent);
    const { json } = parsed;
    await pool.query(`
      INSERT INTO site_content (page_key, draft_content, published_content, published_at, updated_by)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON DUPLICATE KEY UPDATE draft_content = VALUES(draft_content), published_content = VALUES(published_content), published_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
    `, [key, json, json, req.user.id]);
    res.json({ success: true, data: { page: key, published: true } });
    return;
  }
  const [result] = await pool.query(`
    UPDATE site_content
    SET published_content = draft_content, published_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE page_key = ? AND draft_content IS NOT NULL
  `, [req.user.id, key]);
  if (!result.affectedRows) throw new AppError(409, 'NO_CONTENT_DRAFT', 'Save this page before publishing it.');
  res.json({ success: true, data: { page: key, published: true } });
}
