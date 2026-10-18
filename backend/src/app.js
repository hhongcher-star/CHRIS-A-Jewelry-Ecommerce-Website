import crypto from 'node:crypto';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { promotionRouter } from './routes/promotion.routes.js';
import { contentRouter } from './routes/content.routes.js';
import { reviewRouter } from './routes/review.routes.js';

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      genReqId(req, res) {
        const requestId = req.headers['x-request-id'] || crypto.randomUUID();
        res.setHeader('x-request-id', requestId);
        return requestId;
      }
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    })
  );
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use('/uploads', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.resolve(process.cwd(), 'uploads')));
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false
    })
  );

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/products', catalogRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/promotions', promotionRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/admin', adminRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
