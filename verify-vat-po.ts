
import { PrismaClient } from '@prisma/client';
import { createPurchaseOrder } from './src/apps/spareparts/api';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting VAT PO Verification...');

    // 1. Get a test tenant and user (Simulate context)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found');
    const user = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
    if (!user) throw new Error('No user found');

    console.log(`Context: Tenant ${tenant.id}, User ${user.id}`);

    // Clean up previous test runs (Empty where clause to clean ALL tenants to avoid global unique conflict)
    await prisma.shopPurchaseOrder.deleteMany({});
    console.log('Cleaned up previous POs');

    // 2. Get a test supplier and product
    let supplier = await prisma.shopSupplier.findFirst({ where: { tenantId: tenant.id } });
    if (!supplier) {
        console.log('No supplier found, creating test supplier...');
        supplier = await prisma.shopSupplier.create({
            data: {
                tenantId: tenant.id,
                name: 'Test Supplier Ltd',
                email: 'supplier@test.com',
                phone: '1234567890',
            }
        });
    }

    let product = await prisma.sparePart.findFirst({
        where: { tenantId: tenant.id },
        include: { taxCategory: true }
    });

    if (!product) {
        console.log('No product found, creating test product...');
        product = await prisma.sparePart.create({
            data: {
                tenantId: tenant.id,
                name: 'Test Product',
                sku: 'TEST-SKU-123',
                costPrice: 500, // 500 cost
                isActive: true
            },
            include: { taxCategory: true }
        });
    }

    // Ensure product has a tax category for the test
    if (!product.taxCategoryId) {
        console.log('Product has no tax category, creating a temp one...');
        const taxCat = await prisma.shopTaxCategory.create({
            data: {
                tenantId: tenant.id,
                name: 'Test VAT 10%',
                rate: 10,
            }
        });
        product = await prisma.sparePart.update({
            where: { id: product.id },
            data: { taxCategoryId: taxCat.id },
            include: { taxCategory: true }
        });
    }

    console.log(`Product: ${product.name} (Tax Rate: ${product.taxCategory?.rate}%)`);

    // 3. Test Case A: Create PO WITH Tax
    console.log('\n--- Test Case A: Tax ENABLED ---');
    const poWithTax = await createPurchaseOrder({
        supplierId: supplier.id,
        items: [{
            productId: product.id,
            quantity: 10,
            unitCost: 100 // 10 * 100 = 1000 Subtotal. Tax @ 10% = 100. Total = 1100.
        }],
        createdById: user.id,
        tenantId: tenant.id,
        isTaxEnabled: true
    });

    console.log(`Created PO: ${poWithTax.orderNumber}`);
    console.log(`Subtotal: ${poWithTax.subtotal}`);
    console.log(`Tax Amount: ${poWithTax.taxAmount}`);
    console.log(`Total: ${poWithTax.total}`);
    console.log(`Is Tax Enabled: ${poWithTax.isTaxEnabled}`);

    if (Number(poWithTax.taxAmount) === 100 && Number(poWithTax.total) === 1100) {
        console.log('✅ Tax Calculation Correct');
    } else {
        console.error('❌ Tax Calculation Incorrect');
    }

    // 4. Test Case B: Create PO WITHOUT Tax
    console.log('\n--- Test Case B: Tax DISABLED ---');
    const poNoTax = await createPurchaseOrder({
        supplierId: supplier.id,
        items: [{
            productId: product.id,
            quantity: 10,
            unitCost: 100
        }],
        createdById: user.id,
        tenantId: tenant.id,
        isTaxEnabled: false
    });

    console.log(`Created PO: ${poNoTax.orderNumber}`);
    console.log(`Subtotal: ${poNoTax.subtotal}`);
    console.log(`Tax Amount: ${poNoTax.taxAmount}`);
    console.log(`Total: ${poNoTax.total}`);

    if (Number(poNoTax.taxAmount) === 0 && Number(poNoTax.total) === 1000) {
        console.log('✅ No-Tax Calculation Correct');
    } else {
        console.error('❌ No-Tax Calculation Incorrect');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
