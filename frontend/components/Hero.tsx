
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    slug: 'attack-on-titan-final-season',
    title: 'Attack on Titan: Final Season',
    subtitle: 'The battle for humanity reaches its epic conclusion. Eren Jaeger sets his sights on the world beyond the walls.',
    image: 'https://shikimori.one/system/animes/original/40028.jpg',
    cta: 'Watch Now'
  },
  {
    id: 2,
    slug: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    subtitle: 'Step into a world where negative human emotions manifest as deadly Curses, and sorcerers fight in the shadows.',
    image: 'https://shikimori.one/system/animes/original/40748.jpg',
    cta: 'Start Watching'
  },
  {
    id: 3,
    slug: 'vinland-saga',
    title: 'Vinland Saga',
    subtitle: 'A young man named Thorfinn joins the mercenary band of the man who killed his father, seeking revenge through cold steel.',
    image: 'https://shikimori.one/system/animes/original/37521.jpg',
    cta: 'Explore Saga'
  }
];

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <section className="relative h-[70vh] min-h-[600px] max-h-[900px] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110 motion-safe:animate-zoom"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />
        </MotionDiv>
      </AnimatePresence>
      
      <div className="container mx-auto px-4 h-full relative z-10">
        <div className="flex flex-col justify-center h-full max-w-3xl">
          <MotionDiv
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-primary/20 text-accent-primary text-xs font-bold rounded-full border border-accent-primary/30 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
              </span>
              Now Trending
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href={`/anime/${slides[currentSlide].slug}/watch`}>
                <Button
                  size="lg"
                  className="bg-accent-primary hover:bg-accent-primary/90 h-14 px-8 text-lg font-bold shadow-lg shadow-accent-primary/20 hover:scale-105 transition-all"
                >
                  <Play className="mr-3 h-6 w-6 fill-current" />
                  {slides[currentSlide].cta}
                </Button>
              </Link>
              <Link href={`/anime/${slides[currentSlide].slug}`}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 h-14 px-8 text-lg font-bold text-white hover:scale-105 transition-all"
                >
                  <Info className="mr-3 h-6 w-6" />
                  More Details
                </Button>
              </Link>
            </div>
          </MotionDiv>
        </div>
      </div>
      
      {/* Pagination dots */}
      <div className="absolute bottom-12 right-12 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all duration-500 rounded-full ${
              index === currentSlide
                ? 'w-12 bg-accent-primary'
                : 'w-4 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* 
        Fixing Error: Type '{ children: string; jsx: true; global: true; }' is not assignable to type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
        Using dangerouslySetInnerHTML to inject global keyframes correctly in standard React components.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .animate-zoom {
          animation: zoom 20s infinite alternate ease-in-out;
        }
      ` }} />
    </section>
  );
}
