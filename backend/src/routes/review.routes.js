import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicReviews, submitReview } from '../controllers/review.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const reviewRouter = Router();
const submissionLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, error: { code: 'REVIEW_RATE_LIMIT', message: 'Too many review attempts. Please try again later.' } } });
reviewRouter.get('/', asyncHandler(publicReviews));
reviewRouter.post('/', submissionLimiter, asyncHandler(submitReview));
