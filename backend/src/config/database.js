import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: false,
  timezone: 'Z'
});

export async function checkDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

let reviewSchemaPromise;

export function ensureReviewSchema() {
  if (!reviewSchemaPromise) {
    reviewSchemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS review_submissions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(120) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        rating TINYINT UNSIGNED NOT NULL,
        title VARCHAR(150) NOT NULL,
        content TEXT NOT NULL,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        ip_hash CHAR(64) NOT NULL,
        submission_hash CHAR(64) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME NULL,
        reviewed_by BIGINT UNSIGNED NULL,
        UNIQUE KEY uq_review_submission_hash (submission_hash),
        KEY idx_review_submissions_status_created (status, created_at),
        CONSTRAINT chk_review_submission_rating CHECK (rating BETWEEN 1 AND 5),
        CONSTRAINT fk_review_submission_admin FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `).catch((error) => {
      reviewSchemaPromise = undefined;
      throw error;
    });
  }
  return reviewSchemaPromise;
}

let paymentSchemaPromise;

export function ensurePaymentSchema() {
  if (!paymentSchemaPromise) {
    paymentSchemaPromise = (async () => {
      const [columns] = await pool.query(`
        SELECT DATA_TYPE AS dataType
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_method'
        LIMIT 1
      `);
      if (columns[0]?.dataType === 'enum') await pool.query('ALTER TABLE orders MODIFY payment_method VARCHAR(120) NOT NULL');
    })().catch((error) => {
      paymentSchemaPromise = undefined;
      throw error;
    });
  }
  return paymentSchemaPromise;
}

export async function closeDatabase() {
  await pool.end();
}
