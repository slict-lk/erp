
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            subdomain: true,
            name: true
        }
    });
    console.table(tenants);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
