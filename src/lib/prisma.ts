import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Build the connection URL with serverless-optimized pooling parameters
function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';

  if (!baseUrl) {
    return 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  }

  // Check if URL already has query params
  const separator = baseUrl.includes('?') ? '&' : '?';

  // Ultra-conservative settings for Aiven free tier / serverless
  // connection_limit=1 means each function instance uses only 1 connection
  const params = [
    'connection_limit=1',    // Only 1 connection per serverless function
    'connect_timeout=15',    // Wait up to 15s for connection
    'pool_timeout=15',       // Wait up to 15s for pool
  ].join('&');

  return `${baseUrl}${separator}${params}`;
}

// Create Prisma Client instance with serverless-optimized settings
const createPrismaClient = () => {
  const url = getOptimizedDatabaseUrl();

  console.log('[Prisma] Initializing with optimized connection settings');

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url },
    },
  });
};

// Use cached instance or create new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache in BOTH dev and production to prevent connection leaks
globalForPrisma.prisma = prisma;

// Ensure connections are cleaned up on process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Connection health check helper
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, error);

      if (attempt === retries) {
        return false;
      }

      // Exponential backoff: 1s, 2s, 4s
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }

  return false;
}

export default prisma;

