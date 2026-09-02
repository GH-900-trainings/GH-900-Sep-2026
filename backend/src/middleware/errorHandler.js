import { AppError } from '../errors/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: `No route for ${req.method} ${req.path}.` } });
}

// `next` is unused but required: Express identifies error middleware by arity.
export function errorHandler(err, req, res, next) {
  // Upstream detail stays in the server log; the client only sees a code and a safe message.
  console.error(`${req.method} ${req.path} failed:`, err);

  if (err instanceof AppError) {
    res.status(err.httpStatus).json({ error: { code: err.code, message: err.message } });
    return;
  }

  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
}
