
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, Menu, X, User, LayoutGrid, CalendarDays, Trophy,
  LogOut, Settings, UserCog, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchModal } from './SearchModal';
import { NotificationPopover } from './NotificationPopover';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { isLoggedIn, user, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    router.push('/login');
  };

  const navLinks = [
    { href: '/catalog', label: 'Catalog', icon: LayoutGrid },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/tops', label: 'Tops', icon: Trophy },
    { href: '/collections', label: 'Collections', icon: Database },
  ];

  return (
    <>
      <nav className={cn(
        "sticky top-0 z-50 h-16 transition-all duration-300 border-b",
        scrolled
          ? "bg-bg-primary/90 backdrop-blur-xl border-border shadow-2xl"
          : "bg-transparent border-transparent"
      )}>
        <div className="container mx-auto h-full px-4">
          <div className="flex h-full items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-white shrink-0">
              <div className="w-9 h-9 bg-accent-primary rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/20 transform rotate-6">
                <span className="text-white text-xl -rotate-6">K</span>
              </div>
              <span className="hidden sm:inline-block tracking-tighter">KITSU<span className="text-accent-primary">.</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest transition-all relative group",
                      isActive ? "text-accent-primary" : "text-text-secondary hover:text-white"
                    )}
                  >
                    {link.label}
                    <MotionSpan
                      layoutId="nav-active"
                      className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-accent-primary transition-all",
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="text-text-secondary hover:text-accent-primary hover:bg-white/5 rounded-full transition-all"
              >
                <Search className="h-5 w-5" />
              </Button>

              {isLoggedIn && <NotificationPopover />}

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <User className="h-5 w-5 text-text-muted hover:text-accent-primary transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-bg-secondary border-border" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{user?.username || 'User'}</p>
                        <p className="text-xs leading-none text-text-muted">{user?.email || 'user@kitsu.io'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild className="text-text-secondary focus:bg-bg-tertiary focus:text-white cursor-pointer">
                      <Link href="/profile">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-text-secondary focus:bg-bg-tertiary focus:text-white cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleLogout} className="text-accent-danger focus:bg-accent-danger/10 focus:text-accent-danger cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="text-sm font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/5 px-4 h-10 rounded-xl">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="text-sm font-bold uppercase tracking-widest px-4 h-10 rounded-xl">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-text-secondary hover:bg-white/5"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <MotionDiv
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="md:hidden fixed inset-x-0 top-16 bg-bg-primary border-b border-border z-40"
            >
              <div className="container mx-auto px-6 py-10 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 text-xl font-bold text-text-secondary hover:text-accent-primary group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="p-3 rounded-2xl bg-bg-secondary border border-border group-hover:bg-accent-primary/10 group-hover:border-accent-primary/30 transition-all">
                      <link.icon className="h-6 w-6" />
                    </div>
                    {link.label}
                  </Link>
                ))}
                {!isLoggedIn && (
                  <div className="pt-6 border-t border-border flex gap-4">
                    <Link href="/login" className="flex-1">
                      <Button className="h-12 w-full text-lg font-bold">Login</Button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <Button variant="outline" className="h-12 w-full text-lg font-bold border-border">Sign Up</Button>
                    </Link>
                  </div>
                )}
                {isLoggedIn && (
                  <div className="pt-6 border-t border-border flex flex-col gap-4">
                    <Link href="/profile" className="flex items-center gap-4 text-xl font-bold text-text-secondary hover:text-accent-primary group" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="p-3 rounded-2xl bg-bg-secondary border border-border group-hover:bg-accent-primary/10 group-hover:border-accent-primary/30 transition-all">
                        <UserCog className="h-6 w-6" />
                      </div>
                      Profile
                    </Link>
                    <Button variant="ghost" className="h-12 text-lg font-bold text-accent-danger hover:bg-accent-danger/10" onClick={handleLogout}>
                      <LogOut className="mr-3 h-6 w-6" /> Log out
                    </Button>
                  </div>
                )}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </nav>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

