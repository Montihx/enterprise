'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Film, 
  PlayCircle, 
  Video,
  Download,
  Database,
  ListChecks,
  Settings,
  Users,
  Shield,
  BarChart3,
  Activity,
  FileWarning,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sidebarItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    label: 'Content',
    icon: FileText,
    href: '/dashboard/content',
    children: [
      { label: 'Anime', icon: Film, href: '/dashboard/content/anime' },
      { label: 'Episodes', icon: PlayCircle, href: '/dashboard/content/episodes' },
      { label: 'Releases', icon: Video, href: '/dashboard/content/releases' },
      { label: 'Collections', icon: Activity, href: '/dashboard/content/collections' }
    ]
  },
  {
    label: 'Parsers',
    icon: Download,
    href: '/dashboard/parsers',
    badge: 3, // Running jobs count mock
    children: [
      { label: 'Settings', icon: Settings, href: '/dashboard/parsers/settings' },
      { label: 'Scheduler', icon: Database, href: '/dashboard/parsers/scheduler' },
      { label: 'Jobs', icon: ListChecks, href: '/dashboard/parsers/jobs' },
      { label: 'Logs', icon: Terminal, href: '/dashboard/parsers/logs' },
      { label: 'Conflicts', icon: FileWarning, href: '/dashboard/parsers/conflicts' }
    ]
  },
  {
    label: 'Users',
    icon: Users,
    href: '/dashboard/users'
  },
  {
    label: 'Moderation',
    icon: Shield,
    href: '/dashboard/moderation'
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics'
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    children: [
        { label: 'Site Config', icon: Globe, href: '/dashboard/settings/site' },
        { label: 'Backups', icon: Database, href: '/dashboard/settings/backups' }
    ]
  },
  {
    label: 'Monitoring',
    icon: Activity,
    href: '/dashboard/monitoring'
  }
];

import { Globe } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Content', 'Parsers']);
  
  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };
  
  return (
    <aside
      className={cn(
        'sticky top-0 h-screen border-r border-border bg-bg-secondary transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4 relative">
        {!collapsed ? (
          <span className="text-lg font-bold text-white tracking-wide">
            Kitsu <span className="text-accent-primary">Admin</span>
          </span>
        ) : (
          <span className="text-xl font-bold text-accent-primary">K</span>
        )}
      </div>
      
      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href));
          
          return (
            <div key={item.label}>
              {/* Parent Item */}
              <Link
                href={item.children ? '#' : item.href}
                onClick={(e) => {
                  if (item.children) {
                    e.preventDefault();
                    if (!collapsed) toggleExpanded(item.label);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group relative',
                  isActive && !item.children
                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                    : 'text-text-muted hover:bg-bg-tertiary hover:text-white'
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />
                
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    {item.badge && item.label === 'Parsers' && (
                      <span className="ml-auto rounded-full bg-accent-danger px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform text-text-muted',
                          expandedItems.includes(item.label) && 'rotate-180'
                        )}
                      />
                    )}
                  </>
                )}

                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 rounded bg-bg-tertiary px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border">
                    {item.label}
                  </div>
                )}
              </Link>
              
              {/* Children Items */}
              {!collapsed && item.children && expandedItems.includes(item.label) && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 transition-colors text-sm',
                          isChildActive
                            ? 'bg-accent-primary/10 text-accent-primary font-medium'
                            : 'text-text-muted hover:bg-bg-tertiary hover:text-white'
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* Collapse Toggle */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-text-muted hover:text-white"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <div className="flex items-center gap-2"><ChevronLeft className="h-4 w-4" /> Collapse Sidebar</div>}
        </Button>
      </div>
    </aside>
  );
}