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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
