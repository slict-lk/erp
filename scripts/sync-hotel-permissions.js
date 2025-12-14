const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncHotelPermissions() {
    console.log('🔄 Syncing hotel module permissions for all ADMIN users...\n');

    // Find all admin users
    const users = await prisma.user.findMany({
        where: {
            role: 'ADMIN'
        },
        select: {
            id: true,
            email: true,
            name: true,
            tenantId: true,
            modulePermissions: true
        }
    });

    console.log(`Found ${users.length} admin users.\n`);

    for (const user of users) {
        const currentPermissions = user.modulePermissions || {};

        // Check if hotel permission is missing or disabled
        if (!currentPermissions.hotel || !currentPermissions.hotel.enabled) {
            console.log(`📝 Updating: ${user.email}`);

            const updatedPermissions = {
                ...currentPermissions,
                hotel: { enabled: true, read: true, write: true, view: true, create: true, edit: true, delete: true }
            };

            await prisma.user.update({
                where: { id: user.id },
                data: { modulePermissions: updatedPermissions }
            });

            console.log(`   ✅ Added hotel permissions`);
        } else {
            console.log(`⏭️  Skipping: ${user.email} (already has hotel permissions)`);
        }
    }

    console.log('\n✅ Done!');
}

syncHotelPermissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
