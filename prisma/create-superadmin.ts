const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'team@slict.lk';
  const password = 'Ms251985';
  const name = 'Super Admin';

  try {
    // Check if a tenant exists, if not create one
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('No tenant found. Creating a default tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'SLICT',
          subdomain: 'slict',
          companyName: 'SLICT',
          status: 'ACTIVE',
          plan: 'enterprise',
          primaryColor: '#3b82f6',
        },
      });
      console.log('Created default tenant:', tenant);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating to SuperAdmin...`);
      
      // Update existing user to SuperAdmin
      const hashedPassword = await hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          isSuperAdmin: true,
          role: 'ADMIN',
          isActive: true,
          name,
        },
      });
      
      console.log('Updated existing user to SuperAdmin:', updatedUser);
    } else {
      // Create new SuperAdmin user
      const hashedPassword = await hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          isSuperAdmin: true,
          role: 'ADMIN',
          isActive: true,
          tenantId: tenant.id,
        },
      });
      
      console.log('Created new SuperAdmin user:', user);
    }
    
    console.log('SuperAdmin setup completed successfully!');
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();

//npx ts-node prisma/create-superadmin.ts
