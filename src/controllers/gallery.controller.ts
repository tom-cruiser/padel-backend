import { Request, Response } from 'express';
import { prisma } from '../config/database';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const galleryController = {
  // Create a new gallery image
  create: async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, imageUrl, fileId } = req.body;
      const userId = req.user?.id; // Assuming you have user info in the request

      if (!title || !imageUrl || !fileId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const gallery = await prisma.gallery.create({
        data: {
          title,
          description,
          imageUrl,
          fileId,
          userId,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.status(201).json({ gallery });
    } catch (error) {
      console.error('Gallery create error:', error);
      res.status(500).json({ error: 'Failed to create gallery image' });
    }
  },

  // Get all gallery images
  list: async (req: AuthRequest, res: Response) => {
    try {
      const { isActive } = req.query;
      const query = isActive !== undefined ? { isActive: isActive === 'true' } : {};

      const images = await prisma.gallery.findMany({
        where: query,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ images });
    } catch (error) {
      console.error('Gallery list error:', error);
      res.status(500).json({ error: 'Failed to fetch gallery images' });
    }
  },

  // Update a gallery image
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const gallery = await prisma.gallery.update({
        where: {
          id,
          userId
        },
        data: req.body,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!gallery) {
        return res.status(404).json({ error: 'Gallery image not found' });
      }

      res.json({ gallery });
    } catch (error) {
      console.error('Gallery update error:', error);
      res.status(500).json({ error: 'Failed to update gallery image' });
    }
  },

  // Delete a gallery image
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const gallery = await prisma.gallery.delete({
        where: {
          id,
          userId
        }
      });

      if (!gallery) {
        return res.status(404).json({ error: 'Gallery image not found' });
      }

      res.json({ message: 'Gallery image deleted successfully' });
    } catch (error) {
      console.error('Gallery delete error:', error);
      res.status(500).json({ error: 'Failed to delete gallery image' });
    }
  },
};