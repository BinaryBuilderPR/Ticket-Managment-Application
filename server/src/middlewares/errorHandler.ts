import { Request, Response, NextFunction } from 'express';

/**
 * Global Express error handler — must be registered as the LAST middleware.
 *
 * In production: hides internal details, logs to console.
 * In development: surfaces error.message and stack trace.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode: number = err.statusCode ?? err.status ?? 500;

  // Always log the full error server-side for debugging / monitoring
  console.error(
    `[${new Date().toISOString()}] ERROR ${statusCode} ${req.method} ${req.path} —`,
    err
  );

  if (isProd) {
    res.status(statusCode).json({
      error:
        statusCode < 500
          ? err.message ?? 'Bad Request'
          : 'Internal Server Error',
    });
  } else {
    res.status(statusCode).json({
      error: err.message ?? 'Internal Server Error',
      stack: err.stack,
    });
  }
};

