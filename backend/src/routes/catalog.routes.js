import { Router } from 'express';
import { productInventory } from '../controllers/catalog.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const catalogRouter = Router();

catalogRouter.get('/inventory', asyncHandler(productInventory));
