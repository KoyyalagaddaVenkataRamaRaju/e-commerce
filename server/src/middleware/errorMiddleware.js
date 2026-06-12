export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500
  const message = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? error.publicMessage || 'Server error'
    : error.message || 'Server error'

  res.status(statusCode).json({
    message,
    code: error.code,
    details: error.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  })
}
