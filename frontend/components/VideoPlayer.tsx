
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Maximize, Settings, SkipForward, PictureInPicture, Loader2, ShieldAlert } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUpdateWatchProgress } from '@/hooks/mutations';

interface VideoPlayerProps {
  episodeId: string;
  sourceUrl: string;
  embedUrl?: string;
  onEnded: () => void;
}

export function VideoPlayer({ episodeId, sourceUrl, embedUrl, onEnded }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  const [isIframe, setIsIframe] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressMutation = useUpdateWatchProgress();

  // Intelligent strategy selector based on distributed provider signatures
  useEffect(() => {
    const isManagedProvider = embedUrl && (
      embedUrl.includes('kodik') || 
      embedUrl.includes('aniboom') || 
      embedUrl.includes('sibnet') ||
      embedUrl.includes('youtube') ||
      !sourceUrl
    );
    
    setIsIframe(!!isManagedProvider);
  }, [sourceUrl, embedUrl]);

  // Telemetry Sync: Commit watch progress to the grid every 30 seconds (direct video)
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying && !isIframe) {
        progressMutation.mutate({
          episode_id: episodeId,
          position: Math.floor(videoRef.current.currentTime),
          total: Math.floor(videoRef.current.duration)
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isPlaying, episodeId, isIframe]);

  // Kodik/iframe watch progress via postMessage API
  // Kodik sends: { type: 'kodik_player', event: 'timeupdate', currentTime, duration }
  useEffect(() => {
    if (!isIframe) return;

    let lastSavedTime = 0;
    const SAVE_INTERVAL = 30; // Save every 30 seconds of playback

    const handleMessage = (event: MessageEvent) => {
      // Accept messages from trusted iframe providers
      const trustedOrigins = ['https://kodik.biz', 'https://kodik.cc', 'https://aniboom.one'];
      if (!trustedOrigins.some(o => event.origin.startsWith(o.replace('https://', '')))) {
        return; // Ignore untrusted origins
      }

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Kodik postMessage format
      if (data.type === 'kodik_player' && data.event === 'timeupdate') {
        const currentTime = Math.floor(data.currentTime || 0);
        const duration = Math.floor(data.duration || 0);

        if (duration > 0 && currentTime > lastSavedTime + SAVE_INTERVAL) {
          lastSavedTime = currentTime;
          progressMutation.mutate({
            episode_id: episodeId,
            position: currentTime,
            total: duration,
          });
        }
      }

      // Generic player ended event
      if (data.type === 'kodik_player' && data.event === 'ended') {
        progressMutation.mutate({
          episode_id: episodeId,
          position: data.duration || 0,
          total: data.duration || 0,
        });
        onEnded();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isIframe, episodeId, onEnded]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error("PiP Access Denied", err);
      }
    }
  };

  // Strategy: iFrame (Distributed Managed Node)
  if (isIframe && embedUrl) {
    return (
      <div className="relative aspect-video bg-black rounded-[40px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] border border-white/5 ring-1 ring-white/10 group">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          title="Distributed Node Stream"
        />
        <div className="absolute top-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
           <Badge className="bg-accent-primary text-white border-0 font-black uppercase text-[9px] tracking-widest px-3 py-1 shadow-2xl">External Distribution Hub</Badge>
        </div>
      </div>
    );
  }

  // Strategy: Native (Sovereign Cluster Node)
  return (
    <div 
      className="relative aspect-video bg-black rounded-[40px] overflow-hidden group shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] border border-white/5 ring-1 ring-white/10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {!sourceUrl ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-bg-secondary/50">
           <ShieldAlert className="h-16 w-16 text-accent-danger opacity-20" />
           <p className="text-text-muted font-black uppercase tracking-[0.3em] text-xs animate-pulse">Node Offline: Awaiting Stream Handshake</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={sourceUrl}
            className="w-full h-full cursor-pointer object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onEnded}
            onClick={togglePlay}
          />
          
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-10 transition-opacity duration-500",
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}>
            <div className="relative h-1 w-full bg-white/10 mb-8 cursor-pointer group/bar overflow-hidden rounded-full">
              <div className="absolute h-full bg-accent-danger shadow-[0_0_15px_#ef4444] transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10 text-white">
                <button onClick={togglePlay} className="hover:scale-110 transition-transform focus:outline-none">
                  {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 fill-current" />}
                </button>
                <div className="flex items-center gap-4 group/vol">
                  <Volume2 className="h-6 w-6 text-text-muted hover:text-white" />
                  <div className="w-24">
                    <Slider value={[volume * 100]} max={100} onValueChange={(v) => {
                      setVolume(v[0]/100);
                      if (videoRef.current) videoRef.current.volume = v[0]/100;
                    }} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8 text-white">
                <Badge variant="outline" className="border-white/20 text-[10px] font-black uppercase tracking-widest px-3 h-7 bg-white/5">Local Sovereign Node</Badge>
                <PictureInPicture className="h-6 w-6 text-text-muted hover:text-white cursor-pointer transition-all" onClick={handlePiP} />
                <Settings className="h-6 w-6 text-text-muted hover:text-white cursor-pointer transition-all hover:rotate-45" />
                <Maximize className="h-6 w-6 text-text-muted hover:text-white cursor-pointer transition-colors" onClick={() => videoRef.current?.requestFullscreen()} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
