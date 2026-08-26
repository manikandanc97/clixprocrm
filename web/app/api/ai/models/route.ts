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
      // Fallback to default canonical CRM models if backend is starting
      return NextResponse.json({
        success: true,
        data: {
          planId: 'pro',
          planName: 'Professional',
          models: [
            {
              id: 'gemini-2.5-flash',
              modelKey: 'gemini-2.5-flash',
              displayName: 'Gemini 2.5 Flash',
              provider: 'google',
              description: 'Ultra-fast, economical intelligence for daily conversational CRM tasks.',
              contextWindow: 1048576,
              capabilities: ['chat', 'summarization', 'email_generation'],
              isDefault: true,
            },
            {
              id: 'gemini-2.5-pro',
              modelKey: 'gemini-2.5-pro',
              displayName: 'Gemini 2.5 Pro',
              provider: 'google',
              description: 'Deep reasoning, complex document understanding, and multi-step CRM action execution.',
              contextWindow: 2097152,
              capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'document_analysis', 'rag', 'function_calling', 'advanced_reasoning'],
              isDefault: false,
            },
            {
              id: 'claude-3-7-sonnet',
              modelKey: 'claude-3-7-sonnet',
              displayName: 'Claude 3.7 Sonnet (Thinking)',
              provider: 'anthropic',
              description: 'Hybrid reasoning and state-of-the-art business analysis.',
              contextWindow: 200000,
              capabilities: ['chat', 'summarization', 'document_analysis', 'advanced_reasoning'],
              isDefault: false,
            },
            {
              id: 'gpt-4o',
              modelKey: 'gpt-4o',
              displayName: 'GPT-4o (Omni)',
              provider: 'openai',
              description: 'Flagship high-intelligence multimodal model for advanced sales intelligence.',
              contextWindow: 128000,
              capabilities: ['chat', 'summarization', 'lead_scoring', 'function_calling'],
              isDefault: false,
            },
            {
              id: 'gpt-4o-mini',
              modelKey: 'gpt-4o-mini',
              displayName: 'GPT-4o Mini',
              provider: 'openai',
              description: 'Lightweight, cost-efficient model for fast standard sales responses.',
              contextWindow: 128000,
              capabilities: ['chat', 'summarization', 'email_generation'],
              isDefault: false,
            },
          ],
          defaultModelKey: 'gemini-2.5-flash',
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
