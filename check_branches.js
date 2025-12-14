
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const subdomain = 'SLICTHOTEL';
    const tenant = await prisma.tenant.findFirst({
        where: { subdomain: { equals: subdomain, mode: 'insensitive' } }
    });

    if (!tenant) {
        console.log(`Tenant '${subdomain}' NOT FOUND.`);
        return;
    }

    console.log(`Tenant found: ${tenant.name} (${tenant.id})`);

    const branches = await prisma.hotelBranch.findMany({
        where: { tenantId: tenant.id }
    });

    console.log(`Branches found: ${branches.length}`);
    branches.forEach(b => console.log(` - ${b.name} (${b.code}) [Default: ${b.isDefault}]`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
