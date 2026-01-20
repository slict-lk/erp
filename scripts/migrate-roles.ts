
import { PrismaClient } from '@prisma/client';
import { generateDefaultModulePermissions } from '../src/lib/modules';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Role Migration...');

    // 1. Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
        console.log(`\nProcessing Tenant: ${tenant.name} (${tenant.subdomain})`);

        // 2. Ensure Default Roles Exist
        const defaultRoles = ['ADMIN', 'MANAGER', 'USER', 'VIEWER'];

        for (const roleCode of defaultRoles) {
            const exists = await prisma.role.findFirst({
                where: { tenantId: tenant.id, code: roleCode }
            });

            if (!exists) {
                console.log(`  + Creating default role: ${roleCode}`);
                await prisma.role.create({
                    data: {
                        name: roleCode.charAt(0) + roleCode.slice(1).toLowerCase(), // "Admin"
                        code: roleCode,
                        description: `Default ${roleCode.toLowerCase()} role`,
                        permissions: generateDefaultModulePermissions(roleCode as any) as any,
                        tenantId: tenant.id
                    }
                });
            }
        }

        // 3. Link Users to Roles
        const users = await prisma.user.findMany({
            where: { tenantId: tenant.id }
        });

        for (const user of users) {
            if (user.role && !user.userRoleId) {
                // Find matching role
                const role = await prisma.role.findFirst({
                    where: {
                        tenantId: tenant.id,
                        code: user.role
                    }
                });

                if (role) {
                    console.log(`  -> Linking user ${user.email} (${user.role}) to Role ID ${role.id}`);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { userRoleId: role.id }
                    });
                } else {
                    console.warn(`  ⚠️  User ${user.email} has role "${user.role}" but no matching Role found in DB.`);
                }
            }
        }
    }

    console.log('\n✅ Migration Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
