import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createNewAdmin() {
  const email = 'newadmin@padel.com';  // You can change this email
  const password = 'Admin@2023';        // You can change this password
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'New',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
        language: 'en'
      }
    });

    console.log('New admin created successfully:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', newAdmin.id);
    console.log('Full name:', newAdmin.firstName, newAdmin.lastName);
    console.log('\nPlease save these credentials in a secure place!');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewAdmin();