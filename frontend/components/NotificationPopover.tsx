'use client';

import React from 'react';
import { 
  Bell, 
  Check, 
  ExternalLink, 
  Loader2, 
  MessageSquare, 
  Sparkles, 
  Info,
  Clock
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, useUnreadCount } from '@/hooks/queries';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationPopover() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_episode': return <Sparkles className="h-4 w-4 text-accent-success" />;
      case 'mention': return <MessageSquare className="h-4 w-4 text-accent-primary" />;
      default: return <Info className="h-4 w-4 text-accent-warning" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-text-secondary hover:text-accent-primary hover:bg-white/5 rounded-full transition-all">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent-danger border-2 border-bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-bg-secondary border-border shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
        <div className="p-4 border-b border-border bg-bg-tertiary/30 flex items-center justify-between">
           <h4 className="text-xs font-black uppercase tracking-widest text-white">Notifications</h4>
           {unreadCount > 0 && (
             <button onClick={markAllRead} className="text-[10px] font-black text-accent-primary uppercase hover:underline">Mark all read</button>
           )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="py-12 flex justify-center opacity-20"><Loader2 className="animate-spin h-6 w-6" /></div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => !n.is_read && markRead(n.id)}
                className={cn(
                  "p-4 border-b border-white/5 flex gap-4 transition-colors cursor-pointer group",
                  !n.is_read ? "bg-accent-primary/5 hover:bg-accent-primary/10" : "hover:bg-bg-tertiary"
                )}
              >
                 <div className="h-10 w-10 rounded-xl bg-bg-primary flex items-center justify-center shrink-0 border border-white/5 group-hover:border-accent-primary/30 transition-all">
                    {getIcon(n.type)}
                 </div>
                 <div className="flex-1 min-w-0 space-y-1">
                    <p className={cn("text-xs font-bold truncate", !n.is_read ? "text-white" : "text-text-secondary")}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                       <span className="text-[9px] font-medium text-text-muted uppercase flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                       </span>
                       {n.action_url && (
                         <Link href={n.action_url} className="text-[9px] font-black text-accent-primary uppercase hover:underline flex items-center gap-1">
                           View <ExternalLink className="h-2 w-2" />
                         </Link>
                       )}
                    </div>
                 </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-3 opacity-30">
               <Bell className="h-10 w-10 mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-widest">No alerts recorded</p>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-bg-tertiary/30 border-t border-border text-center">
           <button className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-white transition-colors">Clear history archive</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
