import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicReviews, submitReview } from '../controllers/review.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const reviewRouter = Router();
const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipFailedRequests: true,
  message: { success: false, error: { code: 'REVIEW_RATE_LIMIT', message: 'Too many review attempts. Please wait 15 minutes and try again.' } }
});
reviewRouter.get('/', asyncHandler(publicReviews));
reviewRouter.post('/', submissionLimiter, asyncHandler(submitReview));
