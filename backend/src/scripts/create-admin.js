import readline from 'node:readline';
import { Writable } from 'node:stream';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { createAdminAccount } from '../services/create-admin-account.js';

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Run this command in an interactive terminal.');
  process.exitCode = 1;
  await pool.end();
} else {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    }
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
  async function secret(prompt) {
    process.stdout.write(prompt);
    muted = true;
    try { return await question(''); }
    finally { muted = false; process.stdout.write('\n'); }
  }
  try {
    const email = await question('New administrator email: ');
    const password = await secret('New password (at least 12 characters): ');
    const confirmation = await secret('Confirm password: ');
    if (password !== confirmation) throw new Error('Passwords do not match. No account was changed.');
    const createdEmail = await createAdminAccount(pool, env.BCRYPT_ROUNDS, { email, password });
    console.log(`Administrator account created: ${createdEmail}`);
  } catch (error) {
    if (error.name === 'ZodError') console.error('Invalid email address. No account was changed.');
    else if (error.code && error.code !== 'ER_DUP_ENTRY') console.error('Could not create the account. Check the database connection and permissions.');
    else console.error(error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await pool.end();
  }
}
