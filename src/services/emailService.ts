import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info('Email sent successfully:', { messageId: info.messageId, to: options.to });
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendBookingConfirmation(
    userEmail: string,
    userName: string,
    courtName: string,
    date: string,
    startTime: number,
    endTime: number
  ): Promise<boolean> {
    const formatTime = (time: number) => {
      const hours = Math.floor(time);
      const minutes = (time % 1) * 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
            .button { background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎾 Booking Confirmation</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Your court booking has been confirmed! Here are your booking details:</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Court:</span>
                  <span class="detail-value">${courtName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${formatTime(startTime)} - ${formatTime(endTime)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${endTime - startTime} hour(s)</span>
                </div>
              </div>

              <p>Please arrive 10 minutes before your booking time. Don't forget to bring your equipment!</p>
              
              <p>If you need to cancel or modify your booking, please log in to your account.</p>
              
              <p>See you on the court!</p>
            </div>
            <div class="footer">
              <p>Padel Court Booking System</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Booking Confirmation

Hi ${userName},

Your court booking has been confirmed!

Booking Details:
- Court: ${courtName}
- Date: ${new Date(date).toLocaleDateString()}
- Time: ${formatTime(startTime)} - ${formatTime(endTime)}
- Duration: ${endTime - startTime} hour(s)

Please arrive 10 minutes before your booking time.

See you on the court!

Padel Court Booking System
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Booking Confirmed - ${courtName} on ${new Date(date).toLocaleDateString()}`,
      html,
      text,
    });
  }

  async sendAdminBookingNotification(
    adminEmail: string,
    userName: string,
    courtName: string,
    date: string,
    startTime: number,
    endTime: number
  ): Promise<boolean> {
    const formatTime = (time: number) => {
      const hours = Math.floor(time);
      const minutes = (time % 1) * 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Booking Alert</h1>
            </div>
            <div class="content">
              <p><strong>${userName}</strong> has made a new booking:</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">User:</span>
                  <span class="detail-value">${userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Court:</span>
                  <span class="detail-value">${courtName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${formatTime(startTime)} - ${formatTime(endTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
New Booking Alert

${userName} has made a new booking:

- User: ${userName}
- Court: ${courtName}
- Date: ${new Date(date).toLocaleDateString()}
- Time: ${formatTime(startTime)} - ${formatTime(endTime)}

Padel Court Booking System
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `New Booking - ${userName} booked ${courtName}`,
      html,
      text,
    });
  }
}

export default new EmailService();
