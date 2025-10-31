import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection, closePool } from './db/connection.js';
import { initializeDatabase } from './db/helpers.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';
import journalRoutes from './routes/journalRoutes.js';
import userRoutes from './routes/userRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import promptRoutes from './routes/promptRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use('/api', journalRoutes);
app.use('/api', userRoutes);
app.use('/api', achievementRoutes);
app.use('/api', promptRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    logger.info('Starting SmartJournal backend server...');

    const connected = await testConnection();
    if (!connected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    await initializeDatabase();

    app.listen(PORT, () => {
      logger.info({
        message: 'Server started successfully',
        port: PORT,
        env: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error({ type: 'server_start_error', error });
    process.exit(1);
  }
}

// Graceful shutdown handlers
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ type: 'shutdown_error', error });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({
    type: 'uncaught_exception',
    error: error.message,
    stack: error.stack,
  });
  void shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    type: 'unhandled_rejection',
    reason,
    promise,
  });
});

void startServer();
