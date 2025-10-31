import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { getSocketIO } from '../utils/socket';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
import emailService from '../services/emailService';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courtId, date, startTime, endTime, recurrenceType, recurrenceEndDate, notes } = req.body;
    const userId = req.user!.userId;

    // Convert times to Decimal for Prisma
    const startTimeDecimal = new Prisma.Decimal(startTime);
    const endTimeDecimal = new Prisma.Decimal(endTime);

    logger.info('Creating booking with data:', { courtId, date, startTime, endTime, recurrenceType, notes, userId });

    // Check if court exists and is active
    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court || !court.isActive) {
      logger.warn('Court not found or inactive:', { courtId });
      res.status(404).json({ error: 'Court not found or inactive' });
      return;
    }

    logger.info('Court found:', { courtName: court.name, openingTime: court.openingTime, closingTime: court.closingTime });

    // Validate time slot - allow flexible times (7 AM to 11 PM for end times)
    const effectiveOpeningTime = 7; // 7 AM
    const effectiveClosingTime = 23; // 11 PM (to allow 10 PM end times)
    
    if (startTime < effectiveOpeningTime || endTime > effectiveClosingTime) {
      logger.warn('Invalid time slot:', { startTime, endTime, effectiveOpeningTime, effectiveClosingTime });
      res.status(400).json({ 
        error: `Invalid time slot. Courts are available from ${effectiveOpeningTime}:00 to ${effectiveClosingTime}:00` 
      });
      return;
    }

    // Check for existing booking
    const existingBooking = await prisma.booking.findFirst({
      where: {
        courtId,
        date: new Date(date),
        startTime: startTimeDecimal,
        status: { not: 'CANCELLED' },
      },
    });

    if (existingBooking) {
      res.status(409).json({ error: 'Time slot already booked' });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        courtId,
        date: new Date(date),
        startTime: startTimeDecimal,
        endTime: endTimeDecimal,
        recurrenceType: recurrenceType || 'NONE',
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        notes,
      },
      include: {
        court: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    logger.info('Booking created successfully:', { bookingId: booking.id, court: court.name });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'BOOKING_CONFIRMATION',
        title: 'Booking Confirmed',
        message: `Your booking for ${court.name} on ${new Date(date).toLocaleDateString()} at ${startTime}:00 has been confirmed.`,
      },
    });

    // Emit Socket.IO event to user
    try {
      const io = getSocketIO();
      io.to(userId).emit('notification:new', notification);

      // Broadcast booking created to all users
      io.emit('booking:created', {
        booking,
        message: `${booking.user.firstName} ${booking.user.lastName} booked ${court.name} on ${new Date(date).toLocaleDateString()}`,
      });
    } catch (socketError) {
      logger.warn('Socket.IO not available for notifications');
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_CREATED',
        entity: 'Booking',
        entityId: booking.id,
        details: { courtId, date, startTime, endTime },
      },
    });

    // Send email notification to user
    try {
      await emailService.sendBookingConfirmation(
        booking.user.email,
        `${booking.user.firstName} ${booking.user.lastName}`,
        court.name,
        date,
        startTime,
        endTime
      );
      logger.info('Booking confirmation email sent to user');
    } catch (emailError) {
      logger.error('Failed to send booking confirmation email:', emailError);
    }

    // Send email notification to admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { email: true },
      });

      for (const admin of admins) {
        await emailService.sendAdminBookingNotification(
          admin.email,
          `${booking.user.firstName} ${booking.user.lastName}`,
          court.name,
          date,
          startTime,
          endTime
        );
      }
      logger.info(`Admin notification emails sent to ${admins.length} admin(s)`);
    } catch (emailError) {
      logger.error('Failed to send admin notification emails:', emailError);
    }

    // Notify wait-list users
    const waitListUsers = await prisma.waitList.findMany({
      where: { courtId, date: new Date(date), startTime: startTimeDecimal },
      include: { user: true },
    });

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    logger.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courtId, date, userId, status } = req.query;
    const currentUser = req.user!;

    const where: any = {};

    if (courtId) where.courtId = courtId as string;
    if (date) where.date = new Date(date as string);
    if (status) where.status = status as string;

    // If userId is specified in query:
    // - Players can only query their own bookings
    // - Admins can query any user's bookings
    if (userId) {
      if (currentUser.role === 'PLAYER' && userId !== currentUser.userId) {
        res.status(403).json({ error: 'You can only view your own bookings' });
        return;
      }
      where.userId = userId as string;
    }

    // Note: When checking availability (courtId + date without userId),
    // all users can see all bookings to know which slots are occupied

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        court: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ bookings });
  } catch (error) {
    logger.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        court: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Players can only view their own bookings
    if (currentUser.role === 'PLAYER' && booking.userId !== currentUser.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    logger.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { court: true },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Players can only cancel their own bookings
    if (currentUser.role === 'PLAYER' && booking.userId !== currentUser.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Create notification
    const cancellationNotification = await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_CANCELLATION',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.court.name} has been cancelled.`,
      },
    });

    // Emit Socket.IO event to user
    try {
      const io = getSocketIO();
      io.to(booking.userId).emit('notification:new', cancellationNotification);

      // Broadcast booking cancellation to all users
      io.emit('booking:cancelled', {
        booking: updatedBooking,
        message: `A booking for ${booking.court.name} on ${booking.date.toLocaleDateString()} has been cancelled.`,
      });
    } catch (socketError) {
      logger.warn('Socket.IO not available for notifications');
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: 'BOOKING_CANCELLED',
        entity: 'Booking',
        entityId: booking.id,
      },
    });

    // Notify wait-list users
    const waitListUsers = await prisma.waitList.findMany({
      where: {
        courtId: booking.courtId,
        date: booking.date,
        startTime: booking.startTime,
      },
      include: { user: true },
    });

    for (const waitListEntry of waitListUsers) {
      const waitListNotification = await prisma.notification.create({
        data: {
          userId: waitListEntry.userId,
          type: 'WAIT_LIST_NOTIFICATION',
          title: 'Slot Available!',
          message: `A slot has opened up for ${booking.court.name} on ${booking.date.toLocaleDateString()} at ${booking.startTime}:00.`,
        },
      });

      // Emit Socket.IO event to each wait-list user
      try {
        const io = getSocketIO();
        io.to(waitListEntry.userId).emit('notification:new', waitListNotification);
      } catch (socketError) {
        logger.warn('Socket.IO not available for wait-list notifications');
      }
    }

    res.json({ message: 'Booking cancelled successfully', booking: updatedBooking });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    // If user is admin, return all bookings
    const where = role === 'ADMIN' ? {} : { userId };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        court: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });

    res.json({ bookings });
  } catch (error) {
    logger.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};
