import { NextRequest } from 'next/server';
import { verifyAuth, jsonResponse, errorResponse } from '@/lib/auth';
import { analyzeImage, ScanProvider } from '@/lib/scanner';
import { supabaseAdmin } from '@/lib/supabase';
import { ScanResult } from '@finsnap/shared';

export const maxDuration = 30;

const FREE_DAILY_LIMIT = 3;
const PRO_DAILY_LIMIT = 25;

async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  const today = new Date().toISOString().split('T')[0];

  // Get user plan
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = profile?.plan ?? 'free';
  const limit = plan === 'pro' ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  // Upsert usage row and increment atomically
  const { data: usage } = await supabaseAdmin
    .from('scan_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const current = usage?.count ?? 0;

  if (current >= limit) {
    return { allowed: false, current, limit, plan };
  }

  // Increment (insert or update)
  await supabaseAdmin.from('scan_usage').upsert(
    { user_id: userId, date: today, count: current + 1 },
    { onConflict: 'user_id,date' }
  );

  return { allowed: true, current: current + 1, limit, plan };
}

export async function POST(request: NextRequest) {
  try {
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
    const { image, provider = 'finsnap', apiKey = '', geminiModel } = body;

    if (!image) {
      return errorResponse('No image provided');
    }

    // Rate limiting only applies to the FinSnap embedded key
    if (provider === 'finsnap') {
      const usage = await checkAndIncrementUsage(user.id);
      if (!usage.allowed) {
        const isFreePlan = usage.plan === 'free';
        return errorResponse(
          isFreePlan
            ? `Daily scan limit reached (${usage.limit}/day on Free plan). Upgrade to Pro for ${PRO_DAILY_LIMIT} scans/day, or add your own Gemini API key for unlimited scanning.`
            : `Daily scan limit reached (${usage.limit}/day on Pro plan). Add your own Gemini API key for unlimited scanning.`,
          429
        );
      }
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
