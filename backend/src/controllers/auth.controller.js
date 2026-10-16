import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { loginAdminUser, loginUser, refreshSession, registerUser, revokeSession } from '../services/auth.service.js';
import { durationToMilliseconds } from '../utils/duration.js';

const cookieName = 'chrisea_refresh';
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: durationToMilliseconds(env.JWT_REFRESH_EXPIRES_IN)
};

function sendAuthentication(res, status, result) {
  res.cookie(cookieName, result.refreshToken, cookieOptions);
  res.status(status).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken }
  });
}

export async function register(req, res) {
  sendAuthentication(res, 201, await registerUser(req.validatedBody));
}

export async function login(req, res) {
  sendAuthentication(res, 200, await loginUser(req.validatedBody));
}

export async function adminLogin(req, res) {
  sendAuthentication(res, 200, await loginAdminUser(req.validatedBody));
}

export async function refresh(req, res) {
  const token = req.cookies[cookieName];
  if (!token) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The session is invalid or expired.');
  sendAuthentication(res, 200, await refreshSession(token));
}

export async function logout(req, res) {
  await revokeSession(req.cookies[cookieName]);
  res.clearCookie(cookieName, cookieOptions);
  res.status(204).send();
}

export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
