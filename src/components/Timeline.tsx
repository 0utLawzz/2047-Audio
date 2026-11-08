import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Scissors, 
  Split, 
  Sparkles, 
  Trash2, 
  Play, 
  Layers, 
  Grid,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { AudioTrack, AudioSlice } from '../types/audio';

interface TimelineProps {
  tracks: AudioTrack[];
  activeTrack: AudioTrack | null;
  currentTime: number;
  totalDuration: number;
  bpm: number;
  zoom: number;
  gridSnap: 'off' | '1/4' | '1/8' | '1/16' | '1/32';
  onSeek: (time: number) => void;
  onAddSlice: (slice: AudioSlice) => void;
  onRemoveSlice: (sliceId: string) => void;
  onPlaySlice: (slice: AudioSlice) => void;
  onSliceAtCurrentTime: () => void;
  onAutoSlice: () => void;
  onSplitAtSilence: () => void;
  selectedSliceId: string | null;
  onSelectSlice: (sliceId: string | null) => void;
  onZoomChange?: (newZoom: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  activeTrack,
  currentTime,
  totalDuration,
  bpm,
  zoom,
  gridSnap,
  onSeek,
  onAddSlice,
  onRemoveSlice,
  onPlaySlice,
  onSliceAtCurrentTime,
  onAutoSlice,
  onSplitAtSilence,
  selectedSliceId,
  onSelectSlice,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drag selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const duration = Math.max(1, totalDuration || activeTrack?.audioBuffer?.duration || 10);
  
  // Calculate width proportional to zoom level (pixels per second)
  const containerWidth = containerRef.current?.clientWidth || 900;
  const basePixelsPerSecond = Math.max(containerWidth / duration, 90) * zoom;
  const totalWidth = Math.max(containerWidth, Math.floor(duration * basePixelsPerSecond));

  const timeToPx = useCallback((time: number) => {
    return (time / duration) * totalWidth;
  }, [duration, totalWidth]);

  const pxToTime = useCallback((px: number) => {
    return Math.max(0, Math.min(duration, (px / totalWidth) * duration));
  }, [duration, totalWidth]);

  const snapTime = useCallback((rawTime: number) => {
    if (gridSnap === 'off') return rawTime;
    const beatSec = 60 / bpm;
    let snapFactor = 1;
    if (gridSnap === '1/8') snapFactor = 0.5;
    if (gridSnap === '1/16') snapFactor = 0.25;
    if (gridSnap === '1/32') snapFactor = 0.125;

    const interval = beatSec * snapFactor;
    return Math.round(rawTime / interval) * interval;
  }, [gridSnap, bpm]);

  // Autoscroll playhead into view when playing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const playheadPx = timeToPx(currentTime);
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    if (playheadPx > scrollLeft + clientWidth - 50) {
      container.scrollLeft = playheadPx - clientWidth * 0.3;
    } else if (playheadPx < scrollLeft) {
      container.scrollLeft = Math.max(0, playheadPx - 50);
    }
  }, [currentTime, timeToPx]);

  // Mouse wheel zoom support with Ctrl key or horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (onZoomChange) {
        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        const nextZoom = Math.max(0.5, Math.min(6, +(zoom + delta).toFixed(2)));
        onZoomChange(nextZoom);
      }
    }
  };

  const handlePointerStart = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = clientX - rect.left;
    const time = snapTime(pxToTime(clickX));
    onSeek(time);
    setIsSelecting(true);
    setSelectionStart(time);
    setSelectionEnd(time);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isSelecting || selectionStart === null) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = clientX - rect.left;
    const time = snapTime(pxToTime(currentX));
    setSelectionEnd(time);
  };

  const handlePointerEnd = () => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      
      // If user dragged a region > 0.08 seconds, create a new slice
      if (end - start > 0.08) {
        const sliceCount = activeTrack?.slices.length || 0;
        const newSlice: AudioSlice = {
          id: `slice_${Date.now()}`,
          name: `Slice ${sliceCount + 1}`,
          startTime: start,
          endTime: end,
          duration: end - start,
          color: sliceCount % 2 === 0 ? '#FACC15' : '#22D3EE',
          padIndex: sliceCount < 16 ? sliceCount : undefined,
        };
        onAddSlice(newSlice);
        onSelectSlice(newSlice.id);
      }
    }
    setIsSelecting(false);
  };

  // Canvas Waveform & Beat Grid Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = totalWidth;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Detect dark or light mode
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.documentElement.getAttribute('data-theme')?.includes('cyberpunk') ||
                   document.documentElement.getAttribute('data-theme')?.includes('midnight');

    // 1. Draw Beat Grid Lines
    const beatInterval = 60 / bpm;
    const totalBeats = Math.ceil(duration / beatInterval);

    for (let b = 0; b <= totalBeats; b++) {
      const beatTime = b * beatInterval;
      const x = timeToPx(beatTime);
      const isBar = b % 4 === 0;

      ctx.beginPath();
      ctx.strokeStyle = isBar 
        ? (isDark ? 'rgba(250, 204, 21, 0.28)' : 'rgba(217, 119, 6, 0.35)') 
        : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)');
      ctx.lineWidth = isBar ? 1.5 : 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (isBar && x < width - 20) {
        ctx.fillStyle = isDark ? 'rgba(250, 204, 21, 0.75)' : '#b45309';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`BAR ${Math.floor(b / 4) + 1}`, x + 4, 11);
      }
    }

    // 2. Draw Waveforms
    const trackHeight = Math.max(54, Math.floor((height - 24) / Math.max(1, tracks.length)));

    tracks.forEach((track, tIdx) => {
      const topY = 20 + tIdx * trackHeight;
      const midY = topY + trackHeight / 2;
      const isTrackActive = track.id === activeTrack?.id;

      ctx.fillStyle = isTrackActive 
        ? (isDark ? 'rgba(250, 204, 21, 0.05)' : 'rgba(217, 119, 6, 0.06)') 
        : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)');
      ctx.fillRect(0, topY, width, trackHeight - 4);

      ctx.fillStyle = isTrackActive ? (isDark ? '#facc15' : '#b45309') : (isDark ? '#9ca3af' : '#64748b');
      ctx.font = 'bold 10px Plus Jakarta Sans';
      ctx.fillText(track.name, 6, topY + 13);

      const buffer = track.audioBuffer;
      if (!buffer) return;

      const data = buffer.getChannelData(0);
      const step = Math.ceil(data.length / width);
      const amp = (trackHeight / 2) * 0.8 * track.volume;

      ctx.beginPath();
      ctx.strokeStyle = track.muted 
        ? 'rgba(150, 150, 150, 0.3)' 
        : (isTrackActive ? (isDark ? track.color : '#d97706') : (isDark ? 'rgba(140, 160, 190, 0.6)' : '#64748b'));
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x++) {
        const startSample = Math.floor((x / width) * data.length);
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < step && startSample + j < data.length; j++) {
          const val = data[startSample + j];
          if (val < min) min = val;
          if (val > max) max = val;
        }

        ctx.moveTo(x, midY + min * amp);
        ctx.lineTo(x, midY + max * amp);
      }
      ctx.stroke();

      // Slices
      track.slices.forEach((slice) => {
        const sx = timeToPx(slice.startTime);
        const ex = timeToPx(slice.endTime);
        const sw = Math.max(2, ex - sx);
        const isSelected = slice.id === selectedSliceId;

        ctx.fillStyle = isSelected 
          ? (isDark ? 'rgba(250, 204, 21, 0.3)' : 'rgba(217, 119, 6, 0.25)') 
          : (isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(8, 145, 178, 0.15)');
        ctx.fillRect(sx, topY, sw, trackHeight - 4);

        ctx.strokeStyle = isSelected ? (isDark ? '#FACC15' : '#d97706') : slice.color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(sx, topY, sw, trackHeight - 4);

        const tagBg = isSelected ? (isDark ? '#FACC15' : '#d97706') : (isDark ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)');
        ctx.fillStyle = tagBg;
        ctx.fillRect(sx + 2, topY + 2, 42, 12);
        
        ctx.fillStyle = isSelected ? '#000000' : (isDark ? '#22D3EE' : '#0891b2');
        ctx.font = 'bold 8px JetBrains Mono';
        ctx.fillText(slice.padIndex !== undefined ? `P${slice.padIndex + 1}` : slice.name.slice(0, 6), sx + 4, topY + 11);
      });
    });

    // 3. Selection Region
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const sx = timeToPx(Math.min(selectionStart, selectionEnd));
      const ex = timeToPx(Math.max(selectionStart, selectionEnd));
      ctx.fillStyle = isDark ? 'rgba(250, 204, 21, 0.25)' : 'rgba(217, 119, 6, 0.2)';
      ctx.fillRect(sx, 0, ex - sx, height);
      ctx.strokeStyle = isDark ? '#FACC15' : '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, 0, ex - sx, height);
    }

    // 4. Playhead Line & Triangle Cap
    const playheadX = timeToPx(currentTime);
    ctx.beginPath();
    ctx.strokeStyle = isDark ? '#FACC15' : '#ea580c';
    ctx.lineWidth = 2;
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = isDark ? '#FACC15' : '#ea580c';
    ctx.beginPath();
    ctx.moveTo(playheadX - 5, 0);
    ctx.lineTo(playheadX + 5, 0);
    ctx.lineTo(playheadX, 8);
    ctx.closePath();
    ctx.fill();

  }, [tracks, activeTrack, currentTime, totalDuration, bpm, zoom, duration, totalWidth, isSelecting, selectionStart, selectionEnd, selectedSliceId, timeToPx]);

  const currentSelectedSlice = activeTrack?.slices.find((s) => s.id === selectedSliceId) || null;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#08080c] overflow-hidden select-none transition-colors border-y border-slate-200 dark:border-neutral-800">
      {/* Slicing Quick Action Bar */}
      <div className="px-3 sm:px-6 py-2 bg-slate-50 dark:bg-[#0f0f17] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onSliceAtCurrentTime}
            title="Slice active track at playhead (Hotkey: S)"
            className="min-h-[38px] px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-xs font-semibold text-amber-600 dark:text-yellow-400 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0 shadow-xs"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Slice at Playhead (S)</span>
          </button>

          <button
            onClick={onAutoSlice}
            title="Auto detect beats and slice automatically"
            className="min-h-[38px] px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-xs font-semibold text-cyan-600 dark:text-cyan-400 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Slice</span>
          </button>

          <button
            onClick={onSplitAtSilence}
            title="Detect pauses and slice at silence intervals"
            className="min-h-[38px] px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0 shadow-xs"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split at Silence</span>
          </button>
        </div>

        {/* Selected Slice Details */}
        {currentSelectedSlice ? (
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-amber-500/40 dark:border-yellow-400/30 rounded-lg px-2.5 py-1 text-xs shrink-0 shadow-xs">
            <span className="font-semibold text-amber-600 dark:text-yellow-400">{currentSelectedSlice.name}:</span>
            <span className="font-mono text-slate-600 dark:text-neutral-300 text-[11px]">
              {currentSelectedSlice.duration.toFixed(2)}s ({currentSelectedSlice.startTime.toFixed(2)}s–{currentSelectedSlice.endTime.toFixed(2)}s)
            </span>
            <button
              onClick={() => onPlaySlice(currentSelectedSlice)}
              title="Play Slice"
              className="p-1 hover:text-amber-500 text-slate-500 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
            <button
              onClick={() => onRemoveSlice(currentSelectedSlice.id)}
              title="Delete Slice"
              className="p-1 hover:text-red-500 text-slate-500 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="hidden md:inline text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
            Drag across track to create slice · Ctrl+Scroll to zoom
          </span>
        )}
      </div>

      {/* Interactive Scrollable Canvas with Wheel Zoom */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-50 dark:bg-[#060609] select-none cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          width={totalWidth}
          height={260}
          onMouseDown={(e) => handlePointerStart(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerEnd}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerStart(touch.clientX);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerMove(touch.clientX);
          }}
          onTouchEnd={handlePointerEnd}
          className="h-full block"
        />
      </div>
    </div>
  );
};
