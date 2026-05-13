const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock the collection statistics API endpoint
async function handleCollectionStats(req, res) {
  try {
    console.log('📊 Fetching collection statistics...');

    // Get all statistics in parallel for better performance
    const [
      totalItems,
      totalCopiesResult,
      availableCopiesResult,
      outOfStockItems,
      itemsByType,
      itemsByCondition,
      mostBorrowedItems,
      activeTransactions,
      overdueTransactions
    ] = await Promise.all([
      // Total number of visible items
      prisma.item.count({
        where: { isVisible: true }
      }),
      
      // Sum of all total copies
      prisma.item.aggregate({
        where: { isVisible: true },
        _sum: {
          totalCopies: true
        }
      }),
      
      // Sum of all available copies
      prisma.item.aggregate({
        where: { isVisible: true },
        _sum: {
          availableCopies: true
        }
      }),
      
      // Count of items that are out of stock (0 available copies)
      prisma.item.count({
        where: {
          isVisible: true,
          availableCopies: 0
        }
      }),

      // Items by type
      prisma.item.groupBy({
        by: ['itemType'],
        _count: { itemType: true },
        where: { isVisible: true }
      }),

      // Items by condition
      prisma.item.groupBy({
        by: ['condition'],
        _count: { condition: true },
        where: { isVisible: true }
      }),

      // Most borrowed items
      prisma.transaction.groupBy({
        by: ['itemId'],
        _count: { itemId: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: 5
      }).then(async (result) => {
        if (result.length === 0) return [];
        
        const itemIds = result.map(r => r.itemId);
        const items = await prisma.item.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, title: true, author: true }
        });
        
        return result.map(r => ({
          ...r,
          item: items.find(i => i.itemId === r.itemId)
        }));
      }),

      // Active transactions
      prisma.transaction.count({ where: { isReturned: false } }),

      // Overdue transactions
      prisma.transaction.count({
        where: {
          isReturned: false,
          dueDate: { lt: new Date() }
        }
      })
    ]);

    const stats = {
      // Basic statistics
      totalItems,
      totalCopies: totalCopiesResult._sum.totalCopies || 0,
      availableCopies: availableCopiesResult._sum.availableCopies || 0,
      outOfStockItems,
      borrowedCopies: (totalCopiesResult._sum.totalCopies || 0) - (availableCopiesResult._sum.availableCopies || 0),
      activeTransactions,
      overdueTransactions,

      // Collection distribution
      collectionDistribution: {
        byType: itemsByType.map(item => ({
          type: item.itemType,
          count: item._count.itemType,
          percentage: ((item._count.itemType / totalItems) * 100).toFixed(1)
        })),
        byCondition: itemsByCondition.map(item => ({
          condition: item.condition,
          count: item._count.condition,
          percentage: ((item._count.condition / totalItems) * 100).toFixed(1)
        }))
      },

      // Popular items
      mostBorrowedItems: mostBorrowedItems.map(item => ({
        title: item.item?.title || 'Unknown',
        author: item.item?.author || 'Unknown',
        borrowCount: item._count.itemId
      })),

      // Utilization metrics
      utilizationRate: totalItems > 0 ? ((activeTransactions / totalItems) * 100).toFixed(1) : '0',
      availabilityRate: totalItems > 0 ? (((totalItems - activeTransactions) / totalItems) * 100).toFixed(1) : '100',

      // Metadata
      lastUpdated: new Date().toISOString(),
      isDataDynamic: true
    };

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify({
      success: true,
      data: stats,
      message: 'Collection statistics retrieved successfully'
    }, null, 2));

    console.log('✅ Collection statistics sent successfully!');
    
  } catch (error) {
    console.error('❌ Error fetching collection statistics:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to fetch collection statistics',
      details: error.message
    }));
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`📝 ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Route handling
  if (req.url === '/api/collection/stats' && req.method === 'GET') {
    await handleCollectionStats(req, res);
  } else if (req.url === '/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Collection Statistics Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .stat { margin: 10px 0; }
          .loading { color: #666; }
          .error { color: red; }
          .success { color: green; }
        </style>
      </head>
      <body>
        <h1>📊 Collection Statistics Test</h1>
        <div id="stats" class="loading">Loading collection statistics...</div>
        
        <script>
          fetch('/api/collection/stats')
            .then(response => response.json())
            .then(data => {
              const statsDiv = document.getElementById('stats');
              if (data.success) {
                const stats = data.data;
                statsDiv.className = 'success';
                statsDiv.innerHTML = \`
                  <div class="card">
                    <h2>📚 Collection Overview</h2>
                    <div class="stat">Total Items: <strong>\${stats.totalItems}</strong></div>
                    <div class="stat">Total Copies: <strong>\${stats.totalCopies}</strong></div>
                    <div class="stat">Available Copies: <strong>\${stats.availableCopies}</strong></div>
                    <div class="stat">Borrowed Copies: <strong>\${stats.borrowedCopies}</strong></div>
                    <div class="stat">Utilization Rate: <strong>\${stats.utilizationRate}%</strong></div>
                  </div>
                  
                  <div class="card">
                    <h2>📊 Collection Distribution by Type</h2>
                    \${stats.collectionDistribution.byType.map(item => 
                      \`<div class="stat">\${item.type}: <strong>\${item.count}</strong> (\${item.percentage}%)</div>\`
                    ).join('')}
                  </div>
                  
                  <div class="card">
                    <h2>🏥 Collection Distribution by Condition</h2>
                    \${stats.collectionDistribution.byCondition.map(item => 
                      \`<div class="stat">\${item.condition}: <strong>\${item.count}</strong> (\${item.percentage}%)</div>\`
                    ).join('')}
                  </div>
                  
                  <div class="card">
                    <h2>🔥 Most Borrowed Items</h2>
                    \${stats.mostBorrowedItems.map(item => 
                      \`<div class="stat">"\${item.title}" by \${item.author}: <strong>\${item.borrowCount}</strong> times</div>\`
                    ).join('')}
                  </div>
                  
                  <div class="card">
                    <h2>🔄 Transaction Statistics</h2>
                    <div class="stat">Active Transactions: <strong>\${stats.activeTransactions}</strong></div>
                    <div class="stat">Overdue Transactions: <strong>\${stats.overdueTransactions}</strong></div>
                  </div>
                  
                  <div class="card">
                    <h2>📅 Data Information</h2>
                    <div class="stat">Last Updated: <strong>\${new Date(stats.lastUpdated).toLocaleString()}</strong></div>
                    <div class="stat">Data is Dynamic: <strong>\${stats.isDataDynamic ? 'Yes ✅' : 'No ❌'}</strong></div>
                  </div>
                \`;
              } else {
                statsDiv.className = 'error';
                statsDiv.innerHTML = 'Error: ' + data.error;
              }
            })
            .catch(error => {
              const statsDiv = document.getElementById('stats');
              statsDiv.className = 'error';
              statsDiv.innerHTML = 'Network error: ' + error.message;
            });
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Not found',
      availableEndpoints: [
        'GET /api/collection/stats - Collection statistics',
        'GET /test - Test dashboard'
      ]
    }));
  }
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`🚀 Test server running at http://localhost:${PORT}`);
  console.log(`📊 Collection stats API: http://localhost:${PORT}/api/collection/stats`);
  console.log(`🧪 Test dashboard: http://localhost:${PORT}/test`);
  console.log(`\n✨ Your collection data IS dynamic! The server will show live data from your database.`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
