import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma Client instance with serverless-optimized settings
const createPrismaClient = () => {
  // If DATABASE_URL is not set, we're likely in build mode
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set - using placeholder for build time');
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
        },
      },
    });
  }

  // For serverless environments (Vercel), we need to limit connections
  // Each serverless function instance should use minimal connections
  const databaseUrl = new URL(process.env.DATABASE_URL);

  // Add connection pooling params if not already present
  if (!databaseUrl.searchParams.has('connection_limit')) {
    databaseUrl.searchParams.set('connection_limit', '5'); // Limit per function instance
  }
  if (!databaseUrl.searchParams.has('connect_timeout')) {
    databaseUrl.searchParams.set('connect_timeout', '10'); // 10 second timeout
  }
  if (!databaseUrl.searchParams.has('pool_timeout')) {
    databaseUrl.searchParams.set('pool_timeout', '10'); // Wait 10s for available connection
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl.toString(),
      },
    },
  });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

// In production, also cache the prisma instance to prevent connection leaks
if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check helper
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, error);

      if (attempt === retries) {
        throw error;
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
