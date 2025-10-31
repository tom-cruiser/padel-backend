import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import logger from '../utils/logger';

interface BookingExport {
  id: string;
  playerName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

export const exportBookingHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only allow admins to export data
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      return;
    }

    const { startDate, endDate } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Format data for export
    const formattedBookings: BookingExport[] = bookings.map((booking) => ({
      id: booking.id,
      playerName: `${booking.user.firstName} ${booking.user.lastName}`,
      courtName: booking.court.name,
      date: booking.date.toISOString().split('T')[0],
      startTime: `${booking.startTime}:00`,
      endTime: `${booking.endTime}:00`,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    }));

    res.json({ bookings: formattedBookings });
  } catch (error) {
    logger.error('Export bookings error:', error);
    res.status(500).json({ error: 'Failed to export booking history' });
  }
};