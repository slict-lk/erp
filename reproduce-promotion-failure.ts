
import { prisma } from './src/lib/prisma';
import { createQuantityPromotion } from './src/apps/spareparts/api';

async function main() {
    console.log('Fetching tenant...');
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found');
    console.log('Using tenant:', tenant.id);

    try {
        console.log('Attempting to create promotion...');
        const result = await createQuantityPromotion({
            tenantId: tenant.id,
            name: "New Year Sale Test",
            description: "New year promotion debug",
            code: "NEWYEAR26_TEST",
            type: "QUANTITY",
            discountType: "PERCENTAGE",
            discountValue: 0,
            minimumPurchase: undefined,
            maximumDiscount: undefined,
            startDate: new Date("2026-01-10"),
            endDate: new Date("2026-01-13"),
            targetScope: "ALL",
            isActive: true,
            tiers: [
                {
                    minQuantity: 10,
                    maxQuantity: 25,
                    discountType: "PERCENTAGE",
                    discountValue: 10
                }
            ]
        });
        console.log('Success!', result);
    } catch (error) {
        console.error('Failed to create promotion:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
