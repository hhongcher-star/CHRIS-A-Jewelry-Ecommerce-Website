import crypto from 'node:crypto';
import { AppError } from '../errors/app-error.js';

export const csrfCookieName = 'chrisea_csrf';

export function requireCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookieToken = req.cookies?.[csrfCookieName];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken) return next(new AppError(403, 'INVALID_CSRF_TOKEN', 'The security token is missing or expired. Refresh the page and try again.'));
  const left = Buffer.from(cookieToken);
  const right = Buffer.from(headerToken);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return next(new AppError(403, 'INVALID_CSRF_TOKEN', 'The security token is invalid. Refresh the page and try again.'));
  }
  next();
}
