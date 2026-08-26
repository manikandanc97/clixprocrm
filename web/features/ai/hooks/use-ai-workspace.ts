'use client';

import { useChat } from '@ai-sdk/react';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DefaultChatTransport } from 'ai';
import { useAuth } from '@/features/auth/components/auth-provider';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ChatSession, ModelOption, CrmContextData } from '../types';

export const STORAGE_KEY = 'clixpro_ai_chat_sessions_v1';
export const STORAGE_KEY_SELECTED_MODEL = 'clixpro_ai_selected_model_v1';

export const DEFAULT_WORKSPACE_MODELS: ModelOption[] = [
  {
    modelKey: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    friendlyLabel: 'Gemini 2.5 Flash',
    badge: 'Fast',
    badgeInfo: 'ⓘ',
    description: 'Ultra-fast, economical intelligence for daily conversational CRM tasks.',
    isLocked: false,
    hasSubmenu: true,
  },
  {
    modelKey: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    friendlyLabel: 'Gemini 2.5 Pro',
    badge: 'Deep Analysis',
    badgeInfo: 'ⓘ',
    description: 'Deep reasoning, complex document understanding, and multi-step CRM action execution.',
    isLocked: false,
    hasSubmenu: true,
  },
  {
    modelKey: 'claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet (Thinking)',
    friendlyLabel: 'Claude 3.7 Sonnet',
    badge: 'Thinking',
    description: 'Hybrid reasoning and state-of-the-art business analysis.',
    isLocked: false,
  },
  {
    modelKey: 'gpt-4o',
    displayName: 'GPT-4o (Omni)',
    friendlyLabel: 'GPT-4o',
    badge: 'Omni',
    description: 'Flagship high-intelligence multimodal model for advanced sales intelligence.',
    isLocked: false,
  },
  {
    modelKey: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    friendlyLabel: 'GPT-4o Mini',
    badge: 'Fast',
    badgeInfo: 'ⓘ',
    description: 'Lightweight, cost-efficient model for fast standard sales responses.',
    isLocked: false,
    hasSubmenu: true,
  },
];

