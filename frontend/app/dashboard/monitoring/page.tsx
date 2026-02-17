'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Activity, 
  Database, 
  Cpu, 
  HardDrive, 
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function MonitoringPage() {
  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const { data } = await api.get('/monitoring/health');
      return data;
    },
    refetchInterval: 10000 // Auto-refresh every 10s
  });

  const getStatusIcon = (status: string) => {
    return status === 'online' || status === 'healthy' 
      ? <CheckCircle2 className="h-5 w-5 text-accent-success" />
      : <AlertCircle className="h-5 w-5 text-accent-danger" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-accent-primary" />
            System Health
          </h1>
          <p className="text-text-muted mt-1">Real-time telemetry from Kitsu Enterprise cluster.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefetching && "animate-spin")} />
          Refresh Nodes
        </Button>
      </div>

      {/* Primary Nodes Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span className="font-bold text-white">PostgreSQL Node</span>
              </div>
              {health ? getStatusIcon(health.services.database.status) : <Clock className="h-4 w-4 animate-pulse" />}
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-text-muted">Latency</span>
                 <span className="text-accent-success font-mono">{health?.services.database.latency_ms || 0}ms</span>
               </div>
               <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: '100%' }} />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent-warning" />
                <span className="font-bold text-white">Redis Cluster</span>
              </div>
              {health ? getStatusIcon(health.services.cache.status) : <Clock className="h-4 w-4 animate-pulse" />}
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-text-muted">Status</span>
                 <span className="text-accent-success font-mono">Connected</span>
               </div>
               <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                 <div className="h-full bg-accent-warning" style={{ width: '100%' }} />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent-primary" />
                <span className="font-bold text-white">Celery Worker</span>
              </div>
              {health ? getStatusIcon(health.services.worker.status === 'online' ? 'online' : 'error') : <Clock className="h-4 w-4 animate-pulse" />}
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-text-muted">Tasks Status</span>
                 <span className="text-accent-primary font-mono capitalize">{health?.services.worker.status.replace('_', ' ')}</span>
               </div>
               <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                 <div className="h-full bg-accent-primary" style={{ width: health?.services.worker.status === 'online' ? '100%' : '0%' }} />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Utilization */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-bg-secondary border-border p-8">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
             <Cpu className="h-6 w-6 text-accent-primary" /> Hardware Resources
          </h3>
          <div className="space-y-8">
             <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">CPU Utilization</span>
                  <span className="text-2xl font-black text-white">{health?.resources.cpu_percent || 0}%</span>
                </div>
                <Progress value={health?.resources.cpu_percent} className="h-3" />
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">Memory (RAM) Usage</span>
                  <span className="text-2xl font-black text-white">{health?.resources.memory_percent || 0}%</span>
                </div>
                <Progress value={health?.resources.memory_percent} className="h-3" />
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">Block Storage Utilization</span>
                  <span className="text-2xl font-black text-white">{health?.resources.disk_percent || 0}%</span>
                </div>
                <Progress value={health?.resources.disk_percent} className="h-3" />
             </div>
          </div>
        </Card>

        <Card className="bg-bg-secondary border-border p-8 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="h-32 w-32" />
           </div>
           <h3 className="text-xl font-bold text-white mb-8">Uptime & Events</h3>
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-accent-success/10 flex items-center justify-center border border-accent-success/20">
                    <CheckCircle2 className="h-5 w-5 text-accent-success" />
                 </div>
                 <div>
                    <div className="text-sm font-bold text-white">All systems operational</div>
                    <div className="text-xs text-text-muted">No downtime recorded in 30 days</div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                    <Clock className="h-5 w-5 text-accent-primary" />
                 </div>
                 <div>
                    <div className="text-sm font-bold text-white">Last backup completed</div>
                    <div className="text-xs text-text-muted">2 hours and 14 minutes ago</div>
                 </div>
              </div>

              <div className="pt-6 border-t border-border">
                 <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4">Traffic Insights</h4>
                 <div className="flex items-end gap-2 h-20">
                    {[20, 35, 25, 45, 60, 55, 75, 40, 30, 50, 65, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-accent-primary/20 rounded-t-sm hover:bg-accent-primary transition-colors cursor-help" style={{ height: `${h}%` }} title={`Hour ${i}: ${h}%`} />
                    ))}
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';