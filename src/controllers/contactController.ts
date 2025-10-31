import { Request, Response } from 'express';
import prisma from '../prisma';
import emailService from '../services/emailService';
import logger from '../utils/logger';

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    // Send email notification to admin
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16A34A; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .detail { margin: 20px 0; padding: 20px; background-color: white; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Contact Form Submission</h1>
            </div>
            <div class="content">
              <p>You have received a new message from the contact form:</p>
              
              <div class="detail">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
              </div>

              <p>To respond to this inquiry, you can directly reply to the sender's email.</p>
            </div>
            <div class="footer">
              <p>Padel Court Booking System - Contact Form Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send notification email to admin
    await emailService.sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `New Contact Form Message: ${subject}`,
      html,
      text: `New contact form submission from ${name} (${email})\n\nSubject: ${subject}\n\nMessage: ${message}`,
    });

    // Send confirmation email to user
    const userHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16A34A; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Contacting Us!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              
              <p>We have received your message and will get back to you as soon as possible.</p>
              
              <p>For your reference, here's a copy of your message:</p>
              <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
              </div>

              <p>If you need immediate assistance, you can reach us at:</p>
              <ul>
                <li>Phone: +257 76 322 521</li>
                <li>WhatsApp: +257 69 729 399</li>
              </ul>
            </div>
            <div class="footer">
              <p>Padel Court Booking System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await emailService.sendEmail({
      to: email,
      subject: 'We Have Received Your Message - Padel Court Booking System',
      html: userHtml,
      text: `Thank you for contacting us, ${name}!\n\nWe have received your message and will get back to you as soon as possible.\n\nFor your reference, here's a copy of your message:\n\nSubject: ${subject}\nMessage: ${message}\n\nIf you need immediate assistance, you can reach us at:\nPhone: +257 76 322 521\nWhatsApp: +257 69 729 399\n\nBest regards,\nPadel Court Booking System`,
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contactMessage,
    });

  } catch (error: any) {
    logger.error('Error in createContactMessage:', error);
    
    // Check if it's a Prisma error
    if (error?.code) {
      logger.error('Prisma Error:', { 
        code: error.code, 
        message: error.message || 'Unknown Prisma error'
      });
    }

    // More specific error message based on the error type
    const errorMessage = error?.message || 'Failed to send message';
    
    return res.status(500).json({
      success: false,
      message: `Server error: ${errorMessage}`,
      error: process.env.NODE_ENV === 'development' ? 
        (error?.toString() || 'Unknown error') : 
        undefined
    });
  }
};