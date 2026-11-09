import bcrypt from 'bcryptjs';
import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email().max(255);

export async function createAdminAccount(pool, rounds, input) {
  const email = emailSchema.parse(input.email);
  const password = input.password;
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Password must be at least 12 characters and at most 72 UTF-8 bytes.');
  }
  const passwordHash = await bcrypt.hash(password, rounds);
  try {
    await pool.execute(
      `INSERT INTO users (email, password_hash, full_name, role, status)
       VALUES (?, ?, 'CHRISÉA Administrator', 'admin', 'active')`,
      [email, passwordHash]
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new Error('An account with this email already exists. No account was changed.');
    throw error;
  }
  return email;
}
