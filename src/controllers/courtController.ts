import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import logger from '../utils/logger';

export const getCourts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ courts });
  } catch (error) {
    logger.error('Get courts error:', error);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
};

export const getCourtById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const court = await prisma.court.findUnique({
      where: { id },
    });

    if (!court) {
      res.status(404).json({ error: 'Court not found' });
      return;
    }

    res.json({ court });
  } catch (error) {
    logger.error('Get court error:', error);
    res.status(500).json({ error: 'Failed to fetch court' });
  }
};

export const createCourt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color, description, openingTime, closingTime } = req.body;

    const court = await prisma.court.create({
      data: {
        name,
        color,
        description,
        openingTime: openingTime || 8,
        closingTime: closingTime || 22,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'COURT_CREATED',
        entity: 'Court',
        entityId: court.id,
        details: { name, color },
      },
    });

    res.status(201).json({ message: 'Court created successfully', court });
  } catch (error) {
    logger.error('Create court error:', error);
    res.status(500).json({ error: 'Failed to create court' });
  }
};

export const updateCourt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color, description, openingTime, closingTime, isActive } = req.body;

    const court = await prisma.court.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
        ...(openingTime !== undefined && { openingTime }),
        ...(closingTime !== undefined && { closingTime }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'COURT_UPDATED',
        entity: 'Court',
        entityId: court.id,
        details: req.body,
      },
    });

    res.json({ message: 'Court updated successfully', court });
  } catch (error) {
    logger.error('Update court error:', error);
    res.status(500).json({ error: 'Failed to update court' });
  }
};

export const deleteCourt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.court.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'COURT_DELETED',
        entity: 'Court',
        entityId: id,
      },
    });

    res.json({ message: 'Court deactivated successfully' });
  } catch (error) {
    logger.error('Delete court error:', error);
    res.status(500).json({ error: 'Failed to delete court' });
  }
};
