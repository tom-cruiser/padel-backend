import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../config/database';

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      // Join user's room
      socket.join(userId);
      
      // Store socket id and user info for user
      socket.on('user:online', async (userData) => {
        connectedUsers.set(userId, {
          socketId: socket.id,
          ...userData
        });

        try {
          // Update user's last seen
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeen: new Date() },
          });
        
          // Emit updated online users list with full user details
          const onlineUsers = Array.from(connectedUsers.entries()).map(([id, data]) => ({
            userId: id,
            ...data
          }));

          // Broadcast to all clients
          io.emit('users:online', onlineUsers);
        } catch (err) {
          console.error('Socket user:online handler error:', err);
        }
      });

      // Handle message sending
      socket.on('message:send', async (data) => {
        try {
          const { fromUserId, toUserId, message, timestamp } = data;
          
          // Validate the message data
          if (!fromUserId || !toUserId || !message) {
            throw new Error('Invalid message data');
          }

          // Create the message in database with sender info
          const savedMessage = await prisma.message.create({
            data: {
              fromUserId,
              toUserId,
              message,
              createdAt: new Date(timestamp),
              isRead: false,
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
                  role: true,
                },
              },
            },
          });

          const messageData = {
            id: savedMessage.id,
            fromUserId,
            toUserId,
            message,
            timestamp: savedMessage.createdAt.toISOString(),
            sender: savedMessage.sender,
            status: 'sent'
          };

          // Send to recipient's room if they're online
          io.to(toUserId).emit('message:receive', messageData);

          // Confirm to sender's room
          io.to(fromUserId).emit('message:sent', messageData);

        } catch (error) {
          console.error('Message send error:', error);
          socket.emit('message:error', {
            error: 'Failed to send message',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle user typing
      socket.on('user:typing', async ({ toUserId }) => {
        const recipientSocketId = connectedUsers.get(toUserId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('user:typing', { userId });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        connectedUsers.delete(userId);
        // Update last seen on disconnect
        prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() },
        }).catch(console.error);
        
        // Emit updated online users list
        const onlineUsers = Array.from(connectedUsers.keys()).map(id => ({
          userId: id,
          socketId: connectedUsers.get(id),
        }));
        io.emit('users:online', onlineUsers);
      });
    }
  });

  return io;
}