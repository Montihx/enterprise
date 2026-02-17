'use client';

import React from 'react';
import { useStaffComments } from '@/hooks/queries';
import { useApproveComment, useDeleteAnime } from '@/hooks/mutations';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

export default function ModerationPage() {
  const { data: queue, isLoading } = useStaffComments(true); // Fetch hidden/pending
  const approveMutation = useApproveComment();

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent-primary" />
            Content Moderation
          </h1>
          <p className="text-text-muted mt-1 uppercase text-[10px] font-black tracking-widest">
            Protocol Enforcement Queue
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Badge className="bg-accent-warning/20 text-accent-warning border-0 px-4 py-2 rounded-xl uppercase font-black text-xs">
             {queue?.length || 0} Pending Items
           </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-accent-primary" /></div>
        ) : queue && queue.length > 0 ? (
          queue.map((comment) => (
            <Card key={comment.id} className="bg-bg-secondary border-border hover:border-accent-primary/20 transition-all overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-bg-tertiary text-text-muted">{comment.user?.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-black text-white uppercase text-sm">{comment.user?.username}</div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <p className="text-text-secondary leading-relaxed font-medium bg-bg-primary/30 p-4 rounded-xl border border-white/5 italic">
                      "{comment.content}"
                    </p>
                  </div>
                  <div className="bg-bg-tertiary/20 border-l border-border p-6 flex flex-row md:flex-col justify-center gap-3 w-full md:w-48">
                    <Button 
                      onClick={() => approveMutation.mutate(comment.id)}
                      disabled={approveMutation.isPending}
                      className="w-full bg-accent-success hover:bg-accent-success/90 text-white font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-accent-danger text-accent-danger hover:bg-accent-danger/10 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-border rounded-[40px] bg-bg-secondary/50">
             <CheckCircle className="h-16 w-16 mx-auto mb-6 text-accent-success opacity-20" />
             <h3 className="text-2xl font-black text-white tracking-tight uppercase">Queue Purged</h3>
             <p className="text-text-muted font-medium mt-2">All content nodes have been reconciled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
