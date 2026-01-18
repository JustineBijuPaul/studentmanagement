import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';

/**
 * GET /api/health/deep - Deep health check with database connectivity
 * 
 * Use this for monitoring/observability, NOT for ALB health checks.
 * This endpoint tests database connectivity and may be slow.
 */
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown' as 'ok' | 'error' | 'unknown',
    },
  };

  // Test database connection with timeout
  try {
    const connection = await Promise.race([
      getDbConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 3000)
      ),
    ]);
    
    await Promise.race([
      (connection as any).query('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 2000)
      ),
    ]);
    
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
    console.error('Deep health check - database error:', error);
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}
