import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatSuccessResponse, formatPaginatedResponse } from '@/lib/error-handler';
import { tryCatch } from '@/lib/error-handler';
import { generateDefaultModulePermissions } from '@/lib/modules';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return tryCatch(async () => {
    const user = await getCurrentUser();

    console.log('🔍 GET /api/settings/users - User info:', {
      email: user?.email,
      role: user?.role,
      tenantId: user?.tenantId,
      hasUser: !!user,
      hasTenantId: !!user?.tenantId
    });

    if (!user?.tenantId) {
      console.error('❌ No authenticated user found. Please log in.');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to access user management' },
        { status: 401 }
      );
    }

    console.log('✅ Fetching users for tenant:', user.tenantId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const role = searchParams.get('role') as 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | null;
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {
      tenantId: user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      formatPaginatedResponse(users, page, limit, total)
    );
  }, 'Failed to fetch users');
}

export async function POST(request: NextRequest) {
  return tryCatch(async () => {
    const user = await getCurrentUser();

    console.log('🔍 POST /api/settings/users - User info:', {
      email: user?.email,
      role: user?.role,
      tenantId: user?.tenantId,
      hasUser: !!user,
      hasTenantId: !!user?.tenantId
    });

    if (!user?.tenantId) {
      console.error('❌ No tenant ID found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    // Note: In development, the user.role might be 'ADMIN' from session or the user might be a super admin
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    console.log('🔐 Permission check:', {
      userRole: user.role,
      isAdmin,
      checksPassed: user.role === 'ADMIN',
      checksPassedAlt: user.role === 'SUPERADMIN'
    });

    if (!isAdmin) {
      console.error('❌ Permission denied for user:', {
        email: user.email,
        role: user.role,
        roleType: typeof user.role,
        tenantId: user.tenantId
      });
      return NextResponse.json(
        { error: 'Insufficient permissions. Only administrators can create users.' },
        { status: 403 }
      );
    }

    console.log('✅ Permission granted - proceeding with user creation');

    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: body.email,
        tenantId: user.tenantId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Password is required - generate temporary password if not provided
    let hashedPassword: string;
    if (body.password) {
      const bcrypt = await import('bcryptjs');

      hashedPassword = await bcrypt.default.hash(body.password, 10);
    } else {
      // Generate a random temporary password
      const bcrypt = await import('bcryptjs');

      const crypto = await import('crypto');

      const tempPassword = crypto.randomBytes(16).toString('hex');
      hashedPassword = await bcrypt.default.hash(tempPassword, 10);
    }

    // Determine user role (default to USER if not provided)
    const userRole = (body.role as 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER') || 'USER';

    // Generate module permissions
    let modulePermissions;

    if (body.modulePermissions && typeof body.modulePermissions === 'object') {
      // If custom permissions provided, merge with defaults to ensure structure
      const defaultPermissions = generateDefaultModulePermissions(userRole);
      modulePermissions = { ...defaultPermissions, ...body.modulePermissions };

      // Security: Ensure ADMIN always has full access regardless of input
      if (userRole === 'ADMIN') {
        modulePermissions = generateDefaultModulePermissions('ADMIN');
      }
    } else {
      // Fallback to role-based defaults
      modulePermissions = generateDefaultModulePermissions(userRole);
    }

    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        tenantId: user.tenantId,
        isActive: body.isActive !== undefined ? body.isActive : true,
        role: userRole,
        modulePermissions: modulePermissions as any,
      },
    });

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      formatSuccessResponse(userWithoutPassword, 'User created successfully with module permissions'),
      { status: 201 }
    );
  }, 'Failed to create user');
}

