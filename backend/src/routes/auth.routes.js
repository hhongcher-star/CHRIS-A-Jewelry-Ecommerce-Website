import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { adminLogin, login, logout, me, refresh, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../utils/validation.js';

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: { code: 'TOO_MANY_LOGIN_ATTEMPTS', message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' } }
});

const email = z.string().trim().toLowerCase().email().max(255);
const password = z.string().min(10).max(128);
const registerSchema = z.object({
  email,
  password,
  fullName: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal(''))
}).strict();
const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();

function validateBody(schema) {
  return function validationMiddleware(req, _res, next) {
    try {
      req.validatedBody = validate(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

authRouter.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(register));
authRouter.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(login));
authRouter.post('/admin/login', adminLoginLimiter, validateBody(loginSchema), asyncHandler(adminLogin));
authRouter.post('/refresh', authLimiter, asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
authRouter.get('/me', authenticate, me);
