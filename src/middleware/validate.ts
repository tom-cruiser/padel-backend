import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: ValidationError) => ({
      field: 'path' in err ? err.path : 'unknown',
      message: err.msg,
    }));

    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  next();
};
