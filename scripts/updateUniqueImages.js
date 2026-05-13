const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive list of unique images for different categories
const uniqueImages = {
  // Computer Science & Programming Books
  computerScience: [
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop&auto=format", // Code on screen
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=600&fit=crop&auto=format", // Programming workspace
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop&auto=format", // HTML code
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=600&fit=crop&auto=format", // Binary code
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&auto=format", // Matrix code
    "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=400&h=600&fit=crop&auto=format", // Keyboard coding
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop&auto=format", // JavaScript code
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=600&fit=crop&auto=format", // Developer workspace
    "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400&h=600&fit=crop&auto=format", // Python code
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&auto=format", // Algorithm visualization
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop&auto=format", // Network diagram
    "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400&h=600&fit=crop&auto=format", // Database schema
  ],
  
  // Mathematics Books
  mathematics: [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop&auto=format", // Mathematical equations
    "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=600&fit=crop&auto=format", // Geometry shapes
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop&auto=format", // Math formulas
    "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=600&fit=crop&auto=format", // Calculus notebook
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=600&fit=crop&auto=format", // Mathematical symbols
    "https://images.unsplash.com/photo-1606922919123-0b6b7eaa7655?w=400&h=600&fit=crop&auto=format", // Statistics graphs
    "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=400&h=600&fit=crop&auto=format", // Linear algebra
    "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=600&fit=crop&auto=format", // Math chalkboard
    "https://images.unsplash.com/photo-1509869175650-a1d97972541a?w=400&h=600&fit=crop&auto=format", // Probability dice
  ],
  
  // Physics Books
  physics: [
    "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=600&fit=crop&auto=format", // Physics equations
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop&auto=format", // Space and cosmos
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop&auto=format", // Laboratory equipment
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=600&fit=crop&auto=format", // Electromagnetic waves
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=600&fit=crop&auto=format", // Galaxy and stars
  ],
  
  // Chemistry Books
  chemistry: [
    "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=600&fit=crop&auto=format", // Chemistry lab
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=600&fit=crop&auto=format", // Test tubes
    "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=600&fit=crop&auto=format", // Molecular structure
    "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=600&fit=crop&auto=format", // Chemical formulas
  ],
  
  // Biology Books
  biology: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop&auto=format", // DNA structure
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&auto=format", // Cell biology
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=600&fit=crop&auto=format", // Microscope
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=600&fit=crop&auto=format", // Plant biology
  ],
  
  // Literature Books
  literature: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format", // Classic books
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format", // Old books
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format", // Poetry book
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format", // Vintage literature
    "https://images.unsplash.com/photo-1554473675-d0251ba72770?w=400&h=600&fit=crop&auto=format", // Shakespeare
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop&auto=format", // Classic novels
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400&h=600&fit=crop&auto=format", // Literature collection
  ],
  
  // History Books
  history: [
    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=600&fit=crop&auto=format", // Ancient scroll
    "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=600&fit=crop&auto=format", // Historical map
    "https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=400&h=600&fit=crop&auto=format", // Ancient artifacts
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&auto=format", // Historical documents
    "https://images.unsplash.com/photo-1471919743851-c4df8b6ee585?w=400&h=600&fit=crop&auto=format", // War memorial
    "https://images.unsplash.com/photo-1554473675-d0251ba72770?w=400&h=600&fit=crop&auto=format", // Ancient civilization
  ],
  
  // Engineering Books
  engineering: [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=600&fit=crop&auto=format", // Engineering blueprint
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop&auto=format", // Circuit design
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&auto=format", // Mechanical parts
    "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400&h=600&fit=crop&auto=format", // Electrical systems
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop&auto=format", // Civil engineering
  ],
  
  // Business & Economics
  business: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop&auto=format", // Business meeting
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=600&fit=crop&auto=format", // Analytics charts
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop&auto=format", // Stock market
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop&auto=format", // Economics graphs
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=600&fit=crop&auto=format", // Business strategy
  ],
  
  // Psychology Books
  psychology: [
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=600&fit=crop&auto=format", // Brain illustration
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=600&fit=crop&auto=format", // Mental health
    "https://images.unsplash.com/photo-1554473675-d0251ba72770?w=400&h=600&fit=crop&auto=format", // Psychology study
  ],
  
  // Philosophy Books
  philosophy: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format", // Ancient philosophy
    "https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=400&h=600&fit=crop&auto=format", // Philosophical thinking
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop&auto=format", // Greek philosophy
  ],
  
  // Science General
  science: [
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop&auto=format", // Scientific research
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=600&fit=crop&auto=format", // Laboratory
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=600&fit=crop&auto=format", // Scientific equipment
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop&auto=format", // Science experiment
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=600&fit=crop&auto=format", // Astronomy
  ],
  
  // Magazines (14 unique images)
  magazines: [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=600&fit=crop&auto=format",
  ],
  
  // DVDs (20 unique images)
  dvds: [
    "https://images.unsplash.com/photo-1489599316546-1292b57c2c50?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1594736797933-d0cc5ba36409?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1471919743851-c4df8b6ee585?w=400&h=600&fit=crop&auto=format",
  ],
  
  // CDs (13 unique images)
  cds: [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1606916236764-03b3e3bb7e7d?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1564222256449-4db9e81b7dd1?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1518463855208-0fc0e0ab1e0a?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1564222256488-7ad5b9e52e7d?w=400&h=400&fit=crop&auto=format",
  ],
  
  // Reference Materials
  reference: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1554473675-d0251ba72770?w=400&h=600&fit=crop&auto=format",
  ],
  
  // Journals
  journals: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop&auto=format",
  ],
  
  // Newspapers
  newspapers: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
  ],
  
  // Manuals
  manuals: [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400&h=600&fit=crop&auto=format",
  ],
  
  // Atlas
  atlas: [
    "https://images.unsplash.com/photo-1597149041870-42ba4c7cf5ed?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=600&fit=crop&auto=format",
  ]
};

