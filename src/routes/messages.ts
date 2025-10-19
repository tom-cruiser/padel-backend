import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post(
  '/',
  [
    body('toUserId').notEmpty().withMessage('Recipient user ID is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 500 })
      .withMessage('Message must be 500 characters or less'),
    validate,
  ],
  sendMessage
);

// Get all conversations
router.get('/conversations', getConversations);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get conversation with a specific user
router.get(
  '/conversation/:userId',
  [
    param('userId').notEmpty().withMessage('User ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validate,
  ],
  getConversation
);

// Mark messages from a user as read
router.patch(
  '/read/:userId',
  [param('userId').notEmpty().withMessage('User ID is required'), validate],
  markAsRead
);

// Delete a message
router.delete(
  '/:messageId',
  [param('messageId').notEmpty().withMessage('Message ID is required'), validate],
  deleteMessage
);

export default router;
