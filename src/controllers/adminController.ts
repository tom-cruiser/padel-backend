import { Request, Response } from 'express';
import { hash } from 'bcrypt';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

// Validation schema for admin creation
const createAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});

export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = createAdminSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validatedData.error.errors
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.data.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hash(validatedData.data.password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: validatedData.data.email,
        password: hashedPassword,
        firstName: validatedData.data.firstName,
        lastName: validatedData.data.lastName,
        phoneNumber: validatedData.data.phoneNumber,
        role: 'ADMIN',
        isEmailVerified: true, // Since this is created by another admin
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        isEmailVerified: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_ADMIN',
        userId: req.user?.id, // ID of the admin who created this new admin
        details: `Created new admin user: ${admin.email}`,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

export const updateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName } = req.body;

    const updateData: any = {
      ...(email && { email }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    };

    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Update admin
    const admin = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;

    res.json({
      message: 'Admin updated successfully',
      user: adminWithoutPassword,
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
};

// Get all users with pagination and filtering
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        lastSeen: true,
        membershipStatus: true,
        membershipType: true,
        joinDate: true
      },
      skip,
      take: limit,
      orderBy: {
        joinDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};