'use client';

import React, { useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Briefcase,
  CalendarCheck,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/features/auth/components/auth-provider';
import { getAuthorizedQuickActions } from '@/shared/lib/ai/ai-capabilities';

interface AIEmptyWorkspaceProps {
  onSelectPrompt: (prompt: string) => void;
  userName?: string;
  isSuperAdmin?: boolean;
}

export function AIEmptyWorkspace({
  onSelectPrompt,
  userName,
  isSuperAdmin = false,
}: AIEmptyWorkspaceProps) {
  const auth = useAuth();
  const permissions = auth?.access?.permissions || auth?.user?.permissions;
  const role = auth?.user?.role;

  const quickActions = useMemo(() => {
    return getAuthorizedQuickActions(
      permissions,
      isSuperAdmin ? 'SUPER_ADMIN' : role,
      4
    );
  }, [permissions, role, isSuperAdmin]);

  // Default suggestions if none generated
  const suggestions = useMemo(() => {
    if (quickActions.length > 0) {
      return quickActions.map((qa) => ({
        id: qa.id,
        label: qa.label,
        prompt: qa.prompt,
        icon: qa.iconName === 'TrendingUp' ? TrendingUp :
              qa.iconName === 'Briefcase' ? Briefcase :
              qa.iconName === 'Calendar' ? CalendarCheck :
              qa.iconName === 'Building2' ? Building2 :
              qa.iconName === 'Activity' ? Activity :
              qa.iconName === 'ShieldCheck' ? ShieldCheck :
              qa.iconName === 'FileText' ? FileText :
              qa.iconName === 'Users' ? Users : Flame,
      }));
    }

    if (isSuperAdmin) {
      return [
        { id: '1', label: 'Platform overview & MRR', prompt: 'Show platform overview, active tenants count, and MRR metrics.', icon: Activity },
        { id: '2', label: 'Tenants growth trend', prompt: 'Show monthly organization growth and user registration trends.', icon: TrendingUp },
        { id: '3', label: 'List active organizations', prompt: 'List all active organizations, tenant plans, and usage status.', icon: Building2 },
        { id: '4', label: 'Recent security audit logs', prompt: 'Show recent platform audit logs and security activities.', icon: ShieldCheck },
      ];
    }

    return [
      { id: '1', label: 'Analyze my sales performance', prompt: 'Analyze my current sales performance, pipeline health, and top deals.', icon: TrendingUp },
      { id: '2', label: 'Find hot leads needing follow-up', prompt: 'Show my hot leads that have not been contacted in the last 7 days.', icon: Flame },
      { id: '3', label: 'Check open pipeline deals', prompt: 'What are my open deals in the pipeline and their win probabilities?', icon: Briefcase },
      { id: '4', label: 'Show pending tasks & follow-ups', prompt: 'What are my pending tasks and upcoming client follow-ups due today?', icon: CalendarCheck },
    ];
  }, [quickActions, isSuperAdmin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] max-w-xl mx-auto px-4 text-center select-none animate-in fade-in zoom-in-95 duration-300">
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center mb-5 shadow-xs">
        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
      </div>

      {/* Greeting Title */}
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display mb-1.5">
        How can I help{userName ? `, ${userName}` : ''}?
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
        {isSuperAdmin
          ? 'Your intelligent platform assistant for tenant analytics, security audits, and system metrics.'
          : 'Your enterprise CRM assistant for analyzing deals, managing leads, and executing operations.'}
      </p>

      {/* Suggestion Chips 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {suggestions.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-sm text-left transition-all duration-150 group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                <IconComp className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-medium text-foreground group-hover:text-primary truncate transition-colors">
                  {item.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
