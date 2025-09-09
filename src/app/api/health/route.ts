import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar se consegue conectar com a API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    
    let apiStatus = 'unknown';
    try {
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout de 5 segundos
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        apiStatus = 'connected';
      } else {
        apiStatus = 'error';
      }
    } catch (error) {
      apiStatus = 'disconnected';
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: apiStatus,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
    }, { status: 500 });
  }
}

