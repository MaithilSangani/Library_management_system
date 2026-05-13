const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleItems = [
  // Computer Science & Technology Books
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "9780262033848",
    subject: "Computer Science",
    keywords: "algorithms, data structures, programming",
    itemType: "Book",
    price: 85.00,
    imageUrl: "https://images.amazon.com/images/P/0262033844.01.L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    subject: "Software Engineering",
    keywords: "clean code, programming, best practices",
    itemType: "Book",
    price: 45.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  {
    title: "Design Patterns",
    author: "Gang of Four",
    isbn: "9780201633610",
    subject: "Software Engineering",
    keywords: "design patterns, object oriented programming",
    itemType: "Book",
    price: 60.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    isbn: "9780596517748",
    subject: "Web Development",
    keywords: "javascript, web programming, frontend",
    itemType: "Book",
    price: 35.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "GOOD"
  },
  {
    title: "React: Up & Running",
    author: "Stoyan Stefanov",
    isbn: "9781491931820",
    subject: "Web Development",
    keywords: "react, javascript, frontend, ui",
    itemType: "Book",
    price: 42.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  
  // Mathematics Books
  {
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    isbn: "9781285741550",
    subject: "Mathematics",
    keywords: "calculus, mathematics, derivatives, integrals",
    itemType: "Book",
    price: 95.00,
    imageUrl: null,
    totalCopies: 5,
    availableCopies: 5,
    condition: "EXCELLENT"
  },
  {
    title: "Linear Algebra and Its Applications",
    author: "Gilbert Strang",
    isbn: "9780030105678",
    subject: "Mathematics",
    keywords: "linear algebra, matrices, vectors",
    itemType: "Book",
    price: 75.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "GOOD"
  },
  {
    title: "Discrete Mathematics and Its Applications",
    author: "Kenneth H. Rosen",
    isbn: "9780073383095",
    subject: "Mathematics",
    keywords: "discrete mathematics, logic, graph theory",
    itemType: "Book",
    price: 88.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  
  // Physics Books
  {
    title: "University Physics with Modern Physics",
    author: "Hugh D. Young",
    isbn: "9780321973610",
    subject: "Physics",
    keywords: "physics, mechanics, thermodynamics, quantum",
    itemType: "Book",
    price: 110.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Introduction to Electrodynamics",
    author: "David J. Griffiths",
    isbn: "9780321856562",
    subject: "Physics",
    keywords: "electrodynamics, electromagnetic fields",
    itemType: "Book",
    price: 95.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  
  // Engineering Books
  {
    title: "Engineering Mechanics: Statics",
    author: "Russell C. Hibbeler",
    isbn: "9780134814971",
    subject: "Engineering",
    keywords: "statics, mechanics, engineering",
    itemType: "Book",
    price: 85.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Digital Design and Computer Architecture",
    author: "David Harris",
    isbn: "9780123944245",
    subject: "Computer Engineering",
    keywords: "digital design, computer architecture, hardware",
    itemType: "Book",
    price: 92.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  
  // Literature & Humanities
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    subject: "Literature",
    keywords: "classic literature, american literature, novel",
    itemType: "Book",
    price: 25.00,
    imageUrl: null,
    totalCopies: 6,
    availableCopies: 6,
    condition: "GOOD"
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780452284234",
    subject: "Literature",
    keywords: "dystopian, classic literature, novel",
    itemType: "Book",
    price: 22.00,
    imageUrl: null,
    totalCopies: 5,
    availableCopies: 5,
    condition: "EXCELLENT"
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    subject: "Literature",
    keywords: "classic literature, romance, novel",
    itemType: "Book",
    price: 20.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "GOOD"
  },
  
  // Business & Economics
  {
    title: "Principles of Economics",
    author: "N. Gregory Mankiw",
    isbn: "9781305585126",
    subject: "Economics",
    keywords: "economics, microeconomics, macroeconomics",
    itemType: "Book",
    price: 95.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    isbn: "9780307887894",
    subject: "Business",
    keywords: "startup, entrepreneurship, business strategy",
    itemType: "Book",
    price: 30.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  
  // Chemistry Books
  {
    title: "General Chemistry",
    author: "Darrell Ebbing",
    isbn: "9781305580343",
    subject: "Chemistry",
    keywords: "chemistry, general chemistry, chemical reactions",
    itemType: "Book",
    price: 88.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Organic Chemistry",
    author: "Paula Yurkanis Bruice",
    isbn: "9780134042282",
    subject: "Chemistry",
    keywords: "organic chemistry, chemical structures",
    itemType: "Book",
    price: 98.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  
  // Biology Books
  {
    title: "Campbell Biology",
    author: "Jane B. Reece",
    isbn: "9780134093413",
    subject: "Biology",
    keywords: "biology, life sciences, molecular biology",
    itemType: "Book",
    price: 105.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Molecular Biology of the Cell",
    author: "Bruce Alberts",
    isbn: "9780815344322",
    subject: "Biology",
    keywords: "molecular biology, cell biology, genetics",
    itemType: "Book",
    price: 115.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  
  // History Books
  {
    title: "A People's History of the United States",
    author: "Howard Zinn",
    isbn: "9780062397348",
    subject: "History",
    keywords: "american history, social history",
    itemType: "Book",
    price: 28.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "GOOD"
  },
  {
    title: "The History of Ancient Egypt",
    author: "Ian Shaw",
    isbn: "9780192854216",
    subject: "History",
    keywords: "ancient history, egypt, archaeology",
    itemType: "Book",
    price: 35.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  
  // Psychology Books
  {
    title: "Psychology: The Science of Mind and Behaviour",
    author: "Michael W. Passer",
    isbn: "9780077174415",
    subject: "Psychology",
    keywords: "psychology, cognitive psychology, behavioral science",
    itemType: "Book",
    price: 92.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    isbn: "9780374533557",
    subject: "Psychology",
    keywords: "cognitive psychology, decision making, behavioral economics",
    itemType: "Book",
    price: 32.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "GOOD"
  },
  
  // Additional Computer Science Books
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9780078022159",
    subject: "Computer Science",
    keywords: "database, sql, data management",
    itemType: "Book",
    price: 89.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Computer Networks",
    author: "Andrew S. Tanenbaum",
    isbn: "9780132126953",
    subject: "Computer Science",
    keywords: "networking, internet protocols, communication",
    itemType: "Book",
    price: 95.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9781118063330",
    subject: "Computer Science",
    keywords: "operating systems, processes, memory management",
    itemType: "Book",
    price: 92.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell",
    isbn: "9780136042594",
    subject: "Computer Science",
    keywords: "artificial intelligence, machine learning, ai",
    itemType: "Book",
    price: 98.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Python Crash Course",
    author: "Eric Matthes",
    isbn: "9781593279288",
    subject: "Programming",
    keywords: "python, programming, software development",
    itemType: "Book",
    price: 45.00,
    imageUrl: null,
    totalCopies: 5,
    availableCopies: 5,
    condition: "EXCELLENT"
  },
  
  // More Mathematics
  {
    title: "Probability and Statistics",
    author: "Morris H. DeGroot",
    isbn: "9780321500465",
    subject: "Mathematics",
    keywords: "probability, statistics, data analysis",
    itemType: "Book",
    price: 78.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "GOOD"
  },
  {
    title: "Real Analysis",
    author: "Walter Rudin",
    isbn: "9780070542341",
    subject: "Mathematics",
    keywords: "real analysis, mathematical analysis, topology",
    itemType: "Book",
    price: 85.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  
  // Additional Engineering
  {
    title: "Thermodynamics: An Engineering Approach",
    author: "Yunus A. Cengel",
    isbn: "9780077366872",
    subject: "Engineering",
    keywords: "thermodynamics, heat transfer, energy systems",
    itemType: "Book",
    price: 90.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Fundamentals of Electric Circuits",
    author: "Charles K. Alexander",
    isbn: "9780077263195",
    subject: "Electrical Engineering",
    keywords: "electric circuits, electrical engineering, electronics",
    itemType: "Book",
    price: 88.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  
  // Reference Materials
  {
    title: "The Oxford English Dictionary",
    author: "Oxford University Press",
    isbn: "9780198611868",
    subject: "Reference",
    keywords: "dictionary, english language, reference",
    itemType: "Reference",
    price: 150.00,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  },
  {
    title: "Encyclopedia Britannica Volume 1",
    author: "Encyclopedia Britannica Inc.",
    isbn: "9780852297704",
    subject: "Reference",
    keywords: "encyclopedia, general knowledge, reference",
    itemType: "Reference",
    price: 200.00,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "GOOD"
  },
  
  // Journals
  {
    title: "Nature Journal - Current Issue",
    author: "Nature Publishing Group",
    isbn: null,
    subject: "Science",
    keywords: "scientific journal, research, peer reviewed",
    itemType: "Journal",
    price: 15.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "IEEE Computer Magazine",
    author: "IEEE Computer Society",
    isbn: null,
    subject: "Computer Science",
    keywords: "computer science, technology, ieee",
    itemType: "Magazine",
    price: 12.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  
  // DVDs/Media
  {
    title: "Introduction to Computer Science - MIT OpenCourseWare",
    author: "MIT",
    isbn: null,
    subject: "Computer Science",
    keywords: "computer science, programming, lectures",
    itemType: "DVD",
    price: 25.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Calculus Video Lectures Series",
    author: "Khan Academy",
    isbn: null,
    subject: "Mathematics",
    keywords: "calculus, mathematics, video lectures",
    itemType: "DVD",
    price: 30.00,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "GOOD"
  },
  
  // More Literature
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    subject: "Literature",
    keywords: "american literature, classic, novel",
    itemType: "Book",
    price: 18.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "GOOD"
  },
  {
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    isbn: "9780060883287",
    subject: "Literature",
    keywords: "magical realism, latin american literature",
    itemType: "Book",
    price: 24.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  
  // Philosophy
  {
    title: "The Republic",
    author: "Plato",
    isbn: "9780140455113",
    subject: "Philosophy",
    keywords: "philosophy, political theory, ancient philosophy",
    itemType: "Book",
    price: 20.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "GOOD"
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    isbn: "9780486298238",
    subject: "Philosophy",
    keywords: "stoicism, philosophy, ancient wisdom",
    itemType: "Book",
    price: 15.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  
  // Additional Science
  {
    title: "Cosmos",
    author: "Carl Sagan",
    isbn: "9780345331359",
    subject: "Astronomy",
    keywords: "astronomy, cosmology, science popularization",
    itemType: "Book",
    price: 28.00,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "GOOD"
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    subject: "Physics",
    keywords: "cosmology, black holes, theoretical physics",
    itemType: "Book",
    price: 26.00,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  
  // Final additions to reach 50
  {
    title: "The Art of Computer Programming, Volume 1",
    author: "Donald E. Knuth",
    isbn: "9780201896831",
    subject: "Computer Science",
    keywords: "algorithms, programming, computer science theory",
    itemType: "Book",
    price: 65.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Structure and Interpretation of Computer Programs",
    author: "Harold Abelson",
    isbn: "9780262510875",
    subject: "Computer Science",
    keywords: "programming, computer science, scheme, lisp",
    itemType: "Book",
    price: 55.00,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  }
];

async function seedItems() {
  try {
    console.log('Starting to seed items...');
    
    // First, let's check if there are any existing items
    const existingItemsCount = await prisma.item.count();
    console.log(`Found ${existingItemsCount} existing items in the database.`);
    
    // Add all sample items
    let addedCount = 0;
    for (const item of sampleItems) {
      try {
        // Check if item with same ISBN already exists (skip if it does)
        if (item.isbn) {
          const existing = await prisma.item.findUnique({
            where: { isbn: item.isbn }
          });
          if (existing) {
            console.log(`Skipping "${item.title}" - ISBN already exists`);
            continue;
          }
        }
        
        await prisma.item.create({
          data: {
            ...item,
            isVisible: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        addedCount++;
        console.log(`Added: ${item.title} by ${item.author}`);
        
      } catch (error) {
        console.error(`Error adding "${item.title}":`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully added ${addedCount} items to the database!`);
    console.log(`Total items in database: ${existingItemsCount + addedCount}`);
    
  } catch (error) {
    console.error('Error seeding items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedItems();