// Create a comprehensive mapping system
function getUniqueImageUrl(item, usedImages, itemIndex) {
  const itemType = item.itemType.toLowerCase();
  const subject = item.subject;
  
  // Get appropriate image array based on subject first, then item type
  let imageArray = [];
  
  // Subject-based selection for books
  if (itemType === 'book') {
    if (subject && subject.includes('Computer') || subject === 'Programming' || subject === 'Web Development' || subject === 'Software Engineering') {
      imageArray = uniqueImages.computerScience;
    } else if (subject === 'Mathematics') {
      imageArray = uniqueImages.mathematics;
    } else if (subject === 'Physics' || subject === 'Astronomy') {
      imageArray = uniqueImages.physics;
    } else if (subject === 'Chemistry') {
      imageArray = uniqueImages.chemistry;
    } else if (subject === 'Biology' || subject === 'Marine Biology') {
      imageArray = uniqueImages.biology;
    } else if (subject === 'Literature') {
      imageArray = uniqueImages.literature;
    } else if (subject === 'History') {
      imageArray = uniqueImages.history;
    } else if (subject === 'Engineering' || subject === 'Computer Engineering' || subject === 'Electrical Engineering') {
      imageArray = uniqueImages.engineering;
    } else if (subject === 'Business' || subject === 'Economics') {
      imageArray = uniqueImages.business;
    } else if (subject === 'Psychology') {
      imageArray = uniqueImages.psychology;
    } else if (subject === 'Philosophy') {
      imageArray = uniqueImages.philosophy;
    } else if (subject === 'Science' || subject === 'Environmental Science' || subject === 'Neuroscience') {
      imageArray = uniqueImages.science;
    } else {
      // Default to literature for other books
      imageArray = uniqueImages.literature;
    }
  } else {
    // Item type based selection for non-books
    switch (itemType) {
      case 'magazine':
        imageArray = uniqueImages.magazines;
        break;
      case 'dvd':
        imageArray = uniqueImages.dvds;
        break;
      case 'cd':
        imageArray = uniqueImages.cds;
        break;
      case 'journal':
        imageArray = uniqueImages.journals;
        break;
      case 'reference':
        imageArray = uniqueImages.reference;
        break;
      case 'newspaper':
        imageArray = uniqueImages.newspapers;
        break;
      case 'manual':
        imageArray = uniqueImages.manuals;
        break;
      case 'atlas':
        imageArray = uniqueImages.atlas;
        break;
      default:
        imageArray = uniqueImages.science;
    }
  }
  
  // Find an unused image from the array
  for (let i = 0; i < imageArray.length; i++) {
    const imageUrl = imageArray[i];
    if (!usedImages.has(imageUrl)) {
      usedImages.add(imageUrl);
      return imageUrl;
    }
  }
  
  // If all images in the specific array are used, fall back to a unique generated one
  const fallbackUrl = `https://images.unsplash.com/photo-${1500000000000 + itemIndex}?w=400&h=600&fit=crop&auto=format&sig=${itemIndex}`;
  usedImages.add(fallbackUrl);
  return fallbackUrl;
}

async function updateAllItemsWithUniqueImages() {
  try {
    console.log('🖼️  Starting to update all items with unique, non-repeating images...');
    
    // Get all items from the database
    const allItems = await prisma.item.findMany({
      select: {
        itemId: true,
        title: true,
        author: true,
        itemType: true,
        subject: true,
        imageUrl: true
      },
      orderBy: {
        itemId: 'asc'
      }
    });
    
    console.log(`Found ${allItems.length} items in the database.`);
    
    let updatedCount = 0;
    const usedImages = new Set(); // Track used image URLs
    
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      
      try {
        // Get unique image URL
        const imageUrl = getUniqueImageUrl(item, usedImages, i);
        
        // Update the item with the unique image URL
        await prisma.item.update({
          where: { itemId: item.itemId },
          data: { imageUrl: imageUrl }
        });
        
        updatedCount++;
        console.log(`✅ Updated "${item.title}" (${item.itemType}) with unique image #${i + 1}`);
        
      } catch (error) {
        console.error(`❌ Error updating "${item.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Unique image update completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Updated: ${updatedCount} items`);
    console.log(`   • Unique images used: ${usedImages.size}`);
    console.log(`   • Total items: ${allItems.length}`);
    
    // Verify no duplicates
    const imageUrls = await prisma.item.findMany({
      select: { imageUrl: true },
      where: {
        imageUrl: { not: null }
      }
    });
    
    const imageSet = new Set(imageUrls.map(item => item.imageUrl));
    const hasDuplicates = imageUrls.length !== imageSet.size;
    
    console.log(`\n🔍 Verification:`);
    console.log(`   • Total image URLs: ${imageUrls.length}`);
    console.log(`   • Unique image URLs: ${imageSet.size}`);
    console.log(`   • Has duplicates: ${hasDuplicates ? '❌ YES' : '✅ NO'}`);
    
    if (!hasDuplicates) {
      console.log(`\n🎊 SUCCESS: All ${allItems.length} items now have unique, non-repeating images!`);
    }
    
  } catch (error) {
    console.error('❌ Error updating items with unique images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateAllItemsWithUniqueImages();
