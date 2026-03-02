import { recordStockOut } from './src/lib/inventory/inventory-bridge';
import { prisma } from './src/lib/prisma';

async function test() {
    const defaultWarehouse = await prisma.invWarehouse.findFirst();

    if (!defaultWarehouse) {
        console.error('No warehouse found. Please seed the database first.');
        process.exit(1);
    }

    console.log('Using Warehouse:', defaultWarehouse.id);

    try {
        await recordStockOut('OUT', {
            tenantId: defaultWarehouse.tenantId,
            productId: 'test-product-id', // Use a placeholder or real ID
            productName: 'Test Part',
            productCategory: 'Spareparts',
            productPrice: 1000,
            warehouseId: defaultWarehouse.id,
            quantity: 1,
            unitCost: 800,
            sourceModule: 'spareparts',
            sourceDocument: 'test-doc-123',
            reference: 'INV-TEMP-001',
            allowNegative: true
        });
        console.log('✅ SUCCESS: Stock record created.');
        process.exit(0);
    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    }
}

test().catch((e) => {
    console.error('❌ Unhandled error:', e);
    process.exit(1);
});
