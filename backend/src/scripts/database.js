import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const command = process.argv[2];
const filenames = {
  migrate: 'schema.sql',
  seed: 'seed-products.sql',
  stock: 'seed-stock.sql'
};

if (!filenames[command]) {
  throw new Error('Usage: npm run db:migrate, npm run db:seed or npm run db:stock');
}

if (!env.DB_USER) {
  throw new Error('DB_USER must be configured before running database scripts');
}

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(currentDirectory, '../../../database', filenames[command]);
let sql = await fs.readFile(sqlPath, 'utf8');

// Hostinger creates the database in hPanel. Its application user should only
// operate inside that selected database, not issue CREATE DATABASE or USE.
sql = sql
  .replace(/CREATE DATABASE IF NOT EXISTS[\s\S]*?;/i, '')
  .replace(/^USE\s+[^;]+;/gim, '');

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  multipleStatements: true
});

try {
  await connection.query(sql);
  logger.info({ command, file: filenames[command] }, 'Database script completed');
} finally {
  await connection.end();
}
