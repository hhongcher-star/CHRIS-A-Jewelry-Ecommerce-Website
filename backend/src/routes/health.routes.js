import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'chrisea-jewelry-api',
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

healthRouter.get('/database', async (_req, res, next) => {
  try {
    await checkDatabaseConnection();
    res.json({ success: true, data: { database: 'connected' } });
  } catch (error) {
    next(error);
  }
});
