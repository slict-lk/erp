import { prisma } from '@/lib/prisma';

/**
 * Generates a sequential invoice number in format: YYMMM_QQQQ_XXXXX
 * Example: 26JAN_POS1_00495
 * 
 * @param tenantId The tenant ID
 * @param source Source/Branch code (e.g., "POS1", "WEB")
 */
export async function generateInvoiceNumber(tenantId: string, source: string = 'POS'): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // "26"
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase(); // "JAN"
    const prefix = `${year}${month}_${source.toUpperCase()}`;

    // We need a sequential number. We can use a transaction to ensure uniqueness.
    // Since we don't have a separate Sequence table in schema yet, we can:
    // 1. Count existing invoices for this tenant (fast but potentially risky for high concurrency)
    // 2. Or query the latest invoice number and increment (better).

    // However, the requirement is "XXXXX" valid across the system or tenant?
    // "Ensure the sequential number does NOT reset mid-month".

    // Let's use Prisma to find the last invoice for this tenant to extract the sequence.
    // To allow global uniqueness per tenant, we'll ignore the prefix for sorting if possible,
    // OR just use a simple counter. 

    // Improved Strategy:
    // Find the last created invoice for this tenant.

    const lastInvoice = await prisma.shopInvoice.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true }
    });

    let sequence = 1;

    if (lastInvoice && lastInvoice.invoiceNumber) {
        // invoices might be "26JAN_POS1_00045"
        // We need to extract the last part.
        const parts = lastInvoice.invoiceNumber.split('_');
        if (parts.length >= 3) {
            const lastSeqStr = parts[parts.length - 1]; // "00045"
            const lastSeq = parseInt(lastSeqStr);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }
    }

    // Pad with zeros to 5 digits
    const sequenceStr = sequence.toString().padStart(5, '0');

    return `${prefix}_${sequenceStr}`;
}
