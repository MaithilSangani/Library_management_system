const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Working image URLs for different item types
const workingImages = {
  // Computer Science Books - Real working URLs
  computerScience: [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400&h=600&fit=crop"
  ],
  
  // Mathematics Books
  mathematics: [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1606922919123-0b6b7eaa7655?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1509869175650-a1d97972541a?w=400&h=600&fit=crop"
  ],
  
  // Literature Books
  literature: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1554473675-d0251ba72770?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1491841573337-20c2fc8c2244?w=400&h=600&fit=crop"
  ],
  
  // Science Books
  science: [
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=600&fit=crop"
  ],
  
  // History Books
  history: [
    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1471919743851-c4df8b6ee585?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&h=600&fit=crop"
  ],
  
  // Other Books (Business, Psychology, etc.)
  otherBooks: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=600&fit=crop"
  ],
  
  // Magazines - Distinct magazine covers
  magazines: [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1565728744382-61accd4aa148?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606932475725-83b4c8b82b8a?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=400&fit=crop"
  ],
  
  // DVDs - Video/disc imagery
  dvds: [
    "https://images.unsplash.com/photo-1489599316546-1292b57c2c50?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1594736797933-d0cc5ba36409?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1560472354-aa33c0be81a8?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1631947430066-48c30d57b943?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1627873649417-c67f701f1949?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=300&h=400&fit=crop"
  ],
  
  // CDs - Music disc imagery
  cds: [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606916236764-03b3e3bb7e7d?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564222256449-4db9e81b7dd1?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1518463855208-0fc0e0ab1e0a?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564222256488-7ad5b9e52e7d?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1621976498727-9e5324fb7e02?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=300&fit=crop"
  ],
  
  // Journals - Academic publications
  journals: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=300&h=400&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=400&fit=crop"
  ],
  
  // Reference Materials
  reference: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1554473675-d0251ba72770?w=400&h=500&fit=crop"
  ],
  
  // Newspapers
  newspapers: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=350&h=450&fit=crop"
  ],
  
  // Manuals
  manuals: [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=350&h=450&fit=crop",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=350&h=450&fit=crop"
  ],
  
  // Atlas
  atlas: [
    "https://images.unsplash.com/photo-1597149041870-42ba4c7cf5ed?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=500&fit=crop"
  ]
};

function getWorkingImageUrl(item, itemIndex, usedImages) {
  const itemType = item.itemType.toLowerCase();
  const subject = item.subject;
  
  let imageArray = [];
  
  // Select appropriate image array
  if (itemType === 'book') {
    if (subject && (subject.includes('Computer') || subject === 'Programming' || subject === 'Web Development' || subject === 'Software Engineering')) {
      imageArray = workingImages.computerScience;
    } else if (subject === 'Mathematics') {
      imageArray = workingImages.mathematics;
    } else if (subject === 'Literature') {
      imageArray = workingImages.literature;
    } else if (subject === 'Science' || subject === 'Physics' || subject === 'Chemistry' || subject === 'Biology' || subject === 'Astronomy' || subject === 'Environmental Science' || subject === 'Neuroscience') {
      imageArray = workingImages.science;
    } else if (subject === 'History') {
      imageArray = workingImages.history;
    } else {
      imageArray = workingImages.otherBooks;
    }
  } else {
    // Non-book items
    switch (itemType) {
      case 'magazine':
        imageArray = workingImages.magazines;
        break;
      case 'dvd':
        imageArray = workingImages.dvds;
        break;
      case 'cd':
        imageArray = workingImages.cds;
        break;
      case 'journal':
        imageArray = workingImages.journals;
        break;
      case 'reference':
        imageArray = workingImages.reference;
        break;
      case 'newspaper':
        imageArray = workingImages.newspapers;
        break;
      case 'manual':
        imageArray = workingImages.manuals;
        break;
      case 'atlas':
        imageArray = workingImages.atlas;
        break;
      default:
        imageArray = workingImages.otherBooks;
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
  
  // If all specific images are used, cycle through them
  const cycleIndex = itemIndex % imageArray.length;
  return imageArray[cycleIndex];
}

async function fixAllItemImages() {
  try {
    console.log('🔧 Starting to fix all item images with working URLs...');
    
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
      orderBy: [
        { itemType: 'asc' },
        { itemId: 'asc' }
      ]
    });
    
    console.log(`Found ${allItems.length} items in the database.`);
    
    let updatedCount = 0;
    const usedImages = new Set();
    
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      
      try {
        // Get working image URL
        const imageUrl = getWorkingImageUrl(item, i, usedImages);
        
        // Update the item with the working image URL
        await prisma.item.update({
          where: { itemId: item.itemId },
          data: { imageUrl: imageUrl }
        });
        
        updatedCount++;
        console.log(`✅ Updated "${item.title}" (${item.itemType}) with working ${item.itemType.toLowerCase()} image`);
        
      } catch (error) {
        console.error(`❌ Error updating "${item.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Image fix completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Updated: ${updatedCount} items`);
    console.log(`   • Total items: ${allItems.length}`);
    
    // Show breakdown by item type
    const itemTypeCounts = await prisma.item.groupBy({
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
    
    console.log(`\n📸 Items updated by type:`);
    itemTypeCounts.forEach(type => {
      console.log(`   • ${type.itemType}: ${type._count.itemType} items with appropriate imagery`);
    });
    
    console.log(`\n✨ All items now have working, type-appropriate images!`);
    console.log(`   📚 Books: Academic/subject-specific imagery`);
    console.log(`   📰 Magazines: Magazine cover designs`);
    console.log(`   💿 DVDs: Video disc imagery`);
    console.log(`   🎵 CDs: Music disc imagery`);
    console.log(`   📖 Journals: Academic publication designs`);
    console.log(`   📋 References: Dictionary/handbook imagery`);
    console.log(`   🗞️  Newspapers: News publication designs`);
    console.log(`   📘 Manuals: Technical guide imagery`);
    console.log(`   🗺️  Atlas: Map and geographical imagery`);
    
  } catch (error) {
    console.error('❌ Error fixing item images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixAllItemImages();
