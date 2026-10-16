import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  refreshExpiryDate
} from './token.service.js';

const publicUserColumns = 'id, email, full_name, phone, role, status, email_verified_at, created_at, updated_at';

function publicUser(user) {
  const { password_hash: _passwordHash, session_id: _sessionId, ...safeUser } = user;
  return safeUser;
}

async function issueSession(connection, user) {
  const refreshToken = createRefreshToken();
  const sessionId = crypto.randomUUID();
  await connection.execute(
    `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [sessionId, user.id, hashRefreshToken(refreshToken), refreshExpiryDate()]
  );
  return { accessToken: createAccessToken(user), refreshToken };
}

export async function registerUser(input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [input.email]);
    if (existing.length > 0) {
      throw new AppError(409, 'EMAIL_IN_USE', 'An account already exists for this email address.');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, full_name, phone)
       VALUES (?, ?, ?, ?)`,
      [input.email, passwordHash, input.fullName, input.phone || null]
    );
    const [rows] = await connection.execute(`SELECT ${publicUserColumns} FROM users WHERE id = ?`, [result.insertId]);
    const tokens = await issueSession(connection, rows[0]);
    await connection.commit();
    return { user: rows[0], ...tokens };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'EMAIL_IN_USE', 'An account already exists for this email address.');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function authenticateCredentials({ email, password }) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  }
  if (user.status !== 'active') {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'This account has been disabled.');
  }

  return user;
}

async function createLoginSession(user) {
  const connection = await pool.getConnection();
  try {
    const tokens = await issueSession(connection, user);
    return { user: publicUser(user), ...tokens };
  } finally {
    connection.release();
  }
}

export async function loginUser(input) {
  return createLoginSession(await authenticateCredentials(input));
}

export async function loginAdminUser(input) {
  const user = await authenticateCredentials(input);
  if (user.role !== 'admin') {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  }

  return createLoginSession(user);
}

export async function refreshSession(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT s.id AS session_id, u.* FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP()
       LIMIT 1 FOR UPDATE`,
      [tokenHash]
    );
    const user = rows[0];
    if (!user || user.status !== 'active') {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The session is invalid or expired.');
    }

    await connection.execute('UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE id = ?', [user.session_id]);
    const tokens = await issueSession(connection, user);
    await connection.commit();
    return { user: publicUser(user), ...tokens };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function revokeSession(refreshToken) {
  if (!refreshToken) return;
  await pool.execute(
    'UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE refresh_token_hash = ? AND revoked_at IS NULL',
    [hashRefreshToken(refreshToken)]
  );
}

export async function getUserById(id) {
  const [rows] = await pool.execute(`SELECT ${publicUserColumns} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}
