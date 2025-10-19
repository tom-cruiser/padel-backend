const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourts() {
  try {
    const courts = await prisma.court.findMany();
    console.log('Courts in database:');
    console.log(JSON.stringify(courts, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourts();
