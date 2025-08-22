import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

// Curated image URLs for different types of books and media
const bookImages = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1509266272358-7701da638078?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551029506-0807df4e2031?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1535905557558-afc4877cdf3f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1478398892963-67bcc2355c90?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1602498456745-e9503b30470b?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400&h=600&fit=crop',
];

// DVD/Media images
const mediaImages = [
  'https://images.unsplash.com/photo-1489599385710-7c3ce8b6c036?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=600&fit=crop',
];

// Magazine images
const magazineImages = [
  'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=600&fit=crop',
];

async function addImages() {
  try {
    // Get all items without images
    const items = await prisma.item.findMany({
      where: {
        imageUrl: null,
        isVisible: true
      }
    });

    console.log(`Found ${items.length} items without images`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let imageUrl: string;

      // Select image based on item type
      if (item.itemType === 'DVD') {
        imageUrl = mediaImages[i % mediaImages.length];
      } else if (item.itemType === 'Magazine') {
        imageUrl = magazineImages[i % magazineImages.length];
      } else {
        imageUrl = bookImages[i % bookImages.length];
      }

      // Update item with image
      await prisma.item.update({
        where: { itemId: item.itemId },
        data: { imageUrl }
      });

      console.log(`Updated "${item.title}" with image`);
    }

    console.log('✅ Successfully added images to all items');
  } catch (error) {
    console.error('Error adding images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addImages();
