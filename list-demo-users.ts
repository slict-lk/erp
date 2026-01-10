
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const demoTenantId = 'cmjacxg420000im1idwfh9ids'; // From list-tenants output
    const users = await prisma.user.findMany({
        where: { tenantId: demoTenantId },
        select: { id: true, email: true, name: true, role: true }
    });

    console.log('Users in DEMO tenant:');
    console.table(users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
