const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('🔄 Starting complete user deletion...');
    
    // Step 1: Delete all data with foreign key dependencies first
    console.log('🗑️ Deleting transactions...');
    const transactionCount = await prisma.transaction.deleteMany({});
    console.log(`   Deleted ${transactionCount.count} transactions`);

    console.log('🗑️ Deleting reservations...');
    const reservationCount = await prisma.reservation.deleteMany({});
    console.log(`   Deleted ${reservationCount.count} reservations`);

    console.log('🗑️ Deleting students...');
    const studentCount = await prisma.student.deleteMany({});
    console.log(`   Deleted ${studentCount.count} students`);

    console.log('🗑️ Deleting faculty...');
    const facultyCount = await prisma.faculty.deleteMany({});
    console.log(`   Deleted ${facultyCount.count} faculty`);

    // Step 2: Delete library settings (references admin)
    console.log('🗑️ Deleting library settings...');
    const settingsCount = await prisma.librarysettings.deleteMany({});
    console.log(`   Deleted ${settingsCount.count} library settings`);

    // Step 3: Delete all patrons, admins, and librarians
    console.log('🗑️ Deleting all patrons...');
    const patronCount = await prisma.patron.deleteMany({});
    console.log(`   Deleted ${patronCount.count} patrons`);

    console.log('🗑️ Deleting all admins...');
    const adminCount = await prisma.admin.deleteMany({});
    console.log(`   Deleted ${adminCount.count} admins`);

    console.log('🗑️ Deleting all librarians...');
    const librarianCount = await prisma.librarian.deleteMany({});
    console.log(`   Deleted ${librarianCount.count} librarians`);

    // Step 4: Reset auto-increment counters using raw SQL
    console.log('🔄 Resetting auto-increment counters...');
    await prisma.$executeRaw`ALTER TABLE patron AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE admin AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE librarian AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE student AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE faculty AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE transaction AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE reservation AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE librarysettings AUTO_INCREMENT = 1`;
    console.log('   Auto-increment counters reset');

    // Step 5: Verify deletion
    console.log('\n📊 Verifying deletion results:');
    const finalAdminCount = await prisma.admin.count();
    const finalLibrarianCount = await prisma.librarian.count();
    const finalPatronCount = await prisma.patron.count();
    const finalStudentCount = await prisma.student.count();
    const finalFacultyCount = await prisma.faculty.count();
    const finalTransactionCount = await prisma.transaction.count();
    const finalReservationCount = await prisma.reservation.count();
    const finalSettingsCount = await prisma.librarysettings.count();

    console.log(`   - Admins: ${finalAdminCount}`);
    console.log(`   - Librarians: ${finalLibrarianCount}`);
    console.log(`   - Patrons: ${finalPatronCount}`);
    console.log(`   - Students: ${finalStudentCount}`);
    console.log(`   - Faculty: ${finalFacultyCount}`);
    console.log(`   - Transactions: ${finalTransactionCount}`);
    console.log(`   - Reservations: ${finalReservationCount}`);
    console.log(`   - Library Settings: ${finalSettingsCount}`);

    console.log('\n✅ All user data has been completely deleted!');
    console.log('💡 Database is now empty of all users and related data.');
    console.log('   You can now add new users and they will start with ID 1.');

  } catch (error) {
    console.error('❌ Error during user deletion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
if (require.main === module) {
  deleteAllUsers()
    .then(() => {
      console.log('🎉 User deletion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to delete users:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllUsers };
