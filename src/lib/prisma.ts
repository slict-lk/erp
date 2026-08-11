import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: pg.Pool;
};

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
  let sslConfig: any = {
    rejectUnauthorized: true, // Default: verify certificates
  };

  if (process.env.DISABLE_SSL_VERIFY === 'true') {
    // Keep TLS encryption but skip certificate chain verification (Aiven's
    // cert chain is not trusted by this environment's CA store).
    sslConfig = { rejectUnauthorized: false };
  }

  if (sslConfig && process.env.AIVEN_CA_CERT) {
    sslConfig.ca = process.env.AIVEN_CA_CERT;
    sslConfig.rejectUnauthorized = true; // Force verify if CA is provided
  }

  const pool =
    globalForPrisma.prismaPool ??
    new pg.Pool({
      connectionString: cleanedUrl,
      // Keep the pool very small in the app server because Next.js can fan out
      // a lot of concurrent auth/session and route requests in development.
      max: process.env.NODE_ENV === 'development' ? 2 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: sslConfig,
    });

  globalForPrisma.prismaPool = pool;

  const adapter = new PrismaPg(pool);

  console.log('[Prisma] Initializing client with pg adapter (Prisma 7)');

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    adapter,
  });

  return client;
};

// Lazily create the client on first use so importing this module never throws,
// e.g. during `next build` page-data collection when DATABASE_URL is unset.
// The actual error is deferred until a real query is made.
const getPrisma = (): PrismaClient => {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
};

export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    if (prop === 'then') return undefined;
    return (getPrisma() as unknown as Record<PropertyKey, unknown>)[prop];
  },
}) as PrismaClient;


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