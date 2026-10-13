import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';

if (env.NODE_ENV === 'production') {
  throw new Error('The local admin seed cannot run in production');
}

const email = process.env.ADMIN_EMAIL || 'admin@chrisea.local';
const password = process.env.ADMIN_PASSWORD || 'AdminTest123!';
const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

try {
  await pool.execute(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES (?, ?, 'CHRISÉA Administrator', 'admin', 'active')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       full_name = VALUES(full_name),
       role = 'admin',
       status = 'active'`,
    [email, passwordHash]
  );
  console.log(`Local administrator ready: ${email}`);
} finally {
  await pool.end();
}
