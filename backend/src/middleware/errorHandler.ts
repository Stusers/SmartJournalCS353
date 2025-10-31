import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  // Handle known application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    // Log operational errors as warnings
    logger.warn({
      type: 'operational_error',
      statusCode,
      message,
      path: req.path,
      method: req.method,
    });
  } else {
    // Log unexpected errors as errors
    logger.error({
      type: 'unexpected_error',
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
};
