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
    <div className="w-full max-w-lg mx-auto px-3 sm:px-4 text-center flex flex-col items-center justify-center select-none animate-in fade-in zoom-in-95 duration-200 py-2">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center mb-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
      </div>

      {/* Greeting Title */}
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-display mb-1">
        How can I help{userName ? `, ${userName}` : ''}?
      </h2>
      <p className="text-xs text-muted-foreground mb-4 max-w-sm leading-relaxed">
        {isSuperAdmin
          ? 'Your platform assistant for tenant analytics, audits, and metrics.'
          : 'Your enterprise CRM assistant for analyzing deals and managing leads.'}
      </p>

      {/* Suggestion Chips 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {suggestions.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-2xs text-left transition-all duration-150 group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                <IconComp className="w-3.5 h-3.5" />
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
