const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test if we can count patrons
    const patronCount = await prisma.patron.count();
    console.log(`✅ Found ${patronCount} patrons in the database`);
    
    // Test if we can count items
    const itemCount = await prisma.item.count();
    console.log(`✅ Found ${itemCount} items in the database`);
    
    // Test if we can count transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`✅ Found ${transactionCount} transactions in the database`);
    
    console.log('🎉 All database operations working correctly!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 Solution: Make sure MySQL service is running');
      console.log('   - Start MySQL service from Services or XAMPP');
      console.log('   - Check if MySQL is running on port 3306');
    }
    
    if (error.message.includes('database does not exist')) {
      console.log('\n💡 Solution: Create the database');
      console.log('   - Run: CREATE DATABASE library_management_system;');
      console.log('   - Then run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
