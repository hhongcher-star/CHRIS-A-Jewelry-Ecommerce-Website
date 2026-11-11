import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { durationToMilliseconds } from '../utils/duration.js';

function requireSecret() {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before authentication can be used');
  }
}

export function createAccessToken(user) {
  requireSecret();
  return jwt.sign(
    { role: user.role, credentialVersion: credentialVersion(user.password_hash) },
    env.JWT_SECRET,
    { subject: String(user.id), expiresIn: env.JWT_EXPIRES_IN, issuer: 'chrisea-api' }
  );
}

export function credentialVersion(passwordHash) {
  requireSecret();
  return crypto.createHmac('sha256', env.JWT_SECRET).update(String(passwordHash || '')).digest('hex');
}

export function verifyAccessToken(token) {
  requireSecret();
  try {
    return jwt.verify(token, env.JWT_SECRET, { issuer: 'chrisea-api' });
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'The authentication token is invalid or expired.');
  }
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiryDate() {
  return new Date(Date.now() + durationToMilliseconds(env.JWT_REFRESH_EXPIRES_IN));
}
