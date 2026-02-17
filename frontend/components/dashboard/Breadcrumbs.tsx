
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const LABEL_MAP: Record<string, string> = {
  'dashboard': 'Control Center',
  'content': 'Archives',
  'parsers': 'Ingestion Hub',
  'scheduler': 'Automated Tasks',
  'conflicts': 'Metadata Discrepancies',
  'monitoring': 'Node Telemetry',
  'users': 'IAM Registry',
  'settings': 'System Kernel',
  'releases': 'Distribution Network',
  'episodes': 'Segment Registry',
  'anime': 'Entity Map'
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-8 px-1">
      <Link 
        href="/dashboard" 
        className="hover:text-accent-primary transition-colors flex items-center gap-2 group"
      >
        <div className="p-1 rounded bg-bg-tertiary border border-white/5 group-hover:border-accent-primary/30 transition-all">
          <Home className="h-3 w-3" />
        </div>
        Grid
      </Link>
      
      {paths.slice(1).map((path, index) => {
        const href = `/${paths.slice(0, index + 2).join('/')}`;
        const isLast = index === paths.length - 2;
        const mappedLabel = LABEL_MAP[path.toLowerCase()] || path.replace(/-/g, ' ');

        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="h-3 w-3 opacity-30" />
            <Link
              href={href}
              className={cn(
                "transition-all",
                isLast 
                  ? "text-accent-primary font-black pointer-events-none" 
                  : "hover:text-white"
              )}
            >
              {mappedLabel}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
