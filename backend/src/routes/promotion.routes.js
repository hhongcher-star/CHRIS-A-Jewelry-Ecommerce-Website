import { Router } from 'express';
import { validatePromotion } from '../controllers/promotion.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const promotionRouter = Router();
promotionRouter.post('/validate', asyncHandler(validatePromotion));
