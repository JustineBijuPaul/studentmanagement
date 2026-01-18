import { NextResponse } from 'next/server';

/**
 * GET /api/health - Lightweight health check endpoint for AWS Load Balancer
 * 
 * This endpoint does NOT check the database to avoid health check failures
 * when the DB is slow or temporarily unavailable.
 * 
 * The ALB only needs to know if the application server is running,
 * not if downstream services are available.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
