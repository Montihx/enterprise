
'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MoreVertical, Reply, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComments } from '@/hooks/queries';
import { useCreateComment } from '@/hooks/mutations';
import { formatDistanceToNow } from 'date-fns';

export function Comments({ animeId, episodeId }: { animeId?: string, episodeId?: string }) {
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading } = useComments(animeId, episodeId);
  const createMutation = useCreateComment();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    await createMutation.mutateAsync({
      anime_id: animeId,
      episode_id: episodeId,
      content: newComment
    });
    setNewComment('');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex gap-4">
        <Avatar className="border border-border">
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea 
            placeholder="Write a comment..." 
            className="bg-bg-secondary min-h-[100px] border-border focus:border-accent-primary rounded-2xl p-6"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || !newComment.trim()}
              className="bg-accent-primary font-black uppercase text-xs tracking-widest px-8 rounded-xl h-12"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Post Comment'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-10 pt-4">
        {isLoading ? (
          <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin h-10 w-10" /></div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-10 text-text-muted italic opacity-50">No discussions recorded on this node yet.</div>
        )}
      </div>
    </div>
  );
}

// Fix: Added 'key' to the props definition to resolve TypeScript error when mapping over elements
function CommentItem({ comment, isReply = false }: { comment: any; isReply?: boolean; key?: React.Key }) {
  return (
    <div className={cn("flex gap-6 group", isReply && "ml-12 border-l-2 border-border pl-6")}>
      <Avatar className="h-12 w-12 border border-border">
        <AvatarImage src={comment.user?.avatar_url} />
        <AvatarFallback className="bg-bg-tertiary text-text-muted">{comment.user?.username[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-white uppercase text-sm">{comment.user?.username}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <button className="text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-text-secondary text-base leading-relaxed font-medium">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-6 pt-2">
          <button className="flex items-center gap-2 text-[10px] font-black uppercase text-text-muted hover:text-accent-primary transition-colors">
            <ThumbsUp className="h-3.5 w-3.5" />
            {comment.likes_count}
          </button>
          <button className="text-[10px] font-black uppercase text-text-muted hover:text-accent-primary transition-colors">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
