import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
