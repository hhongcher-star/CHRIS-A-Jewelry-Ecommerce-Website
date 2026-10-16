import { Router } from 'express';
import { catalogueCategories, catalogueProduct, catalogueProducts, productInventory } from '../controllers/catalog.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const catalogRouter = Router();

catalogRouter.get('/', asyncHandler(catalogueProducts));
catalogRouter.get('/inventory', asyncHandler(productInventory));
catalogRouter.get('/categories', asyncHandler(catalogueCategories));
catalogRouter.get('/:slug', asyncHandler(catalogueProduct));
