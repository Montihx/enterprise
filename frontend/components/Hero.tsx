'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Volume2, VolumeX, TrendingUp, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

const MotionDiv = motion.div as any;

const slides = [
  {
    id: 1,
    slug: 'attack-on-titan-final-season',
    title: 'Attack on Titan',
    subtitle: 'Final Season',
    description: 'The battle for humanity reaches its epic conclusion. Eren sets his sights on the world beyond the walls — and nothing will ever be the same.',
    image: 'https://shikimori.one/system/animes/original/40028.jpg',
    score: '9.1',
    year: '2022',
    genre: 'Action / Dark Fantasy',
    episodes: 16,
    cta: 'Watch Now',
    color: '#e11d48',
  },
  {
    id: 2,
    slug: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    subtitle: 'Season 2',
    description: 'Step into a world where negative human emotions manifest as deadly Curses, and sorcerers fight in the shadows to protect humanity.',
    image: 'https://shikimori.one/system/animes/original/40748.jpg',
    score: '8.9',
    year: '2023',
    genre: 'Action / Supernatural',
    episodes: 23,
    cta: 'Start Watching',
    color: '#7c3aed',
  },
  {
    id: 3,
    slug: 'vinland-saga',
    title: 'Vinland Saga',
    subtitle: 'Season 2',
    description: 'A young warrior named Thorfinn embarks on a path of revenge and ultimately discovers that true strength lies beyond the battlefield.',
    image: 'https://shikimori.one/system/animes/original/37521.jpg',
    score: '9.0',
    year: '2023',
    genre: 'Historical / Adventure',
    episodes: 24,
    cta: 'Explore Saga',
    color: '#0891b2',
  },
];

const AUTO_PLAY_INTERVAL = 8000;

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [muted, setMuted] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mouseY, setMouseY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimerKey((k) => k + 1);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((currentSlide + 1) % slides.length);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      setMouseY(y);
    };
    const el = heroRef.current;
    el?.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => el?.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-black"
      style={{ height: 'calc(100vh - 64px)', minHeight: '600px', maxHeight: '960px' }}
    >
      {/* Background Image with Parallax */}
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0"
          style={{ willChange: 'transform' }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center animate-zoom-slow"
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: `translateY(${(mouseY - 0.5) * 24}px)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
          {/* Multi-layer overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,7,16,0.97) 0%, rgba(7,7,16,0.7) 50%, rgba(7,7,16,0.15) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,16,1) 0%, rgba(7,7,16,0.4) 40%, transparent 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, transparent 30%, rgba(7,7,16,0.6) 100%)' }} />
        </MotionDiv>
      </AnimatePresence>

      {/* Accent color glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 30% 60%, ${slide.color}18 0%, transparent 60%)` }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <MotionDiv
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-5"
            >
              {/* Trending badge */}
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-widest"
                  style={{ background: `${slide.color}20`, borderColor: `${slide.color}40`, color: slide.color }}>
                  <TrendingUp className="h-3 w-3 animate-trending" />
                  Trending Now
                </div>
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-black">{slide.score}</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{slide.subtitle}</p>
                <h1 className="text-5xl md:text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                  {slide.title}
                </h1>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] font-medium">
                <span>{slide.year}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <span>{slide.genre}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <span>{slide.episodes} Episodes</span>
              </div>

              <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed font-normal">
                {slide.description}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/anime/${slide.slug}/watch`}>
                  <button className="flex items-center gap-3 px-7 py-3.5 rounded-xl text-white font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${slide.color}, ${slide.color}cc)`, boxShadow: `0 8px 32px ${slide.color}40` }}>
                    <Play className="h-5 w-5 fill-current" />
                    {slide.cta}
                  </button>
                </Link>
                <Link href={`/anime/${slide.slug}`}>
                  <button className="flex items-center gap-3 px-7 py-3.5 rounded-xl text-white font-bold text-base transition-all hover:scale-105 active:scale-95 border"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Info className="h-5 w-5" />
                    More Details
                  </button>
                </Link>
              </div>
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>

      {/* Vertical Dots Navigation — right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 items-center">
        {slides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goToSlide(index)}
            aria-label={`Go to ${s.title}`}
            className="group flex flex-col items-center gap-1"
          >
            <div className={`transition-all duration-400 rounded-full ${
              index === currentSlide
                ? 'w-1.5 h-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                : 'w-1 h-4 bg-white/20 hover:bg-white/40'
            }`} />
          </button>
        ))}
        {/* Auto-transition timer bar */}
        <div className="mt-2 w-px h-12 bg-white/10 rounded-full overflow-hidden">
          <div
            key={timerKey}
            className="w-full bg-white rounded-full origin-top"
            style={{ animation: `timer-bar ${AUTO_PLAY_INTERVAL}ms linear forwards`, transformOrigin: 'top' }}
          />
        </div>
      </div>

      {/* Mute/Unmute button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-8 right-8 z-20 p-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white hover:bg-white/10 transition-all hover:scale-110"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Bottom slide info + navigation */}
      <div className="absolute bottom-8 left-0 right-0 z-20 container mx-auto px-4">
        <div className="flex items-end justify-between">
          {/* Slide thumbnails */}
          <div className="flex gap-3">
            {slides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => goToSlide(index)}
                className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-40 scale-95 hover:opacity-70'
                }`}
                style={{ width: 56, height: 36 }}
              >
                <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                {index === currentSlide && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white" />
                )}
              </button>
            ))}
          </div>

          {/* Slide counter */}
          <div className="text-[var(--text-muted)] text-sm font-bold tabular-nums hidden md:block">
            <span className="text-white text-xl">{String(currentSlide + 1).padStart(2, '0')}</span>
            <span className="mx-1">/</span>
            {String(slides.length).padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
}
