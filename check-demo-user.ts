
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@slict.lk';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (user) {
        console.log(`User: ${user.email}`);
        console.log(`Tenant: ${user.tenant?.name} (${user.tenant?.subdomain})`);
        console.log(`Tenant ID: ${user.tenantId}`);
    } else {
        console.log(`User ${email} NOT FOUND`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
