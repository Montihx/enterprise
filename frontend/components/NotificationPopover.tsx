'use client';

import React from 'react';
import {
  Bell, Check, ExternalLink, Loader2, MessageSquare,
  Sparkles, Info, Clock, BellOff
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, useUnreadCount } from '@/hooks/queries';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

export function NotificationPopover() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  // Backend /notifications/unread-count returns a raw integer
  const unreadCount: number = typeof unreadData === 'number' ? unreadData : 0;

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_episode': return <Sparkles className="h-3.5 w-3.5 text-green-400" />;
      case 'mention': return <MessageSquare className="h-3.5 w-3.5 text-violet-400" />;
      default: return <Info className="h-3.5 w-3.5 text-yellow-400" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <MotionDiv
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white bg-red-500 shadow-lg shadow-red-500/30"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </MotionDiv>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border-[var(--glass-border)]"
        style={{ background: 'rgba(15,15,26,0.97)', backdropFilter: 'blur(24px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-400" />
            <h4 className="text-sm font-black text-white">Notifications</h4>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/20">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-black text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider">
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400 opacity-50" />
            </div>
          ) : notifications && (notifications as any[]).length > 0 ? (
            (notifications as any[]).map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={cn(
                  'flex gap-3 px-4 py-3 border-b cursor-pointer transition-colors',
                  !n.is_read ? 'bg-violet-500/5 hover:bg-violet-500/10' : 'hover:bg-white/3'
                )}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 border border-[var(--border)]">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className={cn('text-xs font-bold truncate', !n.is_read ? 'text-white' : 'text-[var(--text-secondary)]')}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                    {n.action_url && (
                      <Link href={n.action_url} className="flex items-center gap-0.5 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors">
                        View <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))
          ) : (
            <div className="py-16 flex flex-col items-center gap-3 text-[var(--text-muted)]">
              <BellOff className="h-10 w-10 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          <button className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-violet-400 transition-colors w-full text-center">
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
