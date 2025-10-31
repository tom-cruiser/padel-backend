import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { exportBookingHistory } from '../controllers/exportController';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// Export booking history - Admin only
router.get(
  '/bookings',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    validate,
  ],
  authenticate,
  authorize('ADMIN'),
  exportBookingHistory
);

export default router;