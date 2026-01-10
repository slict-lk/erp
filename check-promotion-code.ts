
import { prisma } from './src/lib/prisma';

async function main() {
    const code = 'NEWYEAR26';
    console.log(`Checking for promotion code: ${code}`);

    // Check ShopPromotion
    const shopPromo = await prisma.shopPromotion.findFirst({
        where: { code }
    });
    if (shopPromo) {
        console.log('Found in ShopPromotion:', shopPromo);
    } else {
        console.log('Not found in ShopPromotion');
    }

    // Check SparePromotion
    // Note: SparePromotion model lookup via prisma requires 'any' cast usually if not generated properly or strictly typed
    // But let's try direct access if client has it.
    try {
        const sparePromo = await (prisma as any).sparePromotion.findFirst({
            where: { code }
        });
        if (sparePromo) {
            console.log('Found in SparePromotion:', sparePromo);
        } else {
            console.log('Not found in SparePromotion');
        }
    } catch (e) {
        console.log('Error checking SparePromotion:', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
