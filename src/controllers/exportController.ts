import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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
    // Log request details
    console.log('Export request:', {
      user: req.user,
      query: req.query,
      headers: req.headers,
      format: req.query.format
    });

    // Only allow admins to export data
    if (req.user?.role !== 'ADMIN') {
      console.log('Export rejected: User is not admin', { role: req.user?.role });
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

    const format = req.query.format as string || 'json';

    switch (format.toLowerCase()) {
      case 'excel':
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedBookings);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
        
        // Generate buffer
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers and send response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');
  res.send(excelBuffer);
  return;

      case 'pdf':
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=bookings.pdf');
        
        doc.pipe(res);
        
        // Add header with logo and title
        doc.fontSize(24)
           .fillColor('#2563eb')
           .text('Booking History Report', { align: 'center' });
        
        // Add metadata
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        
        doc.moveDown(2);

        // Add filters if any
        if (req.query.startDate || req.query.endDate) {
          doc.fontSize(12)
             .fillColor('#000000');
          
          if (req.query.startDate) {
            doc.text(`From: ${new Date(req.query.startDate as string).toLocaleDateString()}`);
          }
          if (req.query.endDate) {
            doc.text(`To: ${new Date(req.query.endDate as string).toLocaleDateString()}`);
          }
          doc.moveDown();
        }

        // Table header
        const tableTop = doc.y + 20;
        const columnSpacing = 20;
        const columns = {
          playerName: { x: 50, width: 150 },
          court: { x: 200, width: 100 },
          date: { x: 300, width: 100 },
          time: { x: 400, width: 100 },
          status: { x: 500, width: 80 }
        };

        // Draw table header
        doc.fontSize(10)
           .fillColor('#ffffff')
           .rect(50, tableTop - 3, 530, 20)
           .fill('#2563eb');

        doc.fillColor('#ffffff')
           .text('Player Name', columns.playerName.x, tableTop)
           .text('Court', columns.court.x, tableTop)
           .text('Date', columns.date.x, tableTop)
           .text('Time', columns.time.x, tableTop)
           .text('Status', columns.status.x, tableTop);

        // Draw table rows
        let rowTop = tableTop + 20;
        
        formattedBookings.forEach((booking, i) => {
          // Alternate row background
          if (i % 2 === 0) {
            doc.rect(50, rowTop - 3, 530, 20)
               .fill('#f3f4f6');
          }

          doc.fontSize(9)
             .fillColor('#000000')
             .text(booking.playerName, columns.playerName.x, rowTop, { width: columns.playerName.width })
             .text(booking.courtName, columns.court.x, rowTop, { width: columns.court.width })
             .text(new Date(booking.date).toLocaleDateString(), columns.date.x, rowTop, { width: columns.date.width })
             .text(`${booking.startTime}:00 - ${booking.endTime}:00`, columns.time.x, rowTop, { width: columns.time.width });

          // Color-coded status
          const statusColor = booking.status === 'CONFIRMED' ? '#059669' : 
                            booking.status === 'CANCELLED' ? '#dc2626' : '#2563eb';
          doc.fillColor(statusColor)
             .text(booking.status, columns.status.x, rowTop, { width: columns.status.width });

          rowTop += 20;
        });

        // Add footer
        const pageHeight = doc.page.height;
        doc.fontSize(8)
           .fillColor('#666666')
           .text(
             'Padel Court Booking System - Confidential',
             50,
             pageHeight - 50,
             { align: 'center' }
           );

        doc.end();
        return;

      default:
        res.json({ bookings: formattedBookings });
    }
  } catch (error) {
    logger.error('Export bookings error:', error);
    res.status(500).json({ error: 'Failed to export booking history' });
  }
};