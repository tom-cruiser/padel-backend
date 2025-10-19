import express from 'express';
import { getProfile, updateProfile, uploadAvatar, getMembership, getPayments, getAchievements, getAttendance, getPosts, getFriends, updatePrivacy } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Get current user's profile
router.get('/', authenticate, getProfile);

// Update profile info (name, email, phone, address, etc.)
router.put('/', authenticate, updateProfile);

// Upload/change avatar
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

// Get membership info
router.get('/membership', authenticate, getMembership);

// Get payment history
router.get('/payments', authenticate, getPayments);

// Get achievements
router.get('/achievements', authenticate, getAchievements);

// Get attendance records
router.get('/attendance', authenticate, getAttendance);

// Get user's posts
router.get('/posts', authenticate, getPosts);

// Get user's friends
router.get('/friends', authenticate, getFriends);

// Update privacy settings
router.put('/privacy', authenticate, updatePrivacy);

export default router;
