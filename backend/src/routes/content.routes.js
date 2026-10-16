import { Router } from 'express';
import { publicContent } from '../controllers/content.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const contentRouter = Router();
contentRouter.get('/:page', asyncHandler(publicContent));
