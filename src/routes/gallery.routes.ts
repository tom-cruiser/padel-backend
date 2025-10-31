import express from 'express';
import { galleryController } from '../controllers/gallery.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Gallery routes
router.get('/gallery', authMiddleware, galleryController.list);
router.post('/gallery', authMiddleware, galleryController.create);
router.patch('/gallery/:id', authMiddleware, galleryController.update);
router.delete('/gallery/:id', authMiddleware, galleryController.delete);

export default router;