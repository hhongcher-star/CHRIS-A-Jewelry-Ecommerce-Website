import crypto from 'node:crypto';
import { z } from 'zod';
import { ensureReviewSchema, pool } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const reviewSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(1).max(2000),
  website: z.string().max(0).optional().default(''),
  startedAt: z.coerce.number().int().positive()
});

const digest = (value) => crypto.createHash('sha256').update(`${env.JWT_SECRET || 'local-review-key'}:${value}`).digest('hex');

export async function submitReview(req, res) {
  await ensureReviewSchema();
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_REVIEW', 'Please complete every review field correctly.');
  const review = parsed.data;
  const elapsed = Date.now() - review.startedAt;
  if (elapsed < 3500 || elapsed > 2 * 60 * 60 * 1000) throw new AppError(400, 'INVALID_REVIEW_TIMING', 'Please refresh the page and try again.');
  const links = review.content.match(/https?:\/\/|www\.|<a\b/gi) || [];
  if (links.length > 1) throw new AppError(400, 'REVIEW_LINK_LIMIT', 'Reviews cannot contain multiple links.');
  const ipHash = digest(req.ip || req.socket.remoteAddress || 'unknown');
  const submissionHash = digest([ipHash, review.title.toLowerCase(), review.content.toLowerCase()].join('|'));
  try {
    await pool.query("INSERT INTO review_submissions (customer_name, customer_email, rating, title, content, status, ip_hash, submission_hash, reviewed_at) VALUES (?, ?, ?, ?, ?, 'approved', ?, ?, UTC_TIMESTAMP())", [review.customerName, '', review.rating, review.title, review.content, ipHash, submissionHash]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'DUPLICATE_REVIEW', 'This review has already been submitted.');
    throw error;
  }
  res.status(201).json({ success: true, data: { submitted: true, message: 'Thank you. Your review has been published.' } });
}

export async function publicReviews(_req, res) {
  await ensureReviewSchema();
  const [rows] = await pool.query("SELECT id, customer_name AS author, rating, title, content AS copy, created_at FROM review_submissions WHERE status <> 'rejected' ORDER BY created_at DESC LIMIT 60");
  res.setHeader('Cache-Control', 'no-cache');
  res.json({ success: true, data: { reviews: rows } });
}

export async function adminReviews(_req, res) {
  await ensureReviewSchema();
  const [rows] = await pool.query('SELECT id, customer_name, customer_email, rating, title, content, status, created_at, reviewed_at FROM review_submissions ORDER BY FIELD(status, \'pending\', \'approved\', \'rejected\'), created_at DESC LIMIT 250');
  res.json({ success: true, data: { reviews: rows } });
}

export async function moderateReview(req, res) {
  await ensureReviewSchema();
  const id = Number(req.params.id);
  const parsed = z.object({ status: z.enum(['approved', 'rejected']) }).safeParse(req.body);
  if (!Number.isInteger(id) || id < 1 || !parsed.success) throw new AppError(400, 'INVALID_REVIEW_UPDATE', 'Choose a valid review decision.');
  const [result] = await pool.query('UPDATE review_submissions SET status = ?, reviewed_at = UTC_TIMESTAMP(), reviewed_by = ? WHERE id = ?', [parsed.data.status, req.user.id, id]);
  if (!result.affectedRows) throw new AppError(404, 'REVIEW_NOT_FOUND', 'This review could not be found.');
  res.json({ success: true, data: { updated: true } });
}

export async function deleteReview(req, res) {
  await ensureReviewSchema();
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new AppError(400, 'INVALID_REVIEW_ID', 'This review is invalid.');
  const [result] = await pool.query('DELETE FROM review_submissions WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError(404, 'REVIEW_NOT_FOUND', 'This review could not be found.');
  res.status(204).send();
}
