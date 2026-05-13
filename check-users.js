const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Check librarians
    const librarians = await prisma.librarian.findMany({
      select: {
        librarianId: true,
        librarianEmail: true,
        librarianFirstName: true,
        librarianLastName: true
      }
    });

    console.log(`👨‍💼 Librarians (${librarians.length}):`);
    librarians.forEach((lib, i) => {
      console.log(`${i+1}. ID: ${lib.librarianId}, Email: ${lib.librarianEmail}, Name: ${lib.librarianFirstName} ${lib.librarianLastName}`);
    });

    // Check patrons
    const patrons = await prisma.patron.findMany({
      select: {
        patronId: true,
        patronEmail: true,
        patronFirstName: true,
        patronLastName: true
      },
      take: 10
    });

    console.log(`\n👥 Patrons (showing first 10 of ${patrons.length}):`);
    patrons.forEach((patron, i) => {
      console.log(`${i+1}. ID: ${patron.patronId}, Email: ${patron.patronEmail}, Name: ${patron.patronFirstName} ${patron.patronLastName}`);
    });

    console.log('\n🔍 Notification Recipients:');
    console.log('The notification table has foreign key constraints that require:');
    console.log('- For LIBRARIAN notifications: recipientId must match a librarian.librarianId');
    console.log('- For PATRON notifications: recipientId must match a patron.patronId');

    if (librarians.length > 0) {
      console.log(`\n✅ Valid librarian ID to use: ${librarians[0].librarianId}`);
    } else {
      console.log('\n❌ No librarians found - need to create one or fix notification logic');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
