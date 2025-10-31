import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import courtRoutes from './courts';
import bookingRoutes from './bookings';
import messageRoutes from './messages';
import galleryRoutes from './gallery';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization
 *   - name: Users
 *     description: User management
 *   - name: Courts
 *     description: Court management
 *   - name: Bookings
 *     description: Court booking operations
 *   - name: Messages
 *     description: User messaging system
 */

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courts', courtRoutes);
router.use('/bookings', bookingRoutes);
router.use('/messages', messageRoutes);
router.use('/gallery', galleryRoutes);

export default router;