import { NextRequest } from 'next/server';
import { verifyAuth, jsonResponse, errorResponse } from '@/lib/auth';
import { analyzeImage, ScanProvider } from '@/lib/scanner';
import { ScanResult } from '@finsnap/shared';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { error: authError, user } = await verifyAuth(request);
    if (authError || !user) {
      return errorResponse(authError || 'Unauthorized', 401);
    }

    const body = await request.json();
    const { image, provider = 'gemini', apiKey = '', geminiModel } = body;

    if (!image) {
      return errorResponse('No image provided');
    }

    const items = await analyzeImage(image, provider as ScanProvider, apiKey, geminiModel);

    const result: ScanResult = { success: true, items };
    return jsonResponse(result);
  } catch (error: any) {
    console.error('Scan error:', error);
    return errorResponse(error.message || 'Failed to scan image', 500);
  }
}
