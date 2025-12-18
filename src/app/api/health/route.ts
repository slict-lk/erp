import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatSuccessResponse } from '@/lib/error-handler';
import { tryCatch } from '@/lib/error-handler';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return tryCatch(async () => {
    const startTime = Date.now();

    // Check database connection
    let databaseStatus = 'healthy';
    let databaseResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      databaseStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check environment
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ? 'configured' : 'missing',
    };

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      database: {
        status: databaseStatus,
        responseTime: databaseResponseTime,
      },
      environment,
      version: process.env.npm_package_version || '1.0.0',
    };

    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    return NextResponse.json(
      formatSuccessResponse(healthData),
      { status: statusCode }
    );
  }, 'Health check failed');
}

