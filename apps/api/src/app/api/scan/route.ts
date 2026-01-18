import { NextRequest } from 'next/server';
import { verifyAuth, jsonResponse, errorResponse } from '@/lib/auth';
import { analyzeReceiptImage } from '@/lib/openai';
import { ScanResult } from '@finsnap/shared';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { error: authError, user } = await verifyAuth(request);
    if (authError || !user) {
      return errorResponse(authError || 'Unauthorized', 401);
    }

    // Get the image from request body
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return errorResponse('No image provided');
    }

    // Analyze the image with AI
    const items = await analyzeReceiptImage(image);

    const result: ScanResult = {
      success: true,
      items,
    };

    return jsonResponse(result);
  } catch (error: any) {
    console.error('Scan error:', error);
    return errorResponse(error.message || 'Failed to scan image', 500);
  }
}
