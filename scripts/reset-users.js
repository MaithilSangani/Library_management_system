const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function resetUsersDatabase() {
  try {
    console.log('🔄 Starting database user reset...');
    
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

    // Step 5: Create new sample data
    console.log('👤 Creating new admins...');
    const newAdmins = await prisma.admin.createMany({
      data: [
        {
          adminEmail: 'admin1@library.com',
          adminPassword: '$2b$10$czOQ4jxD2Wxzkm/2xRnqZOO1fSD/BOyp8xtSJkCQGuMLVurEb99PO', // hashed 'admin123'
          adminFirstName: 'John',
          adminLastName: 'Admin',
          adminOriginalPassword: 'admin123'
        },
        {
          adminEmail: 'admin2@library.com',
          adminPassword: '$2b$10$czOQ4jxD2Wxzkm/2xRnqZOO1fSD/BOyp8xtSJkCQGuMLVurEb99PO', // hashed 'admin123'
          adminFirstName: 'Sarah',
          adminLastName: 'Administrator',
          adminOriginalPassword: 'admin123'
        }
      ]
    });
    console.log(`   Created ${newAdmins.count} new admins`);

    console.log('📚 Creating new librarians...');
    const newLibrarians = await prisma.librarian.createMany({
      data: [
        {
          librarianEmail: 'librarian1@library.com',
          librarianPassword: '$2b$10$490Uq5IaZFCzmj2UbiBo4.I/0.3pRh75wOIqIMPQOzYGK8ud9Eu5y', // hashed 'librarian123'
          librarianFirstName: 'Mike',
          librarianLastName: 'Librarian',
          librarianOriginalPassword: 'librarian123'
        },
        {
          librarianEmail: 'librarian2@library.com',
          librarianPassword: '$2b$10$490Uq5IaZFCzmj2UbiBo4.I/0.3pRh75wOIqIMPQOzYGK8ud9Eu5y', // hashed 'librarian123'
          librarianFirstName: 'Emma',
          librarianLastName: 'BookKeeper',
          librarianOriginalPassword: 'librarian123'
        }
      ]
    });
    console.log(`   Created ${newLibrarians.count} new librarians`);

    console.log('👥 Creating new patrons...');
    const newPatrons = await prisma.patron.createMany({
      data: [
        {
          patronEmail: 'student1@university.edu',
          patronPassword: '$2b$10$cKN4yz8U7ryQH3zkh6jGzewpAOfVGya1K3IBRPMewa1A9.HKzH.9a', // hashed 'student123'
          patronFirstName: 'Alice',
          patronLastName: 'Johnson',
          isStudent: true,
          isFaculty: false,
          patronOriginalPassword: 'student123'
        },
        {
          patronEmail: 'student2@university.edu',
          patronPassword: '$2b$10$cKN4yz8U7ryQH3zkh6jGzewpAOfVGya1K3IBRPMewa1A9.HKzH.9a', // hashed 'student123'
          patronFirstName: 'Bob',
          patronLastName: 'Smith',
          isStudent: true,
          isFaculty: false,
          patronOriginalPassword: 'student123'
        },
        {
          patronEmail: 'faculty1@university.edu',
          patronPassword: '$2b$10$Y6a4iE7oJ32SJN9P58aX5.uKSdgF9Bv59GabNalEJOGyIK7X/KG9S', // hashed 'faculty123'
          patronFirstName: 'Dr. Carol',
          patronLastName: 'Professor',
          isStudent: false,
          isFaculty: true,
          patronOriginalPassword: 'faculty123'
        },
        {
          patronEmail: 'patron1@library.com',
          patronPassword: '$2b$10$nvPgTJpJOTBJfPyCbBCDGuqZnY8A2PxANAgB4YqARMEAgZarrnz3C', // hashed 'patron123'
          patronFirstName: 'David',
          patronLastName: 'Reader',
          isStudent: false,
          isFaculty: false,
          patronOriginalPassword: 'patron123'
        }
      ]
    });
    console.log(`   Created ${newPatrons.count} new patrons`);

    // Step 6: Create student and faculty records for the appropriate patrons
    console.log('🎓 Creating student records...');
    const students = await prisma.patron.findMany({
      where: { isStudent: true },
      orderBy: { patronId: 'asc' }
    });

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      await prisma.student.create({
        data: {
          studentDepartment: i === 0 ? 'Computer Science' : 'Mathematics',
          studentSemester: i === 0 ? 5 : 3,
          studentRollNo: 2021001 + i,
          studentEnrollmentNumber: 202100001 + i,
          patronId: student.patronId
        }
      });
    }
    console.log(`   Created ${students.length} student records`);

    console.log('👨‍🏫 Creating faculty records...');
    const faculties = await prisma.patron.findMany({
      where: { isFaculty: true },
      orderBy: { patronId: 'asc' }
    });

    for (const faculty of faculties) {
      await prisma.faculty.create({
        data: {
          facultyDepartment: 'Computer Science',
          patronId: faculty.patronId
        }
      });
    }
    console.log(`   Created ${faculties.length} faculty records`);

    // Step 7: Recreate default library settings
    console.log('⚙️ Creating default library settings...');
    const firstAdmin = await prisma.admin.findFirst({
      orderBy: { adminId: 'asc' }
    });

    await prisma.librarysettings.create({
      data: {
        librarySettingsId: 1,
        borrowingLimit: 5,
        loanPeriodDays: 14,
        finePerDay: 1.0,
        updatedByAdminId: firstAdmin?.adminId
      }
    });
    console.log('   Created default library settings');

    // Step 8: Display summary
    console.log('\n✅ Database reset completed successfully!');
    console.log('📊 Summary of new data:');
    
    const finalAdminCount = await prisma.admin.count();
    const finalLibrarianCount = await prisma.librarian.count();
    const finalPatronCount = await prisma.patron.count();
    const finalStudentCount = await prisma.student.count();
    const finalFacultyCount = await prisma.faculty.count();

    console.log(`   - Admins: ${finalAdminCount}`);
    console.log(`   - Librarians: ${finalLibrarianCount}`);
    console.log(`   - Patrons: ${finalPatronCount}`);
    console.log(`   - Students: ${finalStudentCount}`);
    console.log(`   - Faculty: ${finalFacultyCount}`);

    console.log('\n📧 New user emails created:');
    console.log('   Admins:');
    console.log('     - admin1@library.com (password: admin123)');
    console.log('     - admin2@library.com (password: admin123)');
    console.log('   Librarians:');
    console.log('     - librarian1@library.com (password: librarian123)');
    console.log('     - librarian2@library.com (password: librarian123)');
    console.log('   Patrons:');
    console.log('     - student1@university.edu (password: student123)');
    console.log('     - student2@university.edu (password: student123)');
    console.log('     - faculty1@university.edu (password: faculty123)');
    console.log('     - patron1@library.com (password: patron123)');

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
if (require.main === module) {
  resetUsersDatabase()
    .then(() => {
      console.log('🎉 User database reset completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to reset database:', error);
      process.exit(1);
    });
}

module.exports = { resetUsersDatabase };
