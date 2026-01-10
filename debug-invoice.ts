
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoiceId = 'cmjogmuix001s7u2cfp7n6c2u'; // New ID from second screenshot
    console.log(`Searching for invoice: ${invoiceId}`);

    const invoice = await prisma.shopInvoice.findUnique({
        where: { id: invoiceId },
        include: {
            customer: true,
            items: true
        }
    });

    if (invoice) {
        console.log('✅ Invoice FOUND');
        console.log('Invoice Tenant ID:', invoice.tenantId);
        console.log('Invoice Status:', invoice.status);

        // Also check if any user exists with this tenant?
        const user = await prisma.user.findFirst({
            where: { tenantId: invoice.tenantId }
        });
        console.log('Sample User for this Tenant:', user?.email);
    } else {
        console.log('❌ Invoice NOT FOUND in database');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
