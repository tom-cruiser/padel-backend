import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { uploadToImageKit } from '../services/imagekitService';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        achievements: true,
        attendances: true,
        payments: true,
        posts: true,
        friends: { include: { friend: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, phone, address, preferredCourt, language } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { firstName, lastName, email, phone, address, preferredCourt, language },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'File must be an image' });
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: 'File size must be less than 5MB' });
    }

    // Upload to ImageKit
    let result;
    try {
      result = await uploadToImageKit(req.file, 'avatars');
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return res.status(500).json({ 
        message: 'Failed to upload to image service', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Update user avatar in database
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { avatar: result.url },
      });
      res.json({ avatar: user.avatar });
    } catch (error) {
      console.error('Database update error:', error);
      return res.status(500).json({ message: 'Failed to update user avatar' });
    }
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

export const getMembership = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      membershipStatus: user.membershipStatus,
      membershipType: user.membershipType,
      joinDate: user.joinDate,
      membershipExpiry: user.membershipExpiry,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch membership info', error: err });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { paidAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments', error: err });
  }
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { userId: req.user!.userId },
      orderBy: { awardedAt: 'desc' },
    });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch achievements', error: err });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany({
      where: { userId: req.user!.userId },
      orderBy: { attendedAt: 'desc' },
    });
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance', error: err });
  }
};

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts', error: err });
  }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const friends = await prisma.friend.findMany({
      where: { userId: req.user!.userId },
      include: { friend: true },
    });
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch friends', error: err });
  }
};

export const updatePrivacy = async (req: AuthRequest, res: Response) => {
  try {
    const { privacy } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { privacy },
    });
    res.json({ privacy: user.privacy });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update privacy', error: err });
  }
};
