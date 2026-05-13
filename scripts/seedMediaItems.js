const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mediaItems = [
  // Magazines
  {
    title: "National Geographic Magazine - December 2024",
    author: "National Geographic Society",
    isbn: null,
    subject: "Geography",
    keywords: "geography, nature, wildlife, science, exploration",
    itemType: "Magazine",
    price: 8.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Scientific American - Current Issue",
    author: "Scientific American",
    isbn: null,
    subject: "Science",
    keywords: "science, research, technology, physics, biology",
    itemType: "Magazine",
    price: 9.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Time Magazine - Latest Edition",
    author: "Time Inc.",
    isbn: null,
    subject: "Current Affairs",
    keywords: "news, politics, world affairs, current events",
    itemType: "Magazine",
    price: 6.99,
    imageUrl: null,
    totalCopies: 5,
    availableCopies: 5,
    condition: "EXCELLENT"
  },
  {
    title: "Harvard Business Review - Monthly",
    author: "Harvard Business Publishing",
    isbn: null,
    subject: "Business",
    keywords: "business, management, strategy, leadership, innovation",
    itemType: "Magazine",
    price: 12.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Wired Magazine - Technology Issue",
    author: "Condé Nast",
    isbn: null,
    subject: "Technology",
    keywords: "technology, innovation, gadgets, digital culture",
    itemType: "Magazine",
    price: 7.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "IEEE Spectrum - Engineering Magazine",
    author: "IEEE",
    isbn: null,
    subject: "Engineering",
    keywords: "engineering, electrical engineering, technology trends",
    itemType: "Magazine",
    price: 10.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // DVDs - Educational
  {
    title: "The Blue Planet - BBC Documentary Series",
    author: "BBC Natural History Unit",
    isbn: null,
    subject: "Marine Biology",
    keywords: "ocean, marine life, documentary, nature, david attenborough",
    itemType: "DVD",
    price: 29.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Cosmos: A Space-Time Odyssey",
    author: "Neil deGrasse Tyson",
    isbn: null,
    subject: "Astronomy",
    keywords: "space, cosmos, science, astronomy, documentary",
    itemType: "DVD",
    price: 39.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Planet Earth II - Complete Series",
    author: "BBC",
    isbn: null,
    subject: "Biology",
    keywords: "wildlife, nature, documentary, animals, ecology",
    itemType: "DVD",
    price: 34.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "The History of Mathematics - Documentary",
    author: "Educational Broadcasting",
    isbn: null,
    subject: "Mathematics",
    keywords: "mathematics, history, education, documentary",
    itemType: "DVD",
    price: 24.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "GOOD"
  },
  {
    title: "Shakespeare's Globe Theatre Collection",
    author: "Shakespeare's Globe",
    isbn: null,
    subject: "Literature",
    keywords: "shakespeare, theatre, drama, performance, literature",
    itemType: "DVD",
    price: 45.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  },

  // CDs - Educational Audio
  {
    title: "Introduction to Philosophy - Audio Lectures",
    author: "Prof. Michael Sandel",
    isbn: null,
    subject: "Philosophy",
    keywords: "philosophy, ethics, moral philosophy, lectures",
    itemType: "CD",
    price: 19.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Classical Music Masterpieces Collection",
    author: "Various Artists",
    isbn: null,
    subject: "Music",
    keywords: "classical music, orchestra, symphonies, composers",
    itemType: "CD",
    price: 22.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "World History Audio Course",
    author: "The Teaching Company",
    isbn: null,
    subject: "History",
    keywords: "world history, audio course, civilization, culture",
    itemType: "CD",
    price: 35.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },
  {
    title: "Language Learning - Spanish Fundamentals",
    author: "Berlitz",
    isbn: null,
    subject: "Language",
    keywords: "spanish, language learning, audio course, pronunciation",
    itemType: "CD",
    price: 28.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },

  // Newspapers
  {
    title: "The Wall Street Journal - Daily Edition",
    author: "Dow Jones & Company",
    isbn: null,
    subject: "Business",
    keywords: "business news, finance, economics, stock market",
    itemType: "Newspaper",
    price: 3.99,
    imageUrl: null,
    totalCopies: 5,
    availableCopies: 5,
    condition: "EXCELLENT"
  },
  {
    title: "The New York Times - Sunday Edition",
    author: "The New York Times Company",
    isbn: null,
    subject: "News",
    keywords: "news, politics, culture, science, opinion",
    itemType: "Newspaper",
    price: 4.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },

  // Maps and Atlases
  {
    title: "World Atlas - 2024 Edition",
    author: "National Geographic",
    isbn: "9781426222665",
    subject: "Geography",
    keywords: "atlas, world map, geography, countries, continents",
    itemType: "Atlas",
    price: 49.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Historical Atlas of World War II",
    author: "Oxford University Press",
    isbn: "9780195221695",
    subject: "History",
    keywords: "world war ii, military history, maps, battles",
    itemType: "Atlas",
    price: 39.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "GOOD"
  },

  // Technical Manuals
  {
    title: "Arduino Programming Manual",
    author: "Arduino Community",
    isbn: null,
    subject: "Electronics",
    keywords: "arduino, programming, electronics, microcontroller, diy",
    itemType: "Manual",
    price: 24.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Raspberry Pi User Guide",
    author: "Eben Upton",
    isbn: "9781119264361",
    subject: "Computer Science",
    keywords: "raspberry pi, programming, linux, embedded systems",
    itemType: "Manual",
    price: 22.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // Journals - Academic
  {
    title: "Journal of Computer Science Research",
    author: "ACM Press",
    isbn: null,
    subject: "Computer Science",
    keywords: "computer science, research, algorithms, software engineering",
    itemType: "Journal",
    price: 18.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "International Journal of Mathematics",
    author: "Mathematical Society",
    isbn: null,
    subject: "Mathematics",
    keywords: "mathematics, research, pure mathematics, applied mathematics",
    itemType: "Journal",
    price: 16.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Physics Today Magazine",
    author: "American Institute of Physics",
    isbn: null,
    subject: "Physics",
    keywords: "physics, research, quantum physics, theoretical physics",
    itemType: "Magazine",
    price: 14.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },

  // Software and Digital Media
  {
    title: "Adobe Creative Suite Training DVD",
    author: "Adobe Systems",
    isbn: null,
    subject: "Digital Design",
    keywords: "adobe, photoshop, illustrator, design, creative suite",
    itemType: "DVD",
    price: 79.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  },
  {
    title: "Microsoft Office 365 Training Collection",
    author: "Microsoft Corporation",
    isbn: null,
    subject: "Computer Applications",
    keywords: "microsoft office, excel, word, powerpoint, training",
    itemType: "DVD",
    price: 59.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // Art and Culture
  {
    title: "Louvre Museum Virtual Tour",
    author: "Musée du Louvre",
    isbn: null,
    subject: "Art History",
    keywords: "louvre, art, museum, virtual tour, masterpieces",
    itemType: "DVD",
    price: 24.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  },
  {
    title: "Jazz History - Audio Documentary",
    author: "Ken Burns",
    isbn: null,
    subject: "Music History",
    keywords: "jazz, music history, documentary, american culture",
    itemType: "CD",
    price: 32.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "GOOD"
  },

  // Language Learning Materials
  {
    title: "French Conversation Practice - Audio Course",
    author: "Berlitz Language Centers",
    isbn: null,
    subject: "Language",
    keywords: "french, conversation, language learning, pronunciation",
    itemType: "CD",
    price: 26.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "German Language Fundamentals",
    author: "Rosetta Stone",
    isbn: null,
    subject: "Language",
    keywords: "german, language learning, grammar, vocabulary",
    itemType: "CD",
    price: 29.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // Special Collections
  {
    title: "Rare Manuscripts Collection - Digital Archive",
    author: "University Library",
    isbn: null,
    subject: "History",
    keywords: "manuscripts, rare books, historical documents, archive",
    itemType: "DVD",
    price: 99.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  }
];

async function seedMediaItems() {
  try {
    console.log('Starting to seed media items (magazines, DVDs, CDs, etc.)...');
    
    // Check current item count
    const existingItemsCount = await prisma.item.count();
    console.log(`Found ${existingItemsCount} existing items in the database.`);
    
    // Add all media items
    let addedCount = 0;
    for (const item of mediaItems) {
      try {
        // Check if item with same title and author already exists
        const existing = await prisma.item.findFirst({
          where: { 
            AND: [
              { title: item.title },
              { author: item.author }
            ]
          }
        });
        
        if (existing) {
          console.log(`Skipping "${item.title}" - already exists`);
          continue;
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
        console.log(`Added: ${item.title} (${item.itemType}) by ${item.author}`);
        
      } catch (error) {
        console.error(`Error adding "${item.title}":`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully added ${addedCount} media items to the database!`);
    console.log(`Total items in database: ${existingItemsCount + addedCount}`);
    
    // Show breakdown by item type
    const itemTypes = await prisma.item.groupBy({
      by: ['itemType'],
      _count: {
        itemType: true
      }
    });
    
    console.log('\n📊 Current item breakdown by type:');
    itemTypes.forEach(type => {
      console.log(`  ${type.itemType}: ${type._count.itemType} items`);
    });
    
  } catch (error) {
    console.error('Error seeding media items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedMediaItems();
