import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';
import { ensureDefaultBranch } from '@/lib/sales-crm/bootstrap';
import { ensurePartyForCustomerRecord } from '@/lib/sales-crm/party-sync';

// GET /api/sales/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        salesOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// PUT /api/sales/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    const body = await request.json();

    // Verify customer belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        type: body.type,
        address: body.street ?? body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
      },
    });

    try {
      const branch = await ensureDefaultBranch(tenantId);
      await ensurePartyForCustomerRecord({
        tenantId,
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: customer.type,
        address: {
          line1: customer.address,
          city: customer.city,
          state: customer.state,
          postalCode: customer.zipCode,
          country: customer.country,
        },
        branchId: branch.id,
      });
    } catch (syncError) {
      console.error('Customer party sync failed (non-blocking):', syncError);
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/sales/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'delete' });

    // Verify customer belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
