import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  isStepCount,
} from 'ai';
import { getMcpTools } from '@/lib/mcp/mcp-client';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getApiKey(): string | undefined {
  return (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

function sanitizeMessages(messages: any[]): any[] {
  return (messages || []).map((m) => {
    if (typeof m === 'string') {
      return { role: 'user', parts: [{ type: 'text', text: m }] };
    }
    if (m.parts && Array.isArray(m.parts) && m.parts.length > 0) {
      return m;
    }
    if (typeof m.content === 'string') {
      return { ...m, role: m.role || 'user', parts: [{ type: 'text', text: m.content }] };
    }
    if (Array.isArray(m.content)) {
      return { ...m, role: m.role || 'user', parts: m.content };
    }
    return { ...m, role: m.role || 'user', parts: [{ type: 'text', text: '' }] };
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Session & Token Authentication Validation
    let authToken: string | undefined;

    // Check Bearer Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7).trim();
    }

    // Fallback to Supabase Server Cookie Session
    if (!authToken) {
      try {
        const supabase = await createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          authToken = session.access_token;
        }
      } catch {
        // Cookie resolution fallback
      }
    }

    if (!authToken) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: Valid Supabase authentication session is required to access ClixPro AI.',
        },
        { status: 401 }
      );
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'AI Service Configuration Error: GOOGLE_API_KEY is not configured on the server.',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const rawMessages = body.messages || [];
    const correlationId =
      req.headers.get('x-correlation-id') ||
      req.headers.get('x-request-id') ||
      `req_${crypto.randomUUID()}`;

    // 2. Instantiate Google AI Provider
    const google = createGoogleGenerativeAI({ apiKey });

    // 3. Build Authorized MCP Tools Bound to User Context
    const mcpContext = {
      authToken,
      correlationId,
    };
    const tools = getMcpTools(mcpContext);

    // 4. Determine Model & Analytical Mode
    const requestedModel = body.model || process.env.AI_MODEL || 'gemini-2.5-flash';
    const isDeepReasoningModel =
      requestedModel.toLowerCase().includes('pro') ||
      requestedModel.toLowerCase().includes('sonnet') ||
      requestedModel.toLowerCase().includes('opus') ||
      requestedModel.toLowerCase().includes('gpt-4o') ||
      requestedModel.toLowerCase().includes('thinking') ||
      body.mode === 'deep' ||
      body.deepAnalysis === true;

    // Gracefully map UI model keys to active supported Google AI Provider models
    // Active Gemini endpoint uses gemini-3.6-flash
    const providerModelKey = 'gemini-3.6-flash';

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = isDeepReasoningModel
      ? `You are ClixPro AI (Deep Analysis & Enterprise Intelligence Mode), the advanced AI CRM reasoning assistant for ClixProCRM.
Current Date: ${today}.
Default Currency: INR (₹).

DEEP REASONING & ANALYSIS RULES:
1. Conduct thorough, multi-step analysis on CRM queries (leads, pipeline velocity, deal health, customer churn risks, and sales performance).
2. Present CRM findings using clean Markdown tables, highlighted metrics, and clear root-cause breakdowns.
3. Include proactive, actionable strategic recommendations based on the live CRM data retrieved.
4. For read operations, invoke live CRM tools (list_leads, list_deals, get_pipeline, get_sales_report, etc.) to fetch authentic data.
5. If data is not found in the CRM, state clearly: "I couldn't find that information in your CRM records." Never hallucinate fake records.
6. For write operations (create/update), ALWAYS ask for explicit confirmation with proposed values before executing with confirmed=true.
7. Never expose sensitive auth tokens, passwords, API keys, or database internals.`
      : `You are ClixPro AI, the intelligent CRM assistant for ClixProCRM.
Current Date: ${today}.
Default Currency: INR (₹).

RESPONSE & TOKEN RULES:
1. Answer the user's CRM questions directly, accurately, and concisely.
2. For data queries, retrieve live CRM records and format them in clean tables or lists.
3. If information is not found in the CRM, say: "I couldn't find that information." Never hallucinate data.
4. For read operations, invoke the appropriate tool to fetch live CRM data.
5. For write operations (create/update), ask for explicit confirmation with proposed values before executing with confirmed=true.
6. Never expose sensitive tokens, passwords, secrets, internal IDs, or database internals.
7. Use clean Markdown tables when presenting multiple CRM records.`;

    const sanitized = sanitizeMessages(rawMessages);
    const modelMessages = await convertToModelMessages(sanitized, { tools });

    // 5. Orchestrate AI Stream with Selected Entitled Model
    const result = await streamText({
      model: google(providerModelKey),
      messages: modelMessages,
      system: systemPrompt,
      tools,
      stopWhen: isStepCount(5),
      temperature: isDeepReasoningModel ? 0.4 : 0.7,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        tools,
        onError: (streamError: any) => {
          const message = streamError?.message || String(streamError) || 'AI stream error occurred';
          console.error('[AI Stream Error]:', message);
          return message;
        },
      }),
    });
  } catch (error: any) {
    console.error('[AI Chat Route Error]:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'An unexpected error occurred while communicating with the AI service.',
      },
      { status: 500 }
    );
  }
}
