
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create super admin user
  const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@padelcourt.com' },
    update: {},
    create: {
      email: 'superadmin@padelcourt.com',
      password: hashedSuperAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      language: 'en',
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // Create facility admin
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@padelcourt.com' },
    update: {},
    create: {
      email: 'admin@padelcourt.com',
      password: hashedAdminPassword,
      firstName: 'Facility',
      lastName: 'Manager',
      role: 'ADMIN',
      language: 'en',
      isActive: true,
    },
  });
  console.log('✅ Facility Admin created:', admin.email);

  // Create assistant admin
  const hashedAssistantPassword = await bcrypt.hash('assistant123', 10);
  const assistant = await prisma.user.upsert({
    where: { email: 'assistant@padelcourt.com' },
    update: {},
    create: {
      email: 'assistant@padelcourt.com',
      password: hashedAssistantPassword,
      firstName: 'Assistant',
      lastName: 'Manager',
      role: 'ADMIN',
      language: 'en',
      isActive: true,
    },
  });
  console.log('✅ Assistant Admin created:', assistant.email);

  // Create demo player
  const hashedPlayerPassword = await bcrypt.hash('player123', 10);
  const player = await prisma.user.upsert({
    where: { email: 'player@padelcourt.com' },
    update: {},
    create: {
      email: 'player@padelcourt.com',
      password: hashedPlayerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'PLAYER',
      language: 'en',
    },
  });
  console.log('✅ Player user created:', player.email);

  // Create courts
  const blueCourt = await prisma.court.upsert({
    where: { name: 'Blue Padel Court' },
    update: {
      openingTime: 7,
      closingTime: 23,
    },
    create: {
      name: 'Blue Padel Court',
      color: '#3B82F6',
      description: 'Outdoor court with natural ventilation',
      openingTime: 7,
      closingTime: 23,
    },
  });
  console.log('✅ Blue Court created:', blueCourt.name);

  const greenCourt = await prisma.court.upsert({
    where: { name: 'Green Padel Court' },
    update: {
      openingTime: 7,
      closingTime: 23,
    },
    create: {
      name: 'Green Padel Court',
      color: '#22C55E',
      description: 'Indoor court with synthetic turf',
      openingTime: 7,
      closingTime: 23,
    },
  });
  console.log('✅ Green Court created:', greenCourt.name);

  const redCourt = await prisma.court.upsert({
    where: { name: 'Red Padel Court' },
    update: {
      openingTime: 7,
      closingTime: 23,
    },
    create: {
      name: 'Red Padel Court',
      color: '#EF4444',
      description: 'Professional indoor court with LED lighting',
      openingTime: 7,
      closingTime: 23,
    },
  });
  console.log('✅ Red Court created:', redCourt.name);

  // Create sample bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const booking1 = await prisma.booking.upsert({
    where: {
      courtId_date_startTime: {
        courtId: blueCourt.id,
        date: tomorrow,
        startTime: 14,
      },
    },
    update: {},
    create: {
      userId: player.id,
      courtId: blueCourt.id,
      date: tomorrow,
      startTime: 14,
      endTime: 15.5, // 1.5 hour slot
      status: 'CONFIRMED',
      notes: 'Doubles match',
    },
  });
  console.log('✅ Sample booking created for tomorrow at 2 PM (1.5h slot, blue court)');

  // Create welcome notification
  await prisma.notification.create({
    data: {
      userId: player.id,
      type: 'ADMIN_MESSAGE',
      title: 'Welcome to Padel Court Booking!',
      message: 'Your account has been created successfully. Start booking your favorite courts now!',
    },
  });
  console.log('✅ Welcome notification created');

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATABASE',
      entity: 'System',
      details: { message: 'Database seeded with initial data' },
    },
  });
  console.log('✅ Audit log created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
