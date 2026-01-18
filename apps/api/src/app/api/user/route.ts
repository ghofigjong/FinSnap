import { NextRequest } from 'next/server';
import { verifyAuth, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError, user } = await verifyAuth(request);
    if (authError || !user) {
      return errorResponse(authError || 'Unauthorized', 401);
    }

    return jsonResponse({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
      },
    });
  } catch (error: any) {
    console.error('User error:', error);
    return errorResponse(error.message || 'Failed to get user', 500);
  }
}
