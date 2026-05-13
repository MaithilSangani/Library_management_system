const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLibrarians() {
  try {
    const librarians = await prisma.librarian.findMany();
    console.log(`Found ${librarians.length} librarians:`);
    librarians.forEach(librarian => {
      console.log(`- ID: ${librarian.librarianId}, Email: ${librarian.librarianEmail}, Name: ${librarian.librarianFirstName} ${librarian.librarianLastName}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLibrarians();
