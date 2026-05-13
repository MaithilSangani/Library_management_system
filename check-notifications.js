const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach(notification => {
      console.log(`- ${notification.type}: ${notification.title}`);
      console.log(`  To: ${notification.recipientType} ID ${notification.recipientId}`);
      console.log(`  Status: ${notification.status}`);
      console.log(`  Created: ${notification.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
