import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Prisma cannot start without a database connection string.');
}

export default defineConfig({
    datasource: {
        url: databaseUrl,
    },
})
