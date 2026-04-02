import { NextRequest } from 'next/server';
import { verifyAuth, jsonResponse, errorResponse } from '@/lib/auth';
import { analyzeImage, ScanProvider } from '@/lib/scanner';
import { ScanResult } from '@finsnap/shared';

export const maxDuration = 30; // seconds (requires Vercel Pro for >10s)

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { error: authError, user } = await verifyAuth(request);
    if (authError || !user) {
      return errorResponse(authError || 'Unauthorized', 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Request too large or malformed. Try a lower quality image.', 413);
    }
    const { image, provider = 'gemini', apiKey = '', geminiModel } = body;

    if (!image) {
      return errorResponse('No image provided');
    }

    const items = await analyzeImage(image, provider as ScanProvider, apiKey, geminiModel);

    const result: ScanResult = { success: true, items };
    return jsonResponse(result);
  } catch (error: any) {
    console.error('[scan] Error:', {
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
    });
    return errorResponse(error.message || 'Failed to scan image', 500);
  }
}