export function extractMessageText(m: any): string {
  if (!m) return '';
  if (typeof m.content === 'string' && m.content.trim()) return m.content;
  if (m.parts && Array.isArray(m.parts)) {
    const textPart = m.parts.find((p: any) => p.type === 'text' && p.text);
    if (textPart && typeof textPart.text === 'string') return textPart.text;
  }
  return '';
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(minutes / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function useAIWorkspace() {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [activeContext, setActiveContext] = useState<CrmContextData | null>(null);

  // Entitled AI Models state
  const [entitledModels, setEntitledModels] = useState<ModelOption[]>(DEFAULT_WORKSPACE_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [planName, setPlanName] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [globalAiEnabled, setGlobalAiEnabled] = useState<boolean>(true);

  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const activeContextRef = useRef(activeContext);
  activeContextRef.current = activeContext;

  const isSuperAdmin = useMemo(() => {
    const norm = (auth?.user?.role || '').toUpperCase().trim().replace(/[\s_]+/g, '');
    return (
      norm === 'SUPERADMIN' ||
      (auth?.user as any)?.isSuperAdmin === true ||
      (pathname ? pathname.startsWith('/super-admin') : false)
    );
  }, [auth?.user, pathname]);

  const isSuperAdminRef = useRef(isSuperAdmin);
  isSuperAdminRef.current = isSuperAdmin;

  // Load URL query context on initial mount
  useEffect(() => {
    const contextParam = searchParams.get('context');
    const typeParam = searchParams.get('type') as any;
    const idParam = searchParams.get('id');

    if (contextParam) {
      setActiveContext({
        name: contextParam,
        type: typeParam || 'general',
        id: idParam || undefined,
      });
    }
  }, [searchParams]);

  // Restore sessions from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        }
      }
      const storedModel = localStorage.getItem(STORAGE_KEY_SELECTED_MODEL);
      if (storedModel) {
        setSelectedModel(storedModel);
      }
    } catch (e) {
      console.warn('[ClixPro AI] LocalStorage load failed:', e);
    }
  }, []);

  // Save selected model
  useEffect(() => {
    if (selectedModel) {
      try {
        localStorage.setItem(STORAGE_KEY_SELECTED_MODEL, selectedModel);
      } catch {}
    }
  }, [selectedModel]);

  const saveSessionsToStorage = useCallback((updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (err) {
      console.error('[ClixPro AI] Error saving sessions:', err);
    }
  }, []);

  // Fetch model options from backend and map dynamically based on Super Admin / Plan Entitlements
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/ai/models');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setGlobalAiEnabled(json.data.globalAiEnabled !== false);
            setAiEnabled(json.data.aiEnabled !== false);

            const currentPlanId = (json.data.planId || 'free').toLowerCase();
            const hasAdvancedTier =
              isSuperAdmin ||
              currentPlanId === 'growth' ||
              currentPlanId === 'pro' ||
              currentPlanId === 'business' ||
              currentPlanId === 'enterprise' ||
              currentPlanId === 'pro_plus';

            const rawModels: any[] = Array.isArray(json.data.models) ? json.data.models : [];

            // Map canonical models dynamically with live backend data and entitlements
            const mappedModels: ModelOption[] = DEFAULT_WORKSPACE_MODELS.map((canonical) => {
              const backendModel = rawModels.find(
                (m) => m.modelKey === canonical.modelKey || m.id === canonical.modelKey
              );

              // Determine if model is unlocked for current tier:
              // Free tier gets: Gemini 2.5 Flash and GPT-4o Mini
              // Paid tiers & SuperAdmin get all 5 models unlocked
              const isFreeTierModel =
                canonical.modelKey === 'gemini-2.5-flash' || canonical.modelKey === 'gpt-4o-mini';
              const isLocked = !isSuperAdmin && !hasAdvancedTier && !isFreeTierModel;

              return {
                ...canonical,
                displayName: backendModel?.displayName || canonical.displayName,
                description: backendModel?.description || canonical.description,
                isLocked,
                requiredPlan: isLocked ? 'Pro / Growth Tier' : undefined,
              };
            });

            setEntitledModels(mappedModels);

            if (json.data.planName) {
              setPlanName(json.data.planName);
            }
          }
        }
      } catch (err) {
        console.error('[ClixPro AI] Failed to load models:', err);
      }
    }
    loadModels();
  }, [isSuperAdmin]);

  // Setup transport
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/ai/chat',
      fetch: async (url: any, options: any) => {
        try {
          const fullUrl = url.startsWith('http')
            ? url
            : typeof window !== 'undefined'
            ? `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`
            : url;

          const headers = new Headers(options.headers || {});

          if (typeof window !== 'undefined') {
            const currency = localStorage.getItem('orbit_currency') || 'INR';
            headers.set('X-Currency', currency);

            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.access_token) {
              headers.set('Authorization', `Bearer ${session.access_token}`);
            }
          }

          // Inject selected model and CRM context if present
          let payload = options.body;
          if (options.body) {
            try {
              const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
              
              // If context exists, prepend a brief context statement to user message payload if needed
              const currentCtx = activeContextRef.current;
              payload = JSON.stringify({
                ...parsed,
                model: selectedModelRef.current,
                isSuperAdmin: isSuperAdminRef.current,
                context: currentCtx ? { name: currentCtx.name, type: currentCtx.type, id: currentCtx.id } : undefined,
              });
            } catch {}
          }

          const response = await fetch(fullUrl, {
            method: options.method,
            body: payload,
            headers: headers,
          });

          if (!response.ok) {
            const clonedRes = response.clone();
            const text = await clonedRes.text().catch(() => '');
            console.error('[ClixPro AI] Request failed:', response.status, text);
          }

          return response;
        } catch (err: any) {
          console.error('[ClixPro AI] Connection error:', err);
          throw err;
        }
      },
    });
  }, []);

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
    stop,
    clearError,
  } = useChat({
    transport,
    onError: (err) => {
      let msg = err?.message || 'An unexpected error occurred.';
      if (msg.startsWith('<!DOCTYPE html>')) {
        msg = 'Server returned HTML error (404/500). Please check backend connection.';
      }
      console.error('[ClixPro AI Error]:', msg);
    },
  });

  // Sync messages into active chat session
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.role === 'user');
    const firstText = firstUserMsg ? extractMessageText(firstUserMsg) : '';
    const sessionTitle =
      firstText.length > 40
        ? `${firstText.slice(0, 40)}...`
        : firstText || 'New Conversation';

    setSessions((prevSessions) => {
      let updated: ChatSession[];
      if (!currentSessionId) {
        const newSessionId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `session_${Date.now()}`;

        const newSession: ChatSession = {
          id: newSessionId,
          title: sessionTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          context: activeContextRef.current?.name || null,
          messages: messages,
        };

        setCurrentSessionId(newSessionId);
        updated = [newSession, ...prevSessions.filter((s) => s.id !== newSessionId)];
      } else {
        const existingIdx = prevSessions.findIndex((s) => s.id === currentSessionId);

        if (existingIdx !== -1) {
          const existing = prevSessions[existingIdx];
          const updatedSession: ChatSession = {
            ...existing,
            title: existing.title === 'New Conversation' ? sessionTitle : existing.title,
            updatedAt: Date.now(),
            context:
              existing.context ||
              (activeContextRef.current?.name ? activeContextRef.current.name : null),
            messages: messages,
          };
          updated = [
            updatedSession,
            ...prevSessions.filter((s) => s.id !== currentSessionId),
          ];
        } else {
          const newSession: ChatSession = {
            id: currentSessionId,
            title: sessionTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            context: activeContextRef.current?.name || null,
            messages: messages,
          };
          updated = [newSession, ...prevSessions];
        }
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      return updated;
    });
  }, [messages, currentSessionId]);

  const isLoading = status === 'submitted' || status === 'streaming';

  const startNewChat = useCallback(() => {
    if (isLoading) {
      stop();
    }
    setCurrentSessionId(null);
    setMessages([]);
    clearError?.();
  }, [isLoading, stop, setMessages, clearError]);

  const selectSession = useCallback((session: ChatSession) => {
    if (isLoading) {
      stop();
    }
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    clearError?.();
    if (session.context) {
      setActiveContext({ name: session.context, type: 'general' });
    }
  }, [isLoading, stop, setMessages, clearError]);

  const deleteSession = useCallback((sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(updated);

    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
    toast.success('Conversation deleted');
  }, [sessions, currentSessionId, saveSessionsToStorage, setMessages]);

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    toast.success('Conversation renamed');
  }, [sessions, saveSessionsToStorage]);

  const togglePinSession = useCallback((sessionId: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, isPinned: !s.isPinned, updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    const target = updated.find((s) => s.id === sessionId);
    toast.success(target?.isPinned ? 'Conversation pinned' : 'Conversation unpinned');
  }, [sessions, saveSessionsToStorage]);

  const toggleArchiveSession = useCallback((sessionId: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, isArchived: !s.isArchived, updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    const target = updated.find((s) => s.id === sessionId);
    toast.success(target?.isArchived ? 'Conversation archived' : 'Conversation unarchived');
  }, [sessions, saveSessionsToStorage]);

  const clearAllHistory = useCallback(() => {
    if (isLoading) {
      stop();
    }
    saveSessionsToStorage([]);
    setCurrentSessionId(null);
    setMessages([]);
    clearError?.();
    toast.success('All conversation history cleared');
  }, [isLoading, stop, saveSessionsToStorage, setMessages, clearError]);

  // Grouped sessions for sidebar
  const groupedSessions = useMemo(() => {
    const query = historySearchQuery.trim().toLowerCase();
    const filtered = sessions.filter((s) => {
      if (!query) return true;
      const titleMatch = s.title.toLowerCase().includes(query);
      const messagesMatch = s.messages?.some((m) =>
        extractMessageText(m).toLowerCase().includes(query)
      );
      return titleMatch || messagesMatch;
    });

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const older: ChatSession[] = [];
    const archived: ChatSession[] = [];

    for (const session of filtered) {
      if (session.isArchived) {
        archived.push(session);
        continue;
      }
      if (session.isPinned) {
        pinned.push(session);
        continue;
      }

      const time = session.updatedAt || session.createdAt || now;
      const diff = now - time;

      if (diff < oneDay) {
        today.push(session);
      } else if (diff < 2 * oneDay) {
        yesterday.push(session);
      } else if (diff < sevenDays) {
        previous7Days.push(session);
      } else {
        older.push(session);
      }
    }

    return {
      pinned,
      today,
      yesterday,
      previous7Days,
      older,
      archived,
      totalCount: sessions.length,
      filteredCount: filtered.length,
    };
  }, [sessions, historySearchQuery]);

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    if (sendMessage) {
      sendMessage({ text });
    }
  }, [isLoading, sendMessage]);

  const handleConfirmAction = useCallback((promptText: string) => {
    if (sendMessage) {
      sendMessage({ text: promptText });
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    status,
    stop,
    clearError,
    setMessages,
    sendMessage: handleSendMessage,
    confirmAction: handleConfirmAction,
    
    // Sessions
    sessions,
    currentSessionId,
    groupedSessions,
    historySearchQuery,
    setHistorySearchQuery,
    startNewChat,
    selectSession,
    deleteSession,
    renameSession,
    togglePinSession,
    toggleArchiveSession,
    clearAllHistory,

    // Context & Models
    activeContext,
    setActiveContext,
    clearContext: () => setActiveContext(null),
    entitledModels,
    selectedModel,
    setSelectedModel,
    planName,
    aiEnabled,
    globalAiEnabled,
    isSuperAdmin,
  };
}
