import { prisma } from './src/lib/prisma';

async function main() {
    try {
        const categories = await prisma.invCategory.findMany({
            take: 1
        });
        console.log('Categories query success:', categories);

        const products = await prisma.invProduct.findMany({
            take: 1
        });
        console.log('Products query success:', products);
    } catch (e) {
        console.error('Database Query Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
