import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createAdmin, updateAdmin, getUsers } from '../controllers/adminController';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all users with pagination and filtering
router.get('/users', getUsers);

// Create a new admin user
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    validate,
  ],
  createAdmin
);

// Update admin user
router.patch(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('firstName').optional().notEmpty().withMessage('First name is required'),
    body('lastName').optional().notEmpty().withMessage('Last name is required'),
    validate,
  ],
  updateAdmin
);

export default router;