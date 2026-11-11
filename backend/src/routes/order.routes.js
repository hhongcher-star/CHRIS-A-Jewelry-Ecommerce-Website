import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createOrder, getOrderStatus, reportPayment } from '../controllers/order.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const orderRouter = Router();

orderRouter.post('/', rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipFailedRequests: true
}), asyncHandler(createOrder));
orderRouter.post('/:id/payment-notice', rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}), asyncHandler(reportPayment));
orderRouter.post('/:id/status', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }), asyncHandler(getOrderStatus));
