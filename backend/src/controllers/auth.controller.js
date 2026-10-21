import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { loginAdminUser, loginUser, refreshSession, registerUser, revokeSession } from '../services/auth.service.js';
import { durationToMilliseconds } from '../utils/duration.js';
import crypto from 'node:crypto';
import { csrfCookieName } from '../middleware/csrf.js';

const cookieName = 'chrisea_refresh';
const accessCookieName = 'chrisea_access';
const rememberCookieName = 'chrisea_remember';
const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
};

function sendAuthentication(res, status, result, persistent = false) {
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const persistence = persistent ? { maxAge: durationToMilliseconds(env.JWT_REFRESH_EXPIRES_IN) } : {};
  res.cookie(cookieName, result.refreshToken, { ...baseCookieOptions, ...persistence, path: '/api/auth' });
  res.cookie(accessCookieName, result.accessToken, { ...baseCookieOptions, ...persistence, path: '/api' });
  res.cookie(csrfCookieName, csrfToken, { ...baseCookieOptions, ...persistence, path: '/api' });
  if (persistent) res.cookie(rememberCookieName, '1', { ...baseCookieOptions, ...persistence, path: '/api/auth' });
  else res.clearCookie(rememberCookieName, { ...baseCookieOptions, path: '/api/auth' });
  res.status(status).json({
    success: true,
    data: { user: result.user, csrfToken }
  });
}

export async function register(req, res) {
  sendAuthentication(res, 201, await registerUser(req.validatedBody));
}

export async function login(req, res) {
  sendAuthentication(res, 200, await loginUser(req.validatedBody));
}

export async function adminLogin(req, res) {
  sendAuthentication(res, 200, await loginAdminUser(req.validatedBody), req.validatedBody.rememberMe);
}

export async function refresh(req, res) {
  const token = req.cookies[cookieName];
  if (!token) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The session is invalid or expired.');
  sendAuthentication(res, 200, await refreshSession(token), req.cookies[rememberCookieName] === '1');
}

export async function logout(req, res) {
  await revokeSession(req.cookies[cookieName]);
  res.clearCookie(cookieName, { ...baseCookieOptions, path: '/api/auth' });
  res.clearCookie(accessCookieName, { ...baseCookieOptions, path: '/api' });
  res.clearCookie(csrfCookieName, { ...baseCookieOptions, path: '/api' });
  res.clearCookie(rememberCookieName, { ...baseCookieOptions, path: '/api/auth' });
  res.status(204).send();
}

export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
