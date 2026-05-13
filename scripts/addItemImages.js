const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Image URLs for different types of items
const imageUrls = {
  // Books - Real cover images and placeholders
  books: {
    "Introduction to Algorithms": "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg",
    "Clean Code": "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
    "Design Patterns": "https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg",
    "JavaScript: The Good Parts": "https://covers.openlibrary.org/b/isbn/9780596517748-L.jpg",
    "React: Up & Running": "https://covers.openlibrary.org/b/isbn/9781491931820-L.jpg",
    "Calculus: Early Transcendentals": "https://covers.openlibrary.org/b/isbn/9781285741550-L.jpg",
    "Linear Algebra and Its Applications": "https://covers.openlibrary.org/b/isbn/9780030105678-L.jpg",
    "University Physics with Modern Physics": "https://covers.openlibrary.org/b/isbn/9780321973610-L.jpg",
    "To Kill a Mockingbird": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
    "1984": "https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg",
    "Pride and Prejudice": "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    "The Great Gatsby": "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    "Campbell Biology": "https://covers.openlibrary.org/b/isbn/9780134093413-L.jpg",
    "Python Crash Course": "https://covers.openlibrary.org/b/isbn/9781593279288-L.jpg",
    "Database System Concepts": "https://covers.openlibrary.org/b/isbn/9780078022159-L.jpg",
    "Operating System Concepts": "https://covers.openlibrary.org/b/isbn/9781118063330-L.jpg",
    "Artificial Intelligence: A Modern Approach": "https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg",
    "Thinking, Fast and Slow": "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
    "The Lean Startup": "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg",
    "A Brief History of Time": "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
    "Cosmos": "https://covers.openlibrary.org/b/isbn/9780345331359-L.jpg",
    "The Republic": "https://covers.openlibrary.org/b/isbn/9780140455113-L.jpg",
    "Meditations": "https://covers.openlibrary.org/b/isbn/9780486298238-L.jpg"
  },
  
  // Magazines
  magazines: [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=400&h=600&fit=crop&auto=format"
  ],
  
  // DVDs
  dvds: [
    "https://images.unsplash.com/photo-1489599316546-1292b57c2c50?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1594736797933-d0cc5ba36409?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1489599316546-1292b57c2c50?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop&auto=format"
  ],
  
  // CDs
  cds: [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1606916236764-03b3e3bb7e7d?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1606916236764-03b3e3bb7e7d?w=400&h=400&fit=crop&auto=format"
  ],
  
  // Journals
  journals: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop&auto=format"
  ],
  
  // Reference materials
  reference: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format"
  ],
  
  // Newspapers
  newspapers: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format"
  ],
  
  // Manuals
  manuals: [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format"
  ],
  
  // Atlas
  atlas: [
    "https://images.unsplash.com/photo-1597149041870-42ba4c7cf5ed?w=400&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=600&fit=crop&auto=format"
  ]
};

// Default placeholder images for different categories
const defaultImages = {
  "Computer Science": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop&auto=format",
  "Mathematics": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop&auto=format",
  "Physics": "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=600&fit=crop&auto=format",
  "Chemistry": "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=600&fit=crop&auto=format",
  "Biology": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop&auto=format",
  "Literature": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
  "History": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
  "Philosophy": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format",
  "Psychology": "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=600&fit=crop&auto=format",
  "Business": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format",
  "Engineering": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=600&fit=crop&auto=format",
  "Science": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop&auto=format",
  "Technology": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&auto=format",
  "default": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format"
};

function getImageUrl(item, index) {
  const itemType = item.itemType.toLowerCase();
  
  // First, check if we have a specific image for this book title
  if (itemType === 'book' && imageUrls.books[item.title]) {
    return imageUrls.books[item.title];
  }
  
  // Then check item type specific images
  if (itemType === 'magazine' && imageUrls.magazines[index % imageUrls.magazines.length]) {
    return imageUrls.magazines[index % imageUrls.magazines.length];
  }
  
  if (itemType === 'dvd' && imageUrls.dvds[index % imageUrls.dvds.length]) {
    return imageUrls.dvds[index % imageUrls.dvds.length];
  }
  
  if (itemType === 'cd' && imageUrls.cds[index % imageUrls.cds.length]) {
    return imageUrls.cds[index % imageUrls.cds.length];
  }
  
  if (itemType === 'journal' && imageUrls.journals[index % imageUrls.journals.length]) {
    return imageUrls.journals[index % imageUrls.journals.length];
  }
  
  if (itemType === 'reference' && imageUrls.reference[index % imageUrls.reference.length]) {
    return imageUrls.reference[index % imageUrls.reference.length];
  }
  
  if (itemType === 'newspaper' && imageUrls.newspapers[index % imageUrls.newspapers.length]) {
    return imageUrls.newspapers[index % imageUrls.newspapers.length];
  }
  
  if (itemType === 'manual' && imageUrls.manuals[index % imageUrls.manuals.length]) {
    return imageUrls.manuals[index % imageUrls.manuals.length];
  }
  
  if (itemType === 'atlas' && imageUrls.atlas[index % imageUrls.atlas.length]) {
    return imageUrls.atlas[index % imageUrls.atlas.length];
  }
  
  // Finally, use subject-based default images
  if (item.subject && defaultImages[item.subject]) {
    return defaultImages[item.subject];
  }
  
  // Last resort: default image
  return defaultImages.default;
}

async function addImagesToItems() {
  try {
    console.log('🖼️  Starting to add images to all items...');
    
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
    let skippedCount = 0;
    
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      
      try {
        // Skip if item already has an image
        if (item.imageUrl && item.imageUrl.trim() !== '') {
          console.log(`⏭️  Skipping "${item.title}" - already has image`);
          skippedCount++;
          continue;
        }
        
        // Get appropriate image URL
        const imageUrl = getImageUrl(item, i);
        
        // Update the item with the image URL
        await prisma.item.update({
          where: { itemId: item.itemId },
          data: { imageUrl: imageUrl }
        });
        
        updatedCount++;
        console.log(`✅ Updated "${item.title}" (${item.itemType}) with image`);
        
      } catch (error) {
        console.error(`❌ Error updating "${item.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Image update completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Updated: ${updatedCount} items`);
    console.log(`   • Skipped: ${skippedCount} items (already had images)`);
    console.log(`   • Total: ${allItems.length} items`);
    
    // Show breakdown by item type
    const itemTypeCounts = await prisma.item.groupBy({
      by: ['itemType'],
      _count: {
        itemType: true
      },
      where: {
        imageUrl: {
          not: null,
          not: ''
        }
      },
      orderBy: {
        _count: {
          itemType: 'desc'
        }
      }
    });
    
    console.log(`\n🖼️  Items with images by type:`);
    itemTypeCounts.forEach(type => {
      console.log(`   • ${type.itemType}: ${type._count.itemType} items`);
    });
    
  } catch (error) {
    console.error('❌ Error adding images to items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addImagesToItems();
