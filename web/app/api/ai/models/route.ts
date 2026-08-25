import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let authToken: string | undefined;

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7).trim();
    }

    if (!authToken) {
      try {
        const supabase = await createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          authToken = session.access_token;
        }
      } catch {}
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const backendRes = await fetch(`${apiUrl}/ai/models`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!backendRes.ok) {
      // Fallback to default core models if backend is starting
      return NextResponse.json({
        success: true,
        data: {
          planId: 'pro',
          planName: 'Professional',
          models: [
            {
              id: 'gemini-3.6-flash',
              modelKey: 'gemini-3.6-flash',
              displayName: 'Gemini 3.6 Flash (Production Core)',
              provider: 'google',
              contextWindow: 1048576,
              capabilities: ['chat', 'summarization', 'lead_scoring', 'function_calling'],
              isDefault: true,
            },
          ],
          defaultModelKey: 'gemini-3.6-flash',
          allowedCapabilities: ['*'],
        },
      });
    }

    const json = await backendRes.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to resolve entitled AI models',
      },
      { status: 500 }
    );
  }
}
