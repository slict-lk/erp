
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            tenant: {
                select: { name: true, subdomain: true, id: true }
            }
        }
    });

    console.log('ALL USERS:');
    // Use console.log with JSON stringify for better readability of nested objects if table fails
    users.forEach(u => {
        console.log(`${u.email} | ${u.tenant?.name} (${u.tenant?.subdomain}) | ${u.tenant?.id}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
