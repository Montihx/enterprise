'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Film, PlayCircle, Video,
  Download, Database, ListChecks, Settings, Users,
  Shield, BarChart3, Activity, FileWarning, ChevronDown,
  ChevronLeft, ChevronRight, Terminal, Globe, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarChild {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number | string;
  children?: SidebarChild[];
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  {
    label: 'Content', icon: FileText, href: '/dashboard/content',
    children: [
      { label: 'Anime', icon: Film, href: '/dashboard/content/anime' },
      { label: 'Episodes', icon: PlayCircle, href: '/dashboard/content/episodes' },
      { label: 'Releases', icon: Video, href: '/dashboard/content/releases' },
      { label: 'Collections', icon: Activity, href: '/dashboard/content/collections' },
    ]
  },
  {
    label: 'Parsers', icon: Download, href: '/dashboard/parsers', badge: 3,
    children: [
      { label: 'Settings', icon: Settings, href: '/dashboard/parsers/settings' },
      { label: 'Scheduler', icon: Database, href: '/dashboard/parsers/scheduler' },
      { label: 'Jobs', icon: ListChecks, href: '/dashboard/parsers/jobs' },
      { label: 'Logs', icon: Terminal, href: '/dashboard/parsers/logs' },
      { label: 'Conflicts', icon: FileWarning, href: '/dashboard/parsers/conflicts' },
    ]
  },
  { label: 'Users', icon: Users, href: '/dashboard/users' },
  { label: 'Moderation', icon: Shield, href: '/dashboard/moderation' },
  { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  {
    label: 'Settings', icon: Settings, href: '/dashboard/settings',
    children: [
      { label: 'Site Config', icon: Globe, href: '/dashboard/settings/site' },
      { label: 'Backups', icon: Database, href: '/dashboard/settings/backups' },
      { label: 'Audit Logs', icon: Terminal, href: '/dashboard/settings/audit-logs' },
    ]
  },
  { label: 'Monitoring', icon: Activity, href: '/dashboard/monitoring' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Content', 'Parsers']);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen border-r flex flex-col transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-64',
      )}
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4 gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
          <span className="text-white font-black text-base" style={{ fontFamily: 'var(--font-display)' }}>K</span>
        </div>
        {!collapsed && (
          <span className="font-black text-white text-sm tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            KITSU <span className="text-violet-400">ADMIN</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--accent-primary) transparent' }}>
        {sidebarItems.map((item) => {
          const isParentActive = pathname === item.href || (item.children && item.children.some((c) => pathname.startsWith(c.href)));
          const hasChildren = !!item.children;
          const isExpanded = expandedItems.includes(item.label);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => !collapsed && toggleExpanded(item.label)}
                  className={cn(
                    'group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all relative text-left',
                    isParentActive
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white border border-transparent'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/20">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                    </>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 top-0 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all relative border',
                    pathname === item.href
                      ? 'bg-violet-600 text-white border-violet-500/50 shadow-lg shadow-violet-500/20'
                      : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white border-transparent'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 top-0 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </Link>
              )}

              {/* Expanded children */}
              {!collapsed && hasChildren && isExpanded && (
                <div className="ml-3 mt-0.5 mb-1 border-l border-[var(--border)] pl-3 space-y-0.5">
                  {item.children!.map((child) => {
                    const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all',
                          isChildActive
                            ? 'bg-violet-500/10 text-violet-400 font-semibold'
                            : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
        >
          <PanelLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
