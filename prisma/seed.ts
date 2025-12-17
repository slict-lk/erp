import { PrismaClient, TenantStatus, AccountType, InvoiceStatus, InvoiceType, ExpenseStatus, ProductType, MovementType, ManufacturingStatus, EmploymentType, LeaveStatus, ProjectStatus, TaskStatus, ConstructionStatus, TicketStatus, CourseLevel, MarketingEventStatus, TopicStatus, TableStatus, RoomStatus, BookingStatus, HousekeepingStatus, TaskPriority, HkTaskStatus, MaintenanceCategory, MaintenanceStatus, QualityCheckStatus, TriggerType, ExecutionStatus, IntegrationStatus, EventType, EventStatus, ChatStatus, AgentType, AgentExecutionStatus, ModelProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting robust comprehensive seeding...');

    // 1. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { subdomain: 'demo' },
        update: {},
        create: {
            subdomain: 'demo',
            name: 'SLICT Demo Corp',
            companyName: 'SLICT ERP Solutions',
            status: 'ACTIVE',
            plan: 'enterprise',
            primaryColor: '#2563eb',
        },
    });

    const tenantId = tenant.id;

    // 2. Create Users & Roles
    const hashedPassword = await bcrypt.hash('demo@slict', 10);
    await prisma.user.upsert({
        where: { email: 'demo@slict.lk' },
        update: { password: hashedPassword },
        create: {
            email: 'demo@slict.lk',
            password: hashedPassword,
            name: 'Demo Admin',
            role: 'ADMIN',
            tenantId,
        },
    });

    // 3. HR Module
    const departments = [
        { name: 'Information Technology', code: 'IT' },
        { name: 'Sales & Marketing', code: 'SALES' },
        { name: 'Human Resources', code: 'HR' },
        { name: 'Finance', code: 'FIN' },
        { name: 'Operations', code: 'OPS' },
    ];

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: { ...dept, tenantId },
        });
    }

    const itDept = await prisma.department.findUnique({ where: { code: 'IT' } });
    const salesDept = await prisma.department.findUnique({ where: { code: 'SALES' } });

    const employees = [
        { firstName: 'John', lastName: 'Doe', email: 'john@demo.lk', employeeId: 'EMP001', position: 'CTO', departmentId: itDept?.id },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@demo.lk', employeeId: 'EMP002', position: 'Sales Manager', departmentId: salesDept?.id },
        { firstName: 'Bob', lastName: 'Wilson', email: 'bob@demo.lk', employeeId: 'EMP003', position: 'Developer', departmentId: itDept?.id },
    ];

    for (const emp of employees) {
        await prisma.employee.upsert({
            where: { employeeId: emp.employeeId },
            update: { email: emp.email, position: emp.position, departmentId: emp.departmentId },
            create: { ...emp, hireDate: new Date(), tenantId },
        });
    }

    // 4. Accounting Module
    const accounts = [
        { code: '1000', name: 'Cash', type: 'ASSET' as AccountType, balance: 50000 },
        { code: '1100', name: 'Accounts Receivable', type: 'ASSET' as AccountType },
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' as AccountType },
        { code: '4000', name: 'Sales Revenue', type: 'REVENUE' as AccountType },
        { code: '5000', name: 'Operating Expenses', type: 'EXPENSE' as AccountType },
    ];

    for (const acc of accounts) {
        await prisma.account.upsert({
            where: { code_tenantId: { code: acc.code, tenantId } },
            update: { name: acc.name, type: acc.type },
            create: { ...acc, tenantId },
        });
    }

    // 5. CRM & Sales
    const customers = [
        { name: 'Global Tech Solutions', email: 'info@globaltech.com', company: 'Global Tech', type: 'BUSINESS' },
        { name: 'Alice Johnson', email: 'alice@gmail.com', type: 'INDIVIDUAL' },
        { name: 'Innovate Inc', email: 'contact@innovate.io', company: 'Innovate', type: 'BUSINESS' },
    ];

    for (const cust of customers) {
        const existing = await prisma.customer.findFirst({ where: { email: cust.email, tenantId } });
        if (!existing) {
            await prisma.customer.create({ data: { ...cust, tenantId } });
        }
    }

    // 6. Inventory & Products
    const products = [
        { name: 'Laptop Pro 15', sku: 'LAP-001', salePrice: 1500, costPrice: 1000, stockQty: 50, category: 'Hardware' },
        { name: 'Wireless Mouse', sku: 'MOU-001', salePrice: 25, costPrice: 10, stockQty: 200, category: 'Accessories' },
        { name: 'Cloud Subscription', sku: 'CLD-001', salePrice: 99, costPrice: 20, stockQty: 0, type: 'SERVICE' as ProductType, category: 'Software' },
    ];

    for (const prod of products) {
        await prisma.product.upsert({
            where: { sku: prod.sku },
            update: { name: prod.name, salePrice: prod.salePrice, costPrice: prod.costPrice },
            create: { ...prod, tenantId },
        });
    }

    // 7. Hotel & Restaurant
    const hotelBranch = await prisma.hotelBranch.upsert({
        where: { tenantId_code: { tenantId, code: 'H01' } },
        update: {},
        create: { name: 'Main Hotel', code: 'H01', city: 'Colombo', country: 'Sri Lanka', tenantId },
    });

    for (let i = 1; i <= 5; i++) {
        await prisma.hotelRoom.upsert({
            where: { roomNumber_tenantId: { roomNumber: `10${i}`, tenantId } },
            update: { branchId: hotelBranch.id },
            create: { roomNumber: `10${i}`, roomType: 'Deluxe', basePrice: 100 + i * 10, branchId: hotelBranch.id, tenantId },
        });
    }

    for (let i = 1; i <= 5; i++) {
        await prisma.restaurantTable.upsert({
            where: { number_tenantId: { number: `T${i}`, tenantId } },
            update: {},
            create: { number: `T${i}`, capacity: i % 2 === 0 ? 4 : 2, tenantId },
        });
    }

    // 8. Real Estate
    const properties = [
        { title: 'Modern Villa', address: '45 Lake Drive', city: 'Colombo', price: 750000, propertyType: 'HOUSE', listingType: 'SALE' },
        { title: 'City Center Studio', address: '12 Main St', city: 'Kandy', price: 1200, propertyType: 'APARTMENT', listingType: 'RENT' },
    ];

    for (const prop of properties) {
        const existing = await prisma.property.findFirst({ where: { title: prop.title, tenantId } });
        if (!existing) {
            await prisma.property.create({ data: { ...prop, state: 'Western', zipCode: '00100', country: 'Sri Lanka', tenantId } });
        }
    }

    // 9. Education
    const courses = [
        { title: 'Business Management 101', slug: 'bm-101', level: 'BEGINNER' as CourseLevel, isPublished: true },
        { title: 'Advanced Accounting', slug: 'adv-acc', level: 'ADVANCED' as CourseLevel, isPublished: true },
    ];

    for (const c of courses) {
        await prisma.course.upsert({
            where: { slug_tenantId: { slug: c.slug, tenantId } },
            update: { title: c.title, isPublished: c.isPublished },
            create: { ...c, tenantId },
        });
    }

    // 10. Manufacturing
    const existingMO = await prisma.manufacturingOrder.findUnique({ where: { orderNumber: 'MO-001' } });
    if (!existingMO) {
        await prisma.manufacturingOrder.create({
            data: {
                orderNumber: 'MO-001',
                productName: 'Laptop Pro 15',
                quantityToProduce: 10,
                status: 'IN_PROGRESS',
                tenantId,
            },
        });
    }

    // 11. Projects
    const existingProject = await prisma.project.findUnique({ where: { code: 'MKT-Q4' } });
    if (!existingProject) {
        const project = await prisma.project.create({
            data: {
                name: 'Q4 Marketing Campaign',
                code: 'MKT-Q4',
                status: 'PLANNING',
                tenantId,
            },
        });

        await prisma.task.create({
            data: {
                title: 'Design Banners',
                projectId: project.id,
                status: 'TODO',
                tenantId,
            },
        });
    }

    // 12. Support
    const existingTicket = await prisma.ticket.findUnique({ where: { number: 'TKT-1001' } });
    if (!existingTicket) {
        await prisma.ticket.create({
            data: {
                number: 'TKT-1001',
                subject: 'Cannot access email',
                description: 'User reports 403 error on login',
                status: 'OPEN',
                priority: 'HIGH',
                tenantId,
            },
        });
    }

    // 13. AI Assistant
    const existingAgent = await prisma.aIAgent.findFirst({ where: { name: 'ERP Assistant', tenantId } });
    if (!existingAgent) {
        await prisma.aIAgent.create({
            data: {
                name: 'ERP Assistant',
                type: 'CHAT_ASSISTANT',
                description: 'General purpose ERP helper',
                tenantId,
            },
        });
    }

    console.log('🌱 Robust comprehensive seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
