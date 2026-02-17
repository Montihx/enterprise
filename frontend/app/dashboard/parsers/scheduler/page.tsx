
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CreateScheduledJobDialog } from '@/components/dashboard/parsers/scheduler/CreateScheduledJobDialog';

interface ScheduledJob {
  id: string;
  parser_name: string;
  job_type: string;
  is_active: boolean;
  cron_expression: string;
  last_run_at: string | null;
  next_run_at: string;
}

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export default function ParserSchedulerPage() {
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    loadScheduledJobs();
  }, []);
  
  const loadScheduledJobs = async () => {
    try {
      const { data } = await api.get('/dashboard/parsers/scheduler/jobs');
      setScheduledJobs(data);
    } catch (error) {
      toast.error('Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleJob = async (jobId: string, isActive: boolean) => {
    try {
      await api.patch(`/dashboard/parsers/scheduler/jobs/${jobId}`, {
        is_active: isActive
      });
      
      setScheduledJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, is_active: isActive } : job
        )
      );
      
      toast.success(isActive ? 'Job activated' : 'Job paused');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  
  const runNow = async (jobId: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobId));
    
    try {
      await api.post(`/dashboard/parsers/scheduler/jobs/${jobId}/run-now`);
      toast.success('Job started successfully');
    } catch (error) {
      toast.error('Failed to start job');
    } finally {
      setTimeout(() => {
        setRunningJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }, 2000);
    }
  };
  
  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled task?')) return;
    
    try {
      await api.delete(`/dashboard/parsers/scheduler/jobs/${jobId}`);
      setScheduledJobs((prev) => prev.filter((job) => job.id !== jobId));
      toast.success('Job deleted');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Parser Scheduler</h1>
          <p className="text-text-muted">
            Automate content updates with cron-based rules.
          </p>
        </div>
        
        <CreateScheduledJobDialog onCreated={loadScheduledJobs}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        </CreateScheduledJobDialog>
      </div>
      
      <div className="space-y-4">
        {scheduledJobs.map((job) => (
          <MotionDiv
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-bg-secondary border-border hover:border-accent-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1.5">
                    {job.is_active ? (
                      <div className="w-3 h-3 rounded-full bg-accent-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-bg-tertiary border border-text-muted" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white capitalize">
                          {job.parser_name} <span className="text-text-muted font-normal text-sm mx-2">•</span> {job.job_type.replace('_', ' ')}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-text-muted">
                          <span className="flex items-center gap-1.5 bg-bg-tertiary px-2 py-1 rounded border border-border">
                            <Clock className="w-3.5 h-3.5" />
                            {job.cron_expression}
                          </span>
                          
                          {job.last_run_at ? (
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent-success" />
                              Last: {new Date(job.last_run_at).toLocaleString()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-text-muted/50">
                              <XCircle className="w-3.5 h-3.5" />
                              Never run
                            </span>
                          )}
                          
                          <span className="text-accent-primary">
                            Next: {new Date(job.next_run_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <Switch
                        checked={job.is_active}
                        onCheckedChange={(checked) => toggleJob(job.id, checked)}
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-5 border-t border-border pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runNow(job.id)}
                        disabled={runningJobs.has(job.id)}
                        className="text-xs h-8"
                      >
                        {runningJobs.has(job.id) ? (
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 mr-2" />
                        )}
                        Run Now
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteJob(job.id)}
                        className="text-xs h-8 text-accent-danger hover:text-accent-danger hover:bg-accent-danger/10 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        ))}
        
        {scheduledJobs.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-lg bg-bg-secondary/50">
            <Clock className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-20" />
            <h3 className="text-lg font-medium text-white">No scheduled tasks</h3>
            <p className="text-text-muted mt-1 max-w-sm mx-auto">
              Create your first scheduled job to automate parsing from Shikimori or Kodik.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
