import { Response } from 'express';
import { prisma } from '../config/database';
import { io } from '../server';
import { AuthRequest } from '../middleware/auth';

// Send a message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { toUserId, message } = req.body;
    const fromUserId = req.user!.userId;

    if (!toUserId || !message) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message must be 500 characters or less' });
    }

    // Create message in database
    const newMessage = await prisma.message.create({
      data: {
        fromUserId,
        toUserId,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit real-time event to recipient if online
    io.to(toUserId).emit('message:receive', {
      id: newMessage.id,
      fromUserId: newMessage.fromUserId,
      toUserId: newMessage.toUserId,
      message: newMessage.message,
      timestamp: newMessage.createdAt.toISOString(),
      isRead: newMessage.isRead,
    });

    // Emit confirmation to sender
    io.to(fromUserId).emit('message:sent', {
      id: newMessage.id,
      fromUserId: newMessage.fromUserId,
      toUserId: newMessage.toUserId,
      message: newMessage.message,
      timestamp: newMessage.createdAt.toISOString(),
      isRead: newMessage.isRead,
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get conversation with a user
export const getConversation = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get messages between current user and specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: currentUserId, toUserId: userId },
          { fromUserId: userId, toUserId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        fromUserId: userId,
        toUserId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// Get all conversations (list of users with unread counts)
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;

    // Get all unique users the current user has messaged with
    const sentMessages = await prisma.message.findMany({
      where: { fromUserId: currentUserId },
      select: { toUserId: true },
      distinct: ['toUserId'],
    });

    const receivedMessages = await prisma.message.findMany({
      where: { toUserId: currentUserId },
      select: { fromUserId: true },
      distinct: ['fromUserId'],
    });

    const userIds = [
      ...new Set([
        ...sentMessages.map((m: any) => m.toUserId),
        ...receivedMessages.map((m: any) => m.fromUserId),
      ]),
    ];

    // Get user details and unread counts
    const conversations = await Promise.all(
      userIds.map(async (userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: userId,
            toUserId: currentUserId,
            isRead: false,
          },
        });

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: currentUserId, toUserId: userId },
              { fromUserId: userId, toUserId: currentUserId },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          user,
          unreadCount,
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                timestamp: lastMessage.createdAt,
                fromMe: lastMessage.fromUserId === currentUserId,
              }
            : null,
        };
      })
    );

    // Sort by last message timestamp
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || new Date(0);
      const bTime = b.lastMessage?.timestamp || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;

    const unreadCount = await prisma.message.count({
      where: {
        toUserId: currentUserId,
        isRead: false,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.userId;

    await prisma.message.updateMany({
      where: {
        fromUserId: userId,
        toUserId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Delete a message
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user!.userId;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete
    if (message.fromUserId !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
