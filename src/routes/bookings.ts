import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  getMyBookings,
} from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  [
    body('courtId').notEmpty().withMessage('Court ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('startTime').isFloat({ min: 7, max: 21.5 }).withMessage('Valid start time is required (7.0-21.5)'),
    body('endTime').isFloat({ min: 8.5, max: 23 }).withMessage('Valid end time is required (8.5-23.0)'),
    validate,
  ],
  createBooking
);

router.get('/', getBookings);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);

export default router;
