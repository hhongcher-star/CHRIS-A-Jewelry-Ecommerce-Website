import { createApp } from './app.js';
import { checkDatabaseConnection, closeDatabase, ensurePaymentSchema, ensureReviewSchema } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { expirePendingOrders } from './controllers/order.controller.js';

const app = createApp();
let expiryRunning = false;
const expiryTimer = setInterval(async () => {
  if (expiryRunning) return;
  expiryRunning = true;
  try {
    const checked = await expirePendingOrders();
    if (checked) logger.info({ checked }, 'Expired unpaid orders checked');
  } catch (error) {
    logger.error({ err: error }, 'Could not release expired order stock');
  } finally {
    expiryRunning = false;
  }
}, 60_000);
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'API server started');

  checkDatabaseConnection()
    .then(() => Promise.all([ensureReviewSchema(), ensurePaymentSchema()]))
    .then(() => logger.info('Database connection established and storefront schemas ready'))
    .catch((error) => logger.warn({ err: error }, 'Database is not available'));
});

async function shutdown(signal) {
  clearInterval(expiryTimer);
  logger.info({ signal }, 'Shutting down API server');
  server.close(async (serverError) => {
    try {
      await closeDatabase();
    } catch (databaseError) {
      logger.error({ err: databaseError }, 'Failed to close database pool');
    }
    if (serverError) {
      logger.error({ err: serverError }, 'Failed to close HTTP server');
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
