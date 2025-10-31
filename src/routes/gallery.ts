import { Router } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  addImage,
  getGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
} from '../controllers/galleryController';

const router = Router();
// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Public routes
router.get('/', getGalleryImages);

// Protected routes
router.use(authenticate);

// Admin only routes
router.use(authorize('ADMIN'));

router.post(
  '/',
  upload.single('image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    validate,
  ],
  addImage
);

router.patch(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    validate,
  ],
  updateGalleryImage
);

router.delete('/:id', deleteGalleryImage);

export default router;