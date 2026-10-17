import { z } from 'zod';
import { pool } from '../config/database.js';
import { AppError } from '../errors/app-error.js';

const allowedPages = new Set(['home', 'about', 'shop', 'cart', 'reviews', 'announcement', 'footer']);
const contentSchema = z.record(z.string(), z.unknown());

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
  const parsed = contentSchema.safeParse(req.body?.content);
  if (!parsed.success) throw new AppError(400, 'INVALID_CONTENT', 'The page content is invalid.');
  const json = JSON.stringify(parsed.data);
  await pool.query(`
    INSERT INTO site_content (page_key, draft_content, updated_by)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE draft_content = VALUES(draft_content), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
  `, [key, json, req.user.id]);
  res.json({ success: true, data: { page: key, draft: parsed.data } });
}

export async function publishContent(req, res) {
  const key = pageKey(req);
  const suppliedContent = req.body?.content;
  if (suppliedContent !== undefined) {
    const parsed = contentSchema.safeParse(suppliedContent);
    if (!parsed.success) throw new AppError(400, 'INVALID_CONTENT', 'The page content is invalid.');
    const json = JSON.stringify(parsed.data);
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
