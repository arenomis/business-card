export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details ?? undefined,
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      details: err.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера. Попробуйте позже.',
  });
}
