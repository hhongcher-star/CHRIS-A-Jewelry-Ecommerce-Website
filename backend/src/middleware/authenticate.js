import { AppError } from '../errors/app-error.js';
import { getAuthenticationUser } from '../services/auth.service.js';
import { credentialVersion, verifyAccessToken } from '../services/token.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : req.cookies?.chrisea_access;
  if (!token) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.');

  const payload = verifyAccessToken(token);
  const user = await getAuthenticationUser(payload.sub);
  if (!user || user.status !== 'active' || payload.credentialVersion !== credentialVersion(user.password_hash)) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.');
  }
  const { password_hash: _passwordHash, ...safeUser } = user;
  req.user = safeUser;
  next();
});

export function requireRole(...roles) {
  return function roleMiddleware(req, _res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }
    next();
  };
}
