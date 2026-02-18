import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number | undefined;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  accent?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, className, accent = '#7c3aed' }: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 transition-all hover:border-violet-500/30 group overflow-hidden',
        className
      )}
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, ${accent}08, transparent 60%)` }} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</p>
        <div className="p-2 rounded-xl border border-[var(--border)] transition-all group-hover:border-violet-500/30"
          style={{ background: `${accent}15` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>

      <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {value ?? '—'}
      </div>

      {(description || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full border',
              trend.isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-red-400 bg-red-500/10 border-red-500/20'
            )}>
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          {description && <span className="text-xs text-[var(--text-muted)]">{description}</span>}
        </div>
      )}
    </div>
  );
}
