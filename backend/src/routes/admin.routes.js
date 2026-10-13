import { Router } from 'express';
import { createProduct, dashboard, listOrders, listProducts } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'));
adminRouter.get('/dashboard', asyncHandler(dashboard));
adminRouter.get('/products', asyncHandler(listProducts));
adminRouter.post('/products', asyncHandler(createProduct));
adminRouter.get('/orders', asyncHandler(listOrders));
