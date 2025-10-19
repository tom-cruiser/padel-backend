import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
} from '../controllers/courtController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Public routes
router.get('/', getCourts);
router.get('/:id', getCourtById);

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Court name is required'),
    body('color').notEmpty().withMessage('Court color is required'),
    validate,
  ],
  createCourt
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updateCourt
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  deleteCourt
);

export default router;
