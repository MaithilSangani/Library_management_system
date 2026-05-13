const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const additionalMediaItems = [
  // More Magazines
  {
    title: "Popular Science - Innovation Issue",
    author: "Popular Science",
    isbn: null,
    subject: "Science",
    keywords: "innovation, technology, science, inventions, future tech",
    itemType: "Magazine",
    price: 7.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "The Economist - Weekly Edition",
    author: "The Economist Group",
    isbn: null,
    subject: "Economics",
    keywords: "economics, politics, business, global affairs, analysis",
    itemType: "Magazine",
    price: 8.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Smithsonian Magazine - History Special",
    author: "Smithsonian Institution",
    isbn: null,
    subject: "History",
    keywords: "history, culture, archaeology, museums, artifacts",
    itemType: "Magazine",
    price: 6.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "ACM Communications - Computer Science Monthly",
    author: "Association for Computing Machinery",
    isbn: null,
    subject: "Computer Science",
    keywords: "computing, software engineering, AI, programming",
    itemType: "Magazine",
    price: 11.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Psychology Today - Mental Health Issue",
    author: "Sussex Publishers",
    isbn: null,
    subject: "Psychology",
    keywords: "psychology, mental health, therapy, behavior",
    itemType: "Magazine",
    price: 5.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Discover Magazine - Space Exploration",
    author: "Kalmbach Media",
    isbn: null,
    subject: "Science",
    keywords: "space, astronomy, physics, discovery, exploration",
    itemType: "Magazine",
    price: 6.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },

  // More DVDs - Educational and Documentary
  {
    title: "The World Wars - Complete Documentary Series",
    author: "History Channel",
    isbn: null,
    subject: "History",
    keywords: "world war, military history, documentary, battles",
    itemType: "DVD",
    price: 49.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "TED Talks: Technology and Innovation",
    author: "TED Conferences",
    isbn: null,
    subject: "Technology",
    keywords: "ted talks, innovation, technology, entrepreneurship",
    itemType: "DVD",
    price: 34.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Understanding the Brain - Neuroscience Series",
    author: "The Great Courses",
    isbn: null,
    subject: "Neuroscience",
    keywords: "brain, neuroscience, psychology, cognitive science",
    itemType: "DVD",
    price: 79.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  },
  {
    title: "Ancient Civilizations Documentary Collection",
    author: "National Geographic",
    isbn: null,
    subject: "History",
    keywords: "ancient history, civilizations, archaeology, culture",
    itemType: "DVD",
    price: 59.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Climate Change: The Science Explained",
    author: "BBC Earth",
    isbn: null,
    subject: "Environmental Science",
    keywords: "climate change, environment, global warming, sustainability",
    itemType: "DVD",
    price: 24.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "The Art of Public Speaking - Masterclass",
    author: "Toastmasters International",
    isbn: null,
    subject: "Communication",
    keywords: "public speaking, communication, presentation skills",
    itemType: "DVD",
    price: 39.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Mathematics in Nature - Visual Learning",
    author: "Educational Media Group",
    isbn: null,
    subject: "Mathematics",
    keywords: "mathematics, nature, patterns, geometry, fractals",
    itemType: "DVD",
    price: 29.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // More CDs - Audio Learning and Music
  {
    title: "Business Ethics - Audio Course",
    author: "Harvard Business School",
    isbn: null,
    subject: "Business Ethics",
    keywords: "business ethics, corporate responsibility, moral philosophy",
    itemType: "CD",
    price: 32.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "English Literature - Audio Analysis",
    author: "Oxford Audio Press",
    isbn: null,
    subject: "Literature",
    keywords: "english literature, analysis, poetry, novels",
    itemType: "CD",
    price: 24.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Meditation and Mindfulness Guide",
    author: "Mindfulness Institute",
    isbn: null,
    subject: "Psychology",
    keywords: "meditation, mindfulness, relaxation, mental health",
    itemType: "CD",
    price: 18.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },
  {
    title: "Italian Language Immersion Course",
    author: "Pimsleur Method",
    isbn: null,
    subject: "Language",
    keywords: "italian, language learning, conversation, pronunciation",
    itemType: "CD",
    price: 34.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Japanese Culture and Language Introduction",
    author: "Japan Cultural Institute",
    isbn: null,
    subject: "Language",
    keywords: "japanese, culture, language, customs, society",
    itemType: "CD",
    price: 29.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Great Philosophers - Audio Lectures",
    author: "Philosophy Academic Press",
    isbn: null,
    subject: "Philosophy",
    keywords: "philosophy, philosophers, wisdom, critical thinking",
    itemType: "CD",
    price: 27.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // More Reference Materials
  {
    title: "Medical Dictionary - 2024 Edition",
    author: "Merriam-Webster Medical",
    isbn: "9780877797944",
    subject: "Medicine",
    keywords: "medical, dictionary, terminology, healthcare",
    itemType: "Reference",
    price: 45.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Engineering Handbook - Civil Engineering",
    author: "American Society of Civil Engineers",
    isbn: "9780784414576",
    subject: "Engineering",
    keywords: "civil engineering, construction, infrastructure, handbook",
    itemType: "Reference",
    price: 89.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  },

  // More Newspapers
  {
    title: "Financial Times - International Edition",
    author: "Financial Times Ltd",
    isbn: null,
    subject: "Finance",
    keywords: "finance, international business, markets, economics",
    itemType: "Newspaper",
    price: 4.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "USA Today - National Edition",
    author: "Gannett Company",
    isbn: null,
    subject: "News",
    keywords: "news, sports, entertainment, weather, national",
    itemType: "Newspaper",
    price: 2.99,
    imageUrl: null,
    totalCopies: 4,
    availableCopies: 4,
    condition: "EXCELLENT"
  },

  // More Technical Manuals
  {
    title: "Python Programming Complete Manual",
    author: "Python Software Foundation",
    isbn: null,
    subject: "Programming",
    keywords: "python, programming, coding, software development",
    itemType: "Manual",
    price: 34.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Linux System Administration Guide",
    author: "Red Hat Inc.",
    isbn: null,
    subject: "Operating Systems",
    keywords: "linux, system administration, servers, networking",
    itemType: "Manual",
    price: 42.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Digital Photography Techniques Manual",
    author: "Canon Professional Services",
    isbn: null,
    subject: "Photography",
    keywords: "photography, digital camera, techniques, editing",
    itemType: "Manual",
    price: 28.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // More Academic Journals
  {
    title: "Journal of Environmental Science",
    author: "Environmental Science Society",
    isbn: null,
    subject: "Environmental Science",
    keywords: "environment, sustainability, ecology, climate",
    itemType: "Journal",
    price: 19.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "International Business Review",
    author: "Business Academic Publishers",
    isbn: null,
    subject: "Business",
    keywords: "international business, global economy, trade",
    itemType: "Journal",
    price: 22.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },
  {
    title: "Journal of Artificial Intelligence Research",
    author: "AI Research Association",
    isbn: null,
    subject: "Artificial Intelligence",
    keywords: "artificial intelligence, machine learning, research",
    itemType: "Journal",
    price: 25.99,
    imageUrl: null,
    totalCopies: 2,
    availableCopies: 2,
    condition: "EXCELLENT"
  },

  // E-books and Digital Collections
  {
    title: "Digital Library of Classic Literature",
    author: "Project Gutenberg",
    isbn: null,
    subject: "Literature",
    keywords: "classic literature, digital books, e-books, collection",
    itemType: "DVD",
    price: 19.99,
    imageUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    condition: "EXCELLENT"
  },
  {
    title: "Scientific Research Database Collection",
    author: "Academic Publishers Consortium",
    isbn: null,
    subject: "Science",
    keywords: "research, scientific papers, database, digital archive",
    itemType: "DVD",
    price: 149.99,
    imageUrl: null,
    totalCopies: 1,
    availableCopies: 1,
    condition: "EXCELLENT"
  }
];

async function seedAdditionalMediaItems() {
  try {
    console.log('Starting to seed additional media items...');
    
    // Check current item count
    const existingItemsCount = await prisma.item.count();
    console.log(`Found ${existingItemsCount} existing items in the database.`);
    
    // Add all additional media items
    let addedCount = 0;
    for (const item of additionalMediaItems) {
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
    
    console.log(`\n✅ Successfully added ${addedCount} additional media items to the database!`);
    console.log(`Total items in database: ${existingItemsCount + addedCount}`);
    
    // Show updated breakdown by item type
    const itemTypes = await prisma.item.groupBy({
      by: ['itemType'],
      _count: {
        itemType: true
      },
      orderBy: {
        _count: {
          itemType: 'desc'
        }
      }
    });
    
    console.log('\n📊 Updated item breakdown by type:');
    let totalItems = 0;
    itemTypes.forEach(type => {
      console.log(`  ${type.itemType}: ${type._count.itemType} items`);
      totalItems += type._count.itemType;
    });
    console.log(`  Total: ${totalItems} items`);
    
    // Show some statistics
    const subjects = await prisma.item.groupBy({
      by: ['subject'],
      _count: {
        subject: true
      },
      orderBy: {
        _count: {
          subject: 'desc'
        }
      },
      take: 5
    });
    
    console.log('\n📚 Top 5 subjects by item count:');
    subjects.forEach(subject => {
      console.log(`  ${subject.subject}: ${subject._count.subject} items`);
    });
    
  } catch (error) {
    console.error('Error seeding additional media items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedAdditionalMediaItems();
