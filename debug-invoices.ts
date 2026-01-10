
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.shopInvoice.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            invoiceNumber: true,
            createdAt: true,
            tenantId: true
        }
    });

    console.log('Invoices found:', invoices.length);
    invoices.forEach(inv => {
        console.log(`[${inv.tenantId}] ID: ${inv.id} | No: ${inv.invoiceNumber} | Date: ${inv.createdAt}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
