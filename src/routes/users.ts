import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { param } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// Get all users
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user?.userId }, // Exclude current user
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        lastSeen: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get online users - must come before /:userId route
router.get('/online', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const onlineUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user?.userId } }, // Exclude current user
          { isActive: true }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json({ users: onlineUsers });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// Get user by ID
router.get('/:userId', [
  param('userId').notEmpty().withMessage('User ID is required'),
  validate,
  authenticate
], async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;