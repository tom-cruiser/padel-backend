import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth';
import bookingRoutes from './routes/bookings';
import courtRoutes from './routes/courts';
import notificationRoutes from './routes/notifications';
import messageRoutes from './routes/messages';
import profileRoutes from './routes/profile';
import contactRoutes from './routes/contact';
import userRoutes from './routes/users';
import exportRoutes from './routes/exports';
import galleryRoutes from './routes/gallery';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { prisma } from './config/database';
import { setSocketIO } from './utils/socket';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Socket.IO setup with online users tracking
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Initialize socket utility
setSocketIO(io);

// Store online users: { userId: { socketId, user info } }
const onlineUsers = new Map<string, { socketId: string; firstName: string; lastName: string; role: string }>();

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // User joins with their info
  socket.on('user:online', (userData: { userId: string; firstName: string; lastName: string; role: string }) => {
    socket.join(userData.userId);
    onlineUsers.set(userData.userId, {
      socketId: socket.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
    });
    
    // Broadcast to all users that someone came online
    io.emit('users:online', Array.from(onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    })));
    
    logger.info(`User ${userData.userId} (${userData.firstName}) is now online`);
  });

  // Private message between users
  socket.on('message:send', async (data: { fromUserId: string; toUserId: string; message: string; timestamp: string }) => {
    try {
      // Save message to database
      const savedMessage = await prisma.message.create({
        data: {
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          message: data.message,
        },
      });

      const messageData = {
        id: savedMessage.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        message: data.message,
        timestamp: savedMessage.createdAt.toISOString(),
        isRead: false,
      };

      // Send to recipient if online
      const recipient = onlineUsers.get(data.toUserId);
      if (recipient) {
        io.to(data.toUserId).emit('message:receive', messageData);
      }

      // Send confirmation to sender
      io.to(data.fromUserId).emit('message:sent', messageData);
      
      logger.info(`Message from ${data.fromUserId} to ${data.toUserId}`);
    } catch (error) {
      logger.error('Failed to save message:', error);
    }
  });

  // Mark notification as read
  socket.on('notification:read', (notificationId: string) => {
    socket.emit('notification:updated', notificationId);
  });

  socket.on('disconnect', () => {
    // Find and remove user from online list
    for (const [userId, data] of onlineUsers.entries()) {
      if (data.socketId === socket.id) {
        onlineUsers.delete(userId);
        
        // Broadcast updated online users list
        io.emit('users:online', Array.from(onlineUsers.entries()).map(([uid, udata]) => ({
          userId: uid,
          ...udata,
        })));
        
        logger.info(`User ${userId} went offline`);
        break;
      }
    }
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/gallery', galleryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
