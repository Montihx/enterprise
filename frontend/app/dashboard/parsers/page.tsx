'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Settings, 
  Activity, 
  Download, 
  Loader2, 
  Zap, 
  ShieldCheck, 
  History, 
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ParserJobsPage from './jobs/page';
import ParserSchedulerPage from './scheduler/page';
import GlobalParserLogsPage from './logs/page';
import { cn } from '@/lib/utils';

export default function ParsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const triggerMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string, type: string }) => {
      const { data } = await api.post('/dashboard/parsers/jobs/trigger', { 
        parser_name: name, 
        job_type: type 
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Job initialized: Cluster Node ${data.job_id.substring(0,8)}`);
      queryClient.invalidateQueries({ queryKey: ['parserJobs'] });
    },
    onError: () => toast.error('Cluster Error: Request timed out or node unreachable')
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">Parser Control Hub</h1>
          <p className="text-text-muted mt-1 font-medium italic">Distributed content ingestion and metadata reconciliation engine.</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/dashboard/parsers/settings">
            <Button className="h-12 bg-accent-primary hover:bg-accent-primary/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-8 shadow-2xl shadow-accent-primary/20 transition-all hover:scale-[1.02]">
              <Settings className="mr-2 h-4 w-4" /> Global Node Policy
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-bg-secondary/50 p-2 rounded-[2rem] border border-white/5 inline-flex shadow-inner backdrop-blur-xl">
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'scheduler', label: 'Scheduler', icon: CalendarDays },
              { id: 'jobs', label: 'History', icon: History },
              { id: 'logs', label: 'Telemetry', icon: Terminal },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className={cn(
                  "h-11 px-6 rounded-2xl transition-all duration-300 relative group",
                  "data-[state=active]:bg-bg-primary data-[state=active]:text-accent-primary data-[state=active]:shadow-2xl",
                  "text-[10px] font-black uppercase tracking-widest gap-2"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <TabsContent value="overview" className="m-0 outline-none">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Provisioning Card: Shikimori */}
                <Card className="bg-bg-secondary border-border rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-32 h-32 text-accent-primary" />
                  </div>
                  <CardHeader className="pb-8 border-b border-white/5 bg-bg-tertiary/20">
                    <CardTitle className="text-white text-xl uppercase font-black tracking-tight">Shikimori Registry</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-text-muted">Primary metadata ingestion pipeline</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-4">
                    <div className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-tertiary/20 hover:bg-bg-tertiary/40 transition-colors group/row">
                      <div>
                        <h4 className="font-black uppercase text-xs text-white">Incremental Pulse</h4>
                        <p className="text-[10px] text-text-muted uppercase mt-1">Sync latest 250 releases</p>
                      </div>
                      <Button 
                        onClick={() => triggerMutation.mutate({ name: 'shikimori', type: 'incremental' })}
                        disabled={triggerMutation.isPending}
                        size="sm" 
                        className="bg-accent-primary font-black uppercase text-[10px] tracking-widest h-9 px-4 shadow-lg shadow-accent-primary/20"
                      >
                        {triggerMutation.isPending ? <Loader2 className="animate-spin h-3 w-3" /> : <Play className="mr-2 h-3 w-3 fill-current" />} Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Provisioning Card: Kodik */}
                <Card className="bg-bg-secondary border-border rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-32 h-32 text-accent-warning" />
                  </div>
                  <CardHeader className="pb-8 border-b border-white/5 bg-bg-tertiary/20">
                    <CardTitle className="text-white text-xl uppercase font-black tracking-tight">Kodik CDN Network</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-text-muted">Video distribution and simulcast detection</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-4">
                    <div className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-tertiary/20 hover:bg-bg-tertiary/40 transition-colors group/row">
                      <div>
                        <h4 className="font-black uppercase text-xs text-white">Release Pulse</h4>
                        <p className="text-[10px] text-text-muted uppercase mt-1">Check 1,000+ ongoing nodes</p>
                      </div>
                      <Button 
                        onClick={() => triggerMutation.mutate({ name: 'kodik', type: 'incremental' })}
                        disabled={triggerMutation.isPending}
                        size="sm" 
                        variant="outline"
                        className="font-black uppercase text-[10px] tracking-widest h-9 px-4 border-accent-warning text-accent-warning hover:bg-accent-warning hover:text-white transition-all shadow-lg shadow-accent-warning/5"
                      >
                        Scan CDN
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Monitoring: Cluster Health */}
                <Card className="bg-bg-secondary border-border rounded-[2.5rem] shadow-2xl overflow-hidden">
                  <CardHeader className="pb-8 border-b border-white/5 bg-bg-tertiary/20">
                    <CardTitle className="text-white text-xl flex items-center gap-3 uppercase font-black tracking-tight">
                      <Activity className="h-5 w-5 text-accent-success" /> Grid State
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-text-muted">Real-time cluster observability</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-10 flex flex-col items-center justify-center text-center gap-4">
                    <div className="p-6 bg-accent-primary/5 rounded-full border border-accent-primary/10 relative">
                      <div className="absolute inset-0 bg-accent-primary/10 animate-ping rounded-full" />
                      <Download className="w-10 h-10 text-accent-primary" />
                    </div>
                    <div>
                        <p className="text-white font-bold uppercase tracking-widest text-xs">Awaiting Task Assignment</p>
                        <p className="text-text-muted text-[10px] uppercase mt-1 font-mono">Celery Pool: node-alpha, node-beta</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveTab('jobs')}
                      className="mt-4 w-full text-accent-primary font-black uppercase text-[10px] tracking-[0.2em] group border border-accent-primary/20 hover:bg-accent-primary/5 h-11"
                    >
                      Audit History Registry <ChevronRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="scheduler" className="m-0 outline-none">
              <div className="bg-bg-secondary border border-border rounded-[3rem] p-8 shadow-2xl">
                <ParserSchedulerPage />
              </div>
            </TabsContent>

            <TabsContent value="jobs" className="m-0 outline-none">
              <div className="bg-bg-secondary border border-border rounded-[3rem] p-8 shadow-2xl">
                <ParserJobsPage />
              </div>
            </TabsContent>

            <TabsContent value="logs" className="m-0 outline-none">
              <div className="bg-bg-secondary border border-border rounded-[3rem] p-4 shadow-2xl overflow-hidden">
                <GlobalParserLogsPage />
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
