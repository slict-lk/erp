
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'team@slict.lk';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (user) {
        console.log(`User: ${user.email}`);
        console.log(`isSuperAdmin: ${user.isSuperAdmin}`);
        console.log(`Role: ${user.role}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
