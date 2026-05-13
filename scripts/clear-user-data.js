const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearUserData() {
  try {
    console.log('🗑️  Starting to clear all user data...');
    
    // Clear data in the correct order due to foreign key constraints
    
    // 1. Clear transactions (references patrons)
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.count} transactions`);
    
    // 2. Clear reservations (references patrons)
    const deletedReservations = await prisma.reservation.deleteMany({});
    console.log(`✅ Deleted ${deletedReservations.count} reservations`);
    
    // 4. Clear student records (references patrons)
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`✅ Deleted ${deletedStudents.count} student records`);
    
    // 5. Clear faculty records (references patrons)
    const deletedFaculty = await prisma.faculty.deleteMany({});
    console.log(`✅ Deleted ${deletedFaculty.count} faculty records`);
    
    // 6. Clear library settings (references admin)
    const deletedSettings = await prisma.librarysettings.deleteMany({});
    console.log(`✅ Deleted ${deletedSettings.count} library settings`);
    
    // 7. Clear all patrons
    const deletedPatrons = await prisma.patron.deleteMany({});
    console.log(`✅ Deleted ${deletedPatrons.count} patrons`);
    
    // 8. Clear all librarians
    const deletedLibrarians = await prisma.librarian.deleteMany({});
    console.log(`✅ Deleted ${deletedLibrarians.count} librarians`);
    
    // 9. Clear all admins
    const deletedAdmins = await prisma.admin.deleteMany({});
    console.log(`✅ Deleted ${deletedAdmins.count} admins`);
    
    console.log('\n🎉 All user data has been successfully cleared from the database!');
    console.log('\n📊 Summary:');
    console.log(`   - Admins: ${deletedAdmins.count}`);
    console.log(`   - Librarians: ${deletedLibrarians.count}`);
    console.log(`   - Patrons: ${deletedPatrons.count}`);
    console.log(`   - Student records: ${deletedStudents.count}`);
    console.log(`   - Faculty records: ${deletedFaculty.count}`);
    console.log(`   - Transactions: ${deletedTransactions.count}`);
    console.log(`   - Reservations: ${deletedReservations.count}`);
    console.log(`   - Library settings: ${deletedSettings.count}`);
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearUserData();
