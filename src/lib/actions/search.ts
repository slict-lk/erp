'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function searchCompatibleParts(criteria: {
    make: string;
    model: string;
    year?: string;
}) {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        // Construct search term to match how we save it: "Make Model"
        // e.g. "Toyota Corolla"
        const searchTerm = `${criteria.make} ${criteria.model}`;

        // Fetch parts. Since vehicleModels is string[], we can't easily do partial string match inside the array with standard Prisma
        // We will fetch recent parts and filter or use raw query if needed. 
        // For MVP, we will fetch parts that MIGHT match (e.g. correct category) and filter in memory, 
        // OR we rely on the user selecting the EXACT vehicle string in the form.
        // Let's assume the user selects the exact vehicle from the DB in the creating form.

        // If we want to be smart, we find the Vehicle record first to get the exact string format
        // But the form saves "Make Model (Year-Year)"

        // Let's try to match items where vehicleModels array has an item containing "Make Model"
        // Prisma doesn't support "array element contains substring" easily.

        // FALLBACK: Fetch all AutomotiveParts and filter in memory (OK for small scale demo)
        const allParts = await prisma.automotivePart.findMany({
            where: { tenantId: user.tenantId },
            include: { product: true },
            take: 100
        });

        return allParts.filter(part => {
            return part.vehicleModels.some(vm => vm.toLowerCase().includes(searchTerm.toLowerCase()));
        });

    } catch (error) {
        console.error('Fitment search failed:', error);
        return [];
    }
}
