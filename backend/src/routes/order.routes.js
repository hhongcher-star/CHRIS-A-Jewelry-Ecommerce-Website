import { Router } from 'express';
import { createOrder } from '../controllers/order.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const orderRouter = Router();

orderRouter.post('/', asyncHandler(createOrder));
