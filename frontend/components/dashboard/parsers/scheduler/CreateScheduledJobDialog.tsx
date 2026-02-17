'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateScheduledJobDialogProps {
  children: React.ReactNode;
  onCreated: () => void;
}

const CRON_PRESETS = [
  { label: 'Every Hour', value: '0 * * * *' },
  { label: 'Every 6 Hours', value: '0 */6 * * *' },
  { label: 'Daily (Midnight)', value: '0 0 * * *' },
  { label: 'Weekly (Monday)', value: '0 0 * * 1' },
];

export function CreateScheduledJobDialog({ children, onCreated }: CreateScheduledJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useManualCron, setUseManualCron] = useState(false);
  
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      parser_name: 'shikimori',
      job_type: 'incremental',
      cron_expression: '0 * * * *',
      is_active: true
    }
  });

  const parserName = watch('parser_name');
  const jobType = watch('job_type');
  const cronExpression = watch('cron_expression');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await api.post('/dashboard/parsers/scheduler/jobs', data);
      toast.success('System: Scheduler updated with new ingestion node');
      setOpen(false);
      reset();
      onCreated();
    } catch (error) {
      toast.error('Critical: Failed to register scheduled task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-bg-secondary border-border text-white max-w-md rounded-3xl p-8 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-accent-primary/20 rounded-xl">
               <Calendar className="w-6 h-6 text-accent-primary" />
             </div>
             <DialogTitle className="text-2xl font-black tracking-tight">Provision Task</DialogTitle>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Ingestion Engine</Label>
                <Select value={parserName} onValueChange={(v) => setValue('parser_name', v)}>
                  <SelectTrigger className="bg-bg-primary border-border h-12 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-border text-white">
                    <SelectItem value="shikimori">Shikimori (Meta)</SelectItem>
                    <SelectItem value="kodik">Kodik (Video)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Strategy</Label>
                <Select value={jobType} onValueChange={(v) => setValue('job_type', v)}>
                  <SelectTrigger className="bg-bg-primary border-border h-12 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-border text-white">
                    <SelectItem value="incremental">Incremental</SelectItem>
                    <SelectItem value="full_sync">Full Deep Sync</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Temporal Frequency</Label>
                <button 
                  type="button"
                  onClick={() => setUseManualCron(!useManualCron)}
                  className="text-[10px] font-black uppercase tracking-widest text-accent-primary hover:underline"
                >
                  {useManualCron ? 'Use Visual Presets' : 'Manual Cron'}
                </button>
              </div>

              {!useManualCron ? (
                <div className="grid grid-cols-2 gap-2">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setValue('cron_expression', preset.value)}
                      className={cn(
                        "p-3 text-xs font-bold rounded-xl border transition-all text-left flex items-center gap-2",
                        cronExpression === preset.value 
                          ? "bg-accent-primary/20 border-accent-primary text-white shadow-lg shadow-accent-primary/10" 
                          : "bg-bg-primary border-border text-text-muted hover:border-accent-primary/50"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative group">
                  <Sparkles className="absolute left-3 top-3.5 h-4 w-4 text-accent-primary opacity-50" />
                  <Input 
                    {...register('cron_expression', { required: true })} 
                    className="bg-bg-primary border-border font-mono h-12 pl-10 rounded-xl text-accent-primary"
                    placeholder="* * * * *"
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-3 sm:justify-end">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)} className="rounded-xl font-bold text-text-muted">
              Abort
            </Button>
            <Button type="submit" disabled={isLoading} className="h-12 px-8 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-xl shadow-accent-primary/20">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Commit Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
