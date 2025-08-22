import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.admin.upsert({
    where: { adminEmail: 'admin@library.com' },
    update: {},
    create: {
      adminEmail: 'admin@library.com',
      adminPassword: hashedAdminPassword,
      adminFirstName: 'System',
      adminLastName: 'Administrator',
      adminOriginalPassword: 'admin123', // DEV ONLY
    },
  });

  // Create librarian user
  const hashedLibrarianPassword = await bcrypt.hash('librarian123', 12);
  const librarian = await prisma.librarian.upsert({
    where: { librarianEmail: 'librarian@library.com' },
    update: {},
    create: {
      librarianEmail: 'librarian@library.com',
      librarianPassword: hashedLibrarianPassword,
      librarianFirstName: 'Head',
      librarianLastName: 'Librarian',
      librarianOriginalPassword: 'librarian123', // DEV ONLY
    },
  });

  // Create regular patron user
  const hashedPatronPassword = await bcrypt.hash('user123', 12);
  const patron = await prisma.patron.upsert({
    where: { patronEmail: 'user@library.com' },
    update: {},
    create: {
      patronEmail: 'user@library.com',
      patronPassword: hashedPatronPassword,
      patronFirstName: 'John',
      patronLastName: 'Doe',
      patronOriginalPassword: 'user123', // DEV ONLY
      isStudent: false,
      isFaculty: false,
    },
  });

  // Create student user
  const hashedStudentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.patron.upsert({
    where: { patronEmail: 'student@library.com' },
    update: {},
    create: {
      patronEmail: 'student@library.com',
      patronPassword: hashedStudentPassword,
      patronFirstName: 'Sarah',
      patronLastName: 'Johnson',
      patronOriginalPassword: 'student123', // DEV ONLY
      isStudent: true,
      isFaculty: false,
    },
  });

  // Create faculty user
  const hashedFacultyPassword = await bcrypt.hash('faculty123', 12);
  const faculty = await prisma.patron.upsert({
    where: { patronEmail: 'faculty@library.com' },
    update: {},
    create: {
      patronEmail: 'faculty@library.com',
      patronPassword: hashedFacultyPassword,
      patronFirstName: 'Dr. Robert',
      patronLastName: 'Smith',
      patronOriginalPassword: 'faculty123', // DEV ONLY
      isStudent: false,
      isFaculty: true,
    },
  });

  // Create library settings if they don't exist
  const existingSettings = await prisma.librarysettings.findFirst();
  if (!existingSettings) {
    await prisma.librarysettings.create({
      data: {
        borrowingLimit: 5,
        loanPeriodDays: 14,
        finePerDay: 1.0,
        updatedByAdminId: admin.adminId,
      },
    });
  }

  // Create some sample books
  await prisma.item.upsert({
    where: { isbn: '9780743273565' },
    update: {},
    create: {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      subject: 'Fiction',
      keywords: 'classic, american, literature',
      itemType: 'Book',
      price: 12.99,
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780446310789' },
    update: {},
    create: {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780446310789',
      subject: 'Fiction',
      keywords: 'classic, drama, social issues',
      itemType: 'Book',
      price: 14.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780262033848' },
    update: {},
    create: {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '9780262033848',
      subject: 'Computer Science',
      keywords: 'algorithms, computer science, programming',
      itemType: 'Book',
      price: 89.99,
      totalCopies: 5,
      availableCopies: 5,
    },
  });

  // Fiction Books
  await prisma.item.upsert({
    where: { isbn: '9780061120084' },
    update: {},
    create: {
      title: 'Brave New World',
      author: 'Aldous Huxley',
      isbn: '9780061120084',
      subject: 'Fiction',
      keywords: 'dystopian, science fiction, classic',
      itemType: 'Book',
      price: 15.99,
      totalCopies: 4,
      availableCopies: 4,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780451524935' },
    update: {},
    create: {
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      subject: 'Fiction',
      keywords: 'dystopian, political, surveillance',
      itemType: 'Book',
      price: 13.99,
      totalCopies: 6,
      availableCopies: 5,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780553380163' },
    update: {},
    create: {
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      subject: 'Physics',
      keywords: 'cosmology, black holes, universe',
      itemType: 'Book',
      price: 18.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780307387899' },
    update: {},
    create: {
      title: 'The Road',
      author: 'Cormac McCarthy',
      isbn: '9780307387899',
      subject: 'Fiction',
      keywords: 'post-apocalyptic, pulitzer prize, survival',
      itemType: 'Book',
      price: 16.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780544003415' },
    update: {},
    create: {
      title: 'The Lord of the Rings',
      author: 'J.R.R. Tolkien',
      isbn: '9780544003415',
      subject: 'Fantasy',
      keywords: 'fantasy, epic, middle-earth',
      itemType: 'Book',
      price: 25.99,
      totalCopies: 4,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780553103540' },
    update: {},
    create: {
      title: 'A Game of Thrones',
      author: 'George R.R. Martin',
      isbn: '9780553103540',
      subject: 'Fantasy',
      keywords: 'fantasy, political intrigue, dragons',
      itemType: 'Book',
      price: 22.99,
      totalCopies: 3,
      availableCopies: 2,
    },
  });

  // Science & Technology
  await prisma.item.upsert({
    where: { isbn: '9780134685991' },
    update: {},
    create: {
      title: 'Effective Java',
      author: 'Joshua Bloch',
      isbn: '9780134685991',
      subject: 'Computer Science',
      keywords: 'java, programming, best practices',
      itemType: 'Book',
      price: 52.99,
      totalCopies: 4,
      availableCopies: 4,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9781449331818' },
    update: {},
    create: {
      title: 'Learning React',
      author: 'Alex Banks',
      isbn: '9781449331818',
      subject: 'Computer Science',
      keywords: 'react, javascript, web development',
      itemType: 'Book',
      price: 44.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780321751041' },
    update: {},
    create: {
      title: 'Don\'t Make Me Think',
      author: 'Steve Krug',
      isbn: '9780321751041',
      subject: 'Design',
      keywords: 'usability, web design, user experience',
      itemType: 'Book',
      price: 39.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780596517748' },
    update: {},
    create: {
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      isbn: '9780596517748',
      subject: 'Computer Science',
      keywords: 'javascript, programming, web development',
      itemType: 'Book',
      price: 35.99,
      totalCopies: 5,
      availableCopies: 4,
    },
  });

  // History & Biography
  await prisma.item.upsert({
    where: { isbn: '9780345476098' },
    update: {},
    create: {
      title: 'The Guns of August',
      author: 'Barbara Tuchman',
      isbn: '9780345476098',
      subject: 'History',
      keywords: 'world war, history, military',
      itemType: 'Book',
      price: 17.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780385504201' },
    update: {},
    create: {
      title: 'The Da Vinci Code',
      author: 'Dan Brown',
      isbn: '9780385504201',
      subject: 'Mystery',
      keywords: 'mystery, thriller, religious',
      itemType: 'Book',
      price: 19.99,
      totalCopies: 4,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780307588371' },
    update: {},
    create: {
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      isbn: '9780307588371',
      subject: 'Mystery',
      keywords: 'psychological thriller, mystery, marriage',
      itemType: 'Book',
      price: 16.99,
      totalCopies: 3,
      availableCopies: 2,
    },
  });

  // Mathematics & Science
  await prisma.item.upsert({
    where: { isbn: '9780691177013' },
    update: {},
    create: {
      title: 'Calculus: Early Transcendentals',
      author: 'James Stewart',
      isbn: '9780691177013',
      subject: 'Mathematics',
      keywords: 'calculus, mathematics, derivatives',
      itemType: 'Book',
      price: 299.99,
      totalCopies: 8,
      availableCopies: 6,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780134093413' },
    update: {},
    create: {
      title: 'Campbell Biology',
      author: 'Jane B. Reece',
      isbn: '9780134093413',
      subject: 'Biology',
      keywords: 'biology, life sciences, cellular',
      itemType: 'Book',
      price: 349.99,
      totalCopies: 6,
      availableCopies: 5,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9781118230725' },
    update: {},
    create: {
      title: 'Principles of Chemistry',
      author: 'Peter Atkins',
      isbn: '9781118230725',
      subject: 'Chemistry',
      keywords: 'chemistry, molecular, reactions',
      itemType: 'Book',
      price: 279.99,
      totalCopies: 4,
      availableCopies: 4,
    },
  });

  // Business & Economics
  await prisma.item.upsert({
    where: { isbn: '9780307887894' },
    update: {},
    create: {
      title: 'The Lean Startup',
      author: 'Eric Ries',
      isbn: '9780307887894',
      subject: 'Business',
      keywords: 'startup, entrepreneurship, innovation',
      itemType: 'Book',
      price: 28.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780060833459' },
    update: {},
    create: {
      title: 'Good to Great',
      author: 'Jim Collins',
      isbn: '9780060833459',
      subject: 'Business',
      keywords: 'leadership, management, companies',
      itemType: 'Book',
      price: 29.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780735611313' },
    update: {},
    create: {
      title: 'Code Complete',
      author: 'Steve McConnell',
      isbn: '9780735611313',
      subject: 'Computer Science',
      keywords: 'software development, programming, best practices',
      itemType: 'Book',
      price: 49.99,
      totalCopies: 4,
      availableCopies: 4,
    },
  });

  // Philosophy & Psychology
  await prisma.item.upsert({
    where: { isbn: '9780679783268' },
    update: {},
    create: {
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      isbn: '9780679783268',
      subject: 'History',
      keywords: 'human history, evolution, civilization',
      itemType: 'Book',
      price: 21.99,
      totalCopies: 5,
      availableCopies: 4,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780143127741' },
    update: {},
    create: {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      isbn: '9780143127741',
      subject: 'Psychology',
      keywords: 'psychology, decision making, behavioral economics',
      itemType: 'Book',
      price: 18.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  // Literature & Classics
  await prisma.item.upsert({
    where: { isbn: '9780486284729' },
    update: {},
    create: {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '9780486284729',
      subject: 'Literature',
      keywords: 'romance, classic, british literature',
      itemType: 'Book',
      price: 12.99,
      totalCopies: 4,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780486411095' },
    update: {},
    create: {
      title: 'Jane Eyre',
      author: 'Charlotte Bronte',
      isbn: '9780486411095',
      subject: 'Literature',
      keywords: 'gothic, romance, victorian',
      itemType: 'Book',
      price: 11.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780486280615' },
    update: {},
    create: {
      title: 'The Adventures of Sherlock Holmes',
      author: 'Arthur Conan Doyle',
      isbn: '9780486280615',
      subject: 'Mystery',
      keywords: 'detective, mystery, victorian',
      itemType: 'Book',
      price: 9.99,
      totalCopies: 5,
      availableCopies: 4,
    },
  });

  // Contemporary Fiction
  await prisma.item.upsert({
    where: { isbn: '9780385537859' },
    update: {},
    create: {
      title: 'The Fault in Our Stars',
      author: 'John Green',
      isbn: '9780385537859',
      subject: 'Young Adult',
      keywords: 'romance, cancer, coming of age',
      itemType: 'Book',
      price: 14.99,
      totalCopies: 6,
      availableCopies: 5,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780439708180' },
    update: {},
    create: {
      title: 'Harry Potter and the Sorcerer\'s Stone',
      author: 'J.K. Rowling',
      isbn: '9780439708180',
      subject: 'Fantasy',
      keywords: 'magic, wizards, coming of age',
      itemType: 'Book',
      price: 8.99,
      totalCopies: 8,
      availableCopies: 6,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780062315007' },
    update: {},
    create: {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '9780062315007',
      subject: 'Philosophy',
      keywords: 'spiritual, journey, dreams',
      itemType: 'Book',
      price: 14.99,
      totalCopies: 4,
      availableCopies: 3,
    },
  });

  // Academic Textbooks
  await prisma.item.upsert({
    where: { isbn: '9780134197005' },
    update: {},
    create: {
      title: 'Microeconomics',
      author: 'Robert Pindyck',
      isbn: '9780134197005',
      subject: 'Economics',
      keywords: 'economics, market, supply demand',
      itemType: 'Book',
      price: 289.99,
      totalCopies: 5,
      availableCopies: 4,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780134609034' },
    update: {},
    create: {
      title: 'Introduction to Statistical Learning',
      author: 'Gareth James',
      isbn: '9780134609034',
      subject: 'Statistics',
      keywords: 'statistics, machine learning, data science',
      itemType: 'Book',
      price: 89.99,
      totalCopies: 6,
      availableCopies: 5,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780321570567' },
    update: {},
    create: {
      title: 'Linear Algebra and Its Applications',
      author: 'David Lay',
      isbn: '9780321570567',
      subject: 'Mathematics',
      keywords: 'linear algebra, matrices, vectors',
      itemType: 'Book',
      price: 259.99,
      totalCopies: 7,
      availableCopies: 6,
    },
  });

  // Self-Help & Development
  await prisma.item.upsert({
    where: { isbn: '9781501144318' },
    update: {},
    create: {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '9781501144318',
      subject: 'Self-Help',
      keywords: 'habits, productivity, self-improvement',
      itemType: 'Book',
      price: 18.99,
      totalCopies: 4,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9781476726991' },
    update: {},
    create: {
      title: 'The 7 Habits of Highly Effective People',
      author: 'Stephen Covey',
      isbn: '9781476726991',
      subject: 'Self-Help',
      keywords: 'leadership, effectiveness, personal development',
      itemType: 'Book',
      price: 16.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  // Science Fiction & Horror
  await prisma.item.upsert({
    where: { isbn: '9780441172719' },
    update: {},
    create: {
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      subject: 'Science Fiction',
      keywords: 'space opera, desert planet, politics',
      itemType: 'Book',
      price: 19.99,
      totalCopies: 3,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780307950888' },
    update: {},
    create: {
      title: 'The Stand',
      author: 'Stephen King',
      isbn: '9780307950888',
      subject: 'Horror',
      keywords: 'post-apocalyptic, plague, good vs evil',
      itemType: 'Book',
      price: 22.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  // Art & Design
  await prisma.item.upsert({
    where: { isbn: '9780500203077' },
    update: {},
    create: {
      title: 'Ways of Seeing',
      author: 'John Berger',
      isbn: '9780500203077',
      subject: 'Art',
      keywords: 'art criticism, visual culture, perception',
      itemType: 'Book',
      price: 16.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780465050659' },
    update: {},
    create: {
      title: 'The Design of Everyday Things',
      author: 'Don Norman',
      isbn: '9780465050659',
      subject: 'Design',
      keywords: 'design, usability, user experience',
      itemType: 'Book',
      price: 24.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  // Health & Medicine
  await prisma.item.upsert({
    where: { isbn: '9781439046098' },
    update: {},
    create: {
      title: 'Gray\'s Anatomy',
      author: 'Henry Gray',
      isbn: '9781439046098',
      subject: 'Medicine',
      keywords: 'anatomy, medical, human body',
      itemType: 'Book',
      price: 199.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  // Environmental Science
  await prisma.item.upsert({
    where: { isbn: '9780547928425' },
    update: {},
    create: {
      title: 'Silent Spring',
      author: 'Rachel Carson',
      isbn: '9780547928425',
      subject: 'Environmental Science',
      keywords: 'environment, pesticides, ecology',
      itemType: 'Book',
      price: 15.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  // Reference Books
  await prisma.item.upsert({
    where: { isbn: '9780199571123' },
    update: {},
    create: {
      title: 'Oxford English Dictionary',
      author: 'Oxford University Press',
      isbn: '9780199571123',
      subject: 'Reference',
      keywords: 'dictionary, english language, reference',
      itemType: 'Reference Book',
      price: 150.00,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  // DVDs & Digital Media
  await prisma.item.upsert({
    where: { isbn: 'DVD001' },
    update: {},
    create: {
      title: 'Planet Earth Documentary Series',
      author: 'BBC',
      isbn: 'DVD001',
      subject: 'Documentary',
      keywords: 'nature, wildlife, documentary',
      itemType: 'DVD',
      price: 39.99,
      totalCopies: 2,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: 'DVD002' },
    update: {},
    create: {
      title: 'TED Talks: Technology',
      author: 'TED',
      isbn: 'DVD002',
      subject: 'Technology',
      keywords: 'technology, innovation, presentations',
      itemType: 'DVD',
      price: 24.99,
      totalCopies: 3,
      availableCopies: 3,
    },
  });

  // Journals & Magazines
  await prisma.item.upsert({
    where: { isbn: 'MAG001' },
    update: {},
    create: {
      title: 'Scientific American - Annual Collection',
      author: 'Scientific American',
      isbn: 'MAG001',
      subject: 'Science',
      keywords: 'science, research, discoveries',
      itemType: 'Magazine',
      price: 59.99,
      totalCopies: 1,
      availableCopies: 1,
    },
  });

  await prisma.item.upsert({
    where: { isbn: 'MAG002' },
    update: {},
    create: {
      title: 'National Geographic - Annual Collection',
      author: 'National Geographic',
      isbn: 'MAG002',
      subject: 'Geography',
      keywords: 'geography, travel, culture, nature',
      itemType: 'Magazine',
      price: 49.99,
      totalCopies: 1,
      availableCopies: 1,
    },
  });

  // Additional Popular Books
  await prisma.item.upsert({
    where: { isbn: '9780545010221' },
    update: {},
    create: {
      title: 'The Hunger Games',
      author: 'Suzanne Collins',
      isbn: '9780545010221',
      subject: 'Young Adult',
      keywords: 'dystopian, survival, rebellion',
      itemType: 'Book',
      price: 13.99,
      totalCopies: 5,
      availableCopies: 4,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780316015844' },
    update: {},
    create: {
      title: 'Twilight',
      author: 'Stephenie Meyer',
      isbn: '9780316015844',
      subject: 'Young Adult',
      keywords: 'vampire, romance, fantasy',
      itemType: 'Book',
      price: 12.99,
      totalCopies: 4,
      availableCopies: 3,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780525478812' },
    update: {},
    create: {
      title: 'The Seven Husbands of Evelyn Hugo',
      author: 'Taylor Jenkins Reid',
      isbn: '9780525478812',
      subject: 'Contemporary Fiction',
      keywords: 'hollywood, secrets, lgbtq',
      itemType: 'Book',
      price: 17.99,
      totalCopies: 3,
      availableCopies: 2,
    },
  });

  await prisma.item.upsert({
    where: { isbn: '9780156012195' },
    update: {},
    create: {
      title: 'The Little Prince',
      author: 'Antoine de Saint-Exupéry',
      isbn: '9780156012195',
      subject: 'Children\'s Literature',
      keywords: 'philosophy, children, classic',
      itemType: 'Book',
      price: 10.99,
      totalCopies: 6,
      availableCopies: 5,
    },
  });

  console.log('\n📚 Library Items Summary:');
  const itemCount = await prisma.item.count();
  console.log(`Total items in library: ${itemCount}`);
  console.log('\nCategories added:');
  console.log('📖 Fiction & Literature');
  console.log('💻 Computer Science & Technology');
  console.log('🔬 Science & Mathematics');
  console.log('💼 Business & Economics');
  console.log('🧠 Psychology & Philosophy');
  console.log('📚 Academic Textbooks');
  console.log('🎯 Self-Help & Development');
  console.log('🎬 DVDs & Digital Media');
  console.log('📰 Magazines & Journals');
  console.log('📖 Reference Materials');

  console.log('Database seeded successfully!');
  console.log('Demo accounts created:');
  console.log('Admin: admin@library.com / admin123');
  console.log('Librarian: librarian@library.com / librarian123');
  console.log('User (Regular): user@library.com / user123');
  console.log('Student: student@library.com / student123');
  console.log('Faculty: faculty@library.com / faculty123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
