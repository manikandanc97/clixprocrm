'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  SquarePen,
  Search,
  X,
  MessageSquare,
  Pin,
  Archive,
  Trash2,
  Edit2,
  MoreHorizontal,
  Check,
  Clock,
} from 'lucide-react';
import { ChatSession } from '../types';
import { formatRelativeTime } from '../hooks/use-ai-workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface AIConversationSidebarProps {
  groupedSessions: {
    pinned: ChatSession[];
    today: ChatSession[];
    yesterday: ChatSession[];
    previous7Days: ChatSession[];
    older: ChatSession[];
    archived: ChatSession[];
    totalCount: number;
    filteredCount: number;
  };
  currentSessionId: string | null;
  historySearchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSession: (session: ChatSession) => void;
  onStartNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onToggleArchiveSession: (id: string) => void;
  onClearAllHistory: () => void;
  onCloseMobileDrawer?: () => void;
}

export function AIConversationSidebar({
  groupedSessions,
  currentSessionId,
  historySearchQuery,
  onSearchChange,
  onSelectSession,
  onStartNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onToggleArchiveSession,
  onClearAllHistory,
  onCloseMobileDrawer,
}: AIConversationSidebarProps) {
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingSessionId(session.id);
    setRenameValue(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    if (renameValue.trim()) {
      onRenameSession(sessionId, renameValue.trim());
    }
    setRenamingSessionId(null);
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === currentSessionId;
    const isRenaming = renamingSessionId === session.id;

    if (isRenaming) {
      return (
        <div
          key={session.id}
          className="p-2 rounded-xl bg-card border border-primary/40 shadow-xs flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(session.id);
              if (e.key === 'Escape') setRenamingSessionId(null);
            }}
            className="h-7 text-xs px-2 py-0.5 bg-background border-border"
          />
          <button
            onClick={() => handleSaveRename(session.id)}
            className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRenamingSessionId(null)}
            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session);
          onCloseMobileDrawer?.();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
          isActive
            ? 'bg-primary/10 text-primary font-medium shadow-2xs border border-primary/20'
            : 'text-foreground/80 hover:text-foreground hover:bg-muted/50 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
          {session.isPinned ? (
            <Pin className="w-3.5 h-3.5 shrink-0 text-primary" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
          <span className="truncate flex-1">{session.title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                title="Conversation options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={(e) => startRename(session, e)}>
                <Edit2 className="w-3.5 h-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePinSession(session.id)}>
                <Pin className="w-3.5 h-3.5 mr-2" />
                {session.isPinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleArchiveSession(session.id)}>
                <Archive className="w-3.5 h-3.5 mr-2" />
                {session.isArchived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingSessionId(session.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 mb-4">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </div>
        <div className="space-y-0.5">{items.map(renderSessionItem)}</div>
      </div>
    );
  };

  const hasAnySessions = groupedSessions.totalCount > 0;

  return (
    <div className="w-full h-full flex flex-col bg-card/60 border-r border-border/60 select-none">
      {/* Top Header & New Chat Button */}
      <div className="p-3.5 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-foreground tracking-tight font-display">
              ClixPro AI
            </span>
          </div>

          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          onClick={() => {
            onStartNewChat();
            onCloseMobileDrawer?.();
          }}
          className="w-full justify-center gap-2 text-xs font-medium h-9 shadow-xs bg-primary text-primary-foreground hover:brightness-105 rounded-xl"
        >
          <SquarePen className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </Button>

        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-muted-foreground" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-background border border-border/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
          {historySearchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2.5">
        {!hasAnySessions ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground px-3">
            <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center mb-2.5">
              <Clock className="w-5 h-5 opacity-60 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-foreground">No conversations yet</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">
              Your chats with ClixPro AI will be automatically organized here.
            </p>
          </div>
        ) : groupedSessions.filteredCount === 0 ? (
          <div className="py-8 text-center text-muted-foreground px-2">
            <p className="text-xs font-medium text-foreground">No matching chats</p>
            <p className="text-[11px] text-muted-foreground mt-1">Try a different search keyword.</p>
          </div>
        ) : (
          <>
            {renderSection('Pinned', groupedSessions.pinned)}
            {renderSection('Today', groupedSessions.today)}
            {renderSection('Yesterday', groupedSessions.yesterday)}
            {renderSection('Previous 7 Days', groupedSessions.previous7Days)}
            {renderSection('Older', groupedSessions.older)}
            {renderSection('Archived', groupedSessions.archived)}
          </>
        )}
      </div>

      {/* Footer / Clear History */}
      {hasAnySessions && (
        <div className="p-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{groupedSessions.totalCount} saved chats</span>
          <button
            onClick={() => setIsConfirmClearAllOpen(true)}
            className="hover:text-destructive transition-colors text-[11px] flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        </div>
      )}

      {/* Delete Single Chat Dialog */}
      <Dialog
        open={Boolean(deletingSessionId)}
        onOpenChange={(open) => !open && setDeletingSessionId(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Delete conversation?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will permanently delete this conversation transcript. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingSessionId(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deletingSessionId) {
                  onDeleteSession(deletingSessionId);
                  setDeletingSessionId(null);
                }
              }}
              className="text-xs"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All History Dialog */}
      <Dialog open={isConfirmClearAllOpen} onOpenChange={setIsConfirmClearAllOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Clear all conversation history?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will delete all {groupedSessions.totalCount} conversations permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmClearAllOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onClearAllHistory();
                setIsConfirmClearAllOpen(false);
              }}
              className="text-xs"
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
