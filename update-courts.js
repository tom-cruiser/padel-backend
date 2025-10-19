const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCourts() {
  try {
    // Update all courts to have opening time of 7 and closing time of 23
    const result = await prisma.court.updateMany({
      data: {
        openingTime: 7,  // 7 AM
        closingTime: 23,  // 11 PM (to allow 10 PM end times)
      },
    });
    console.log(`✅ Updated ${result.count} courts`);
    
    // Verify the update
    const courts = await prisma.court.findMany();
    console.log('\nUpdated courts:');
    courts.forEach(court => {
      console.log(`- ${court.name}: ${court.openingTime}:00 - ${court.closingTime}:00`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCourts();
