import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'FinSnap API',
    version: '1.0.0',
    status: 'healthy',
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}
