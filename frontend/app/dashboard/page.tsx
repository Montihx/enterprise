'use client';

import React from 'react';
import { 
  Users, 
  Film, 
  PlayCircle, 
  Activity, 
  HardDrive,
  AlertCircle,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useDashboardStats, useDashboardCharts } from '@/hooks/queries';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartsLoading } = useDashboardCharts();

  if (statsLoading || chartsLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent-primary" />
        <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Aggregating Grid Stats</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Grid Overview</h2>
          <p className="text-text-muted mt-1 font-medium italic">Cluster Status: <span className="text-accent-success">OPTIMAL</span> • Monitoring active</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="secondary" className="bg-bg-tertiary border-border text-white hover:bg-white/5">
              <ExternalLink className="mr-2 h-4 w-4" /> Live Site
            </Button>
          </Link>
          <Link href="/dashboard/parsers/scheduler">
            <Button className="bg-accent-primary hover:bg-accent-primary/90 text-white shadow-xl shadow-accent-primary/20 font-bold px-6">
              Core Scheduler
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Audience"
          value={stats?.audience.value.toLocaleString()}
          trend={{ value: stats?.audience.trend, isPositive: stats?.audience.isPositive }}
          description="growth index"
          icon={Users}
        />
        <StatsCard
          title="Catalog Nodes"
          value={stats?.catalog.value.toLocaleString()}
          trend={{ value: stats?.catalog.trend, isPositive: stats?.catalog.isPositive }}
          description="series provisioned"
          icon={Film}
        />
        <StatsCard
          title="Video Assets"
          value={stats?.assets.value.toLocaleString()}
          trend={{ value: stats?.assets.trend, isPositive: stats?.assets.isPositive }}
          description="distributed releases"
          icon={PlayCircle}
        />
        <StatsCard
          title="Gateway Uptime"
          value={stats?.uptime}
          trend={{ value: 0.02, isPositive: true }}
          description="network health"
          icon={Activity}
        />
      </div>

      {/* Main Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Parser Throughput (Primary Chart) */}
        <div className="lg:col-span-8 bg-bg-secondary border border-border rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Parser Throughput</h3>
              <p className="text-sm text-text-muted">Ingestion node telemetry (Weekly Syncs)</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                 <div className="w-3 h-3 rounded-sm bg-accent-primary" /> Shikimori
               </div>
               <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                 <div className="w-3 h-3 rounded-sm bg-accent-secondary" /> Kodik
               </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f29" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#141419', 
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                  }}
                />
                <Bar 
                  dataKey="shikimori" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="kodik" 
                  fill="#ec4899" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Monitoring & Alerts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-bg-secondary border border-border rounded-3xl p-8 h-full flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <AlertCircle className="w-32 h-32 text-accent-danger" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-white flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-accent-danger" />
                Security Pulse
              </h3>
              <div className="animate-pulse flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent-danger" />
                 <span className="text-[10px] font-black text-accent-danger uppercase tracking-widest">Active</span>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="p-5 bg-bg-tertiary/50 rounded-2xl border border-border border-l-4 border-l-accent-danger group hover:bg-bg-tertiary transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Sync Conflict</h4>
                  <span className="text-[10px] font-bold text-text-muted">Just now</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">Shikimori ID collision detected in <span className="text-accent-danger">node-alpha</span>. Review required.</p>
              </div>

              <div className="p-5 bg-bg-tertiary/50 rounded-2xl border border-border border-l-4 border-l-accent-warning group hover:bg-bg-tertiary transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">API Threshold</h4>
                  <span className="text-[10px] font-bold text-text-muted">12m ago</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">Provider Shikimori reached <span className="text-accent-warning">80%</span> of daily rate limit.</p>
              </div>
            </div>
            
            <Link href="/dashboard/monitoring" className="mt-8">
              <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-[0.2em] text-text-muted hover:text-white border border-border group">
                Access Telemetry <ChevronRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
