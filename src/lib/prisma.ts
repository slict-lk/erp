import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma Client instance using the Prisma 7 adapter pattern.
// Prisma 7 uses the "client" engine, which requires a driver adapter.
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Strip sslmode from URL — pg Pool handles SSL via its own config object,
  // and having it in the URL can conflict with the adapter.
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  const cleanedUrl = url.toString();

  // SSL Configuration for Aiven / Managed Postgres
  const sslConfig: any = {
    rejectUnauthorized: true, // Default: verify certificates
  };

  if (process.env.DISABLE_SSL_VERIFY === 'true') {
    sslConfig.rejectUnauthorized = false;
  }

  if (process.env.AIVEN_CA_CERT) {
    sslConfig.ca = process.env.AIVEN_CA_CERT;
    sslConfig.rejectUnauthorized = true; // Force verify if CA is provided
  }

  // Create a pg Pool with conservative settings for Aiven / serverless
  const pool = new pg.Pool({
    connectionString: cleanedUrl,
    max: 5,              // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    ssl: sslConfig,
  });

  const adapter = new PrismaPg(pool);

  console.log('[Prisma] Initializing client with pg adapter (Prisma 7)');

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    adapter,
  });

  // Attach pool to client for teardown
  (client as any)._pool = pool;
  const originalDisconnect = client.$disconnect.bind(client);

  client.$disconnect = async () => {
    console.log('[Prisma] Disconnecting and closing pool...');
    await originalDisconnect();
    await pool.end();
  };

  return client;
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

