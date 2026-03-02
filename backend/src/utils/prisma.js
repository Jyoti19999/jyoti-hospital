const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  // Connection pooling configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Note: Prisma middleware ($use) is not available in Prisma 6+
// Auto-sync is handled in equipmentService methods instead

// Track connection state
let isShuttingDown = false;

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    console.log('🔌 Disconnecting Prisma client...');
    await prisma.$disconnect();
  }
});

process.on('SIGINT', async () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    console.log('🔌 SIGINT received, disconnecting Prisma client...');
    await prisma.$disconnect();
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    console.log('🔌 SIGTERM received, disconnecting Prisma client...');
    await prisma.$disconnect();
    process.exit(0);
  }
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('🚨 Uncaught Exception:', error);
  if (!isShuttingDown) {
    isShuttingDown = true;
    await prisma.$disconnect();
    process.exit(1);
  }
});

module.exports = prisma;
