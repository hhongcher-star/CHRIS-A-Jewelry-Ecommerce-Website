# CHRISÉA Jewelry API

Express REST API for the CHRISÉA Jewelry storefront and administration area.

## Local setup

1. Copy `.env.example` to `.env` and enter the local MySQL credentials.
2. Install packages with `npm install`.
3. Create the empty database named by `DB_NAME`.
4. Run `npm run db:migrate`, followed by `npm run db:seed`.
5. Start the API with `npm run dev`.

This workspace also contains an isolated XAMPP/MariaDB development instance on
`127.0.0.1:3307`. After a computer restart, start it with:

```bash
npm run db:local:start
```

Its files live in the ignored `.mysql-data` directory and do not modify the
existing XAMPP data directory.

Health endpoints:

- `GET /api/health` checks the HTTP service.
- `GET /api/health/database` checks the configured database connection.

Authentication endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me` with an `Authorization: Bearer <token>` header

The short-lived access token is returned in JSON. The rotating refresh token is
stored in an HTTP-only cookie and only its SHA-256 hash is stored in MySQL.

## Hostinger

Create the MySQL database and user in hPanel, then configure `DB_HOST`,
`DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` as application environment
variables. When the Node.js app and database are in the same Hostinger hosting
environment, `DB_HOST` is normally `localhost`.

The database scripts deliberately remove `CREATE DATABASE` and `USE` statements
before execution, so they operate only on the database selected by `DB_NAME`.
