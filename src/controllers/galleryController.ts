import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import { uploadToImageKit } from '../services/imagekitService';

export const addImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const imageFile = req.file;
    const userId = req.user!.userId;

    // Input validation
    if (!imageFile) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    if (!title?.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // File validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      res.status(400).json({ error: 'Image size must be less than 5MB' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      res.status(400).json({ error: 'Only JPEG, PNG, and GIF images are allowed' });
      return;
    }

    logger.info('Starting gallery image upload', {
      filename: imageFile.originalname,
      size: imageFile.size,
      mimetype: imageFile.mimetype,
      title
    });

    // Upload image to ImageKit
    try {
      const result = await uploadToImageKit(imageFile);
      
      if (!result.url) {
        throw new Error('Image upload failed - no URL returned');
      }

      logger.info('Image uploaded to ImageKit successfully', { url: result.url });

      // Save to database
      const galleryItem = await prisma.gallery.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          imageUrl: result.url,
          userId,
          isActive: true
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info('Gallery item created successfully', { id: galleryItem.id });

      res.status(201).json({ 
        message: 'Image added successfully', 
        gallery: galleryItem 
      });
    } catch (uploadError: any) {
      logger.error('Image upload failed', { error: uploadError.message });
      res.status(500).json({ 
        error: 'Failed to upload image',
        details: uploadError.message 
      });
    }
  } catch (error: any) {
    logger.error('Add gallery image error:', error);
    res.status(500).json({ 
      error: 'Failed to add image to gallery',
      details: error.message 
    });
  }
};

export const getGalleryImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;
    
    const where = isActive ? { isActive: isActive === 'true' } : {};

    const images = await prisma.gallery.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ images });
  } catch (error) {
    logger.error('Get gallery images error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
};

export const updateGalleryImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;

    const galleryItem = await prisma.gallery.update({
      where: { id },
      data: {
        title,
        description,
        isActive,
      },
    });

    res.json({ message: 'Gallery image updated successfully', gallery: galleryItem });
  } catch (error) {
    logger.error('Update gallery image error:', error);
    res.status(500).json({ error: 'Failed to update gallery image' });
  }
};

export const deleteGalleryImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.gallery.delete({
      where: { id },
    });

    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    logger.error('Delete gallery image error:', error);
    res.status(500).json({ error: 'Failed to delete gallery image' });
  }
};