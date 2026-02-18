'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Twitter, Instagram, MessageCircle, Youtube, Github,
  Send, Globe, ChevronDown, ExternalLink, Heart
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Discover',
    links: [
      { label: 'Anime Catalog', href: '/catalog' },
      { label: 'Seasonal Schedule', href: '/schedule' },
      { label: 'Top Anime', href: '/tops' },
      { label: 'Collections', href: '/collections' },
    ]
  },
  {
    title: 'Genres',
    links: [
      { label: 'Action', href: '/catalog?genre=Action' },
      { label: 'Romance', href: '/catalog?genre=Romance' },
      { label: 'Sci-Fi', href: '/catalog?genre=Sci-Fi' },
      { label: 'Horror', href: '/catalog?genre=Horror' },
    ]
  },
  {
    title: 'Platform',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'API Documentation', href: '/api-docs', external: true },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/faq' },
      { label: 'Contact Us', href: '/contacts' },
      { label: 'Report Issue', href: '/report' },
    ]
  }
];

const SOCIALS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
  { icon: Github, href: '#', label: 'GitHub' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'Deutsch' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [langOpen, setLangOpen] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setEmail('');
    toast.success('🎉 You\'re subscribed! New releases await.');
  };

  return (
    <footer className="mt-auto border-t border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
      {/* Main grid */}
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
                <span className="text-white font-black text-xl" style={{ fontFamily: 'var(--font-display)' }}>K</span>
              </div>
              <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                KITSU<span className="text-violet-400">.</span>
              </span>
            </Link>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
              The next generation anime streaming platform. Fast updates, stunning quality, and a community built for enthusiasts.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all hover:scale-110"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
                New Episode Alerts
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50 transition-all newsletter-input"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 hover:scale-105"
                >
                  <Send className={`h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                </button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">{section.title}</p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-violet-400 transition-colors"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-violet-400 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            © {new Date().getFullYear()} Kitsu Enterprise. Made with <Heart className="h-3 w-3 text-pink-500 fill-current" /> for anime fans.
          </p>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] text-xs font-bold text-[var(--text-secondary)] hover:text-white hover:border-violet-500/30 transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              {LANGUAGES.find((l) => l.code === currentLang)?.label || 'English'}
              <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-36 rounded-xl overflow-hidden border border-[var(--border)] shadow-xl z-10"
                style={{ background: 'var(--bg-secondary)' }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setCurrentLang(lang.code); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      currentLang === lang.code
                        ? 'text-violet-400 bg-violet-500/10'
                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
