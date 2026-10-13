import { AppError } from '../errors/app-error.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} was not found.`));
}

export function errorHandler(error, req, res, _next) {
  const operational = error instanceof AppError;
  const status = operational ? error.status : 500;

  if (!operational) {
    req.log?.error({ err: error }, 'Unhandled request error');
  }

  const payload = {
    success: false,
    error: {
      code: operational ? error.code : 'INTERNAL_SERVER_ERROR',
      message: operational ? error.message : 'An unexpected error occurred.'
    }
  };

  if (operational && error.fields) {
    payload.error.fields = error.fields;
  }

  res.status(status).json(payload);
}
