import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Repeat, 
  RotateCcw, 
  RotateCw, 
  Activity, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Plus, 
  Minus,
  Bell,
  Volume2
} from 'lucide-react';
import { playMetronomeClick } from '../utils/metronome';

interface TransportBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  currentTime: number;
  totalDuration: number;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  onDetectBpm: () => void;
  isDetectingBpm: boolean;
  isLockToBpm: boolean;
  onToggleLockToBpm: () => void;
  gridSnap: 'off' | '1/4' | '1/8' | '1/16' | '1/32';
  onChangeGridSnap: (snap: 'off' | '1/4' | '1/8' | '1/16' | '1/32') => void;
  zoom: number;
  onChangeZoom: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Metronome state
  isMetronomeAudible: boolean;
  onToggleMetronomeAudible: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  isLooping,
  onToggleLoop,
  currentTime,
  totalDuration,
  bpm,
  onChangeBpm,
  onDetectBpm,
  isDetectingBpm,
  isLockToBpm,
  onToggleLockToBpm,
  gridSnap,
  onChangeGridSnap,
  zoom,
  onChangeZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isMetronomeAudible,
  onToggleMetronomeAudible,
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const lastBeatIndexRef = useRef<number>(-1);

  // Compute active beat (0, 1, 2, 3 in 4/4) from current time and BPM
  const beatsPerSecond = bpm / 60;
  const currentTotalBeats = Math.floor(currentTime * beatsPerSecond);
  const activeBeatInBar = Math.floor(currentTotalBeats % 4);

  // Trigger audible click on beat change during playback
  useEffect(() => {
    if (!isPlaying) {
      lastBeatIndexRef.current = -1;
      return;
    }
    if (currentTotalBeats !== lastBeatIndexRef.current) {
      lastBeatIndexRef.current = currentTotalBeats;
      if (isMetronomeAudible) {
        const isDownbeat = activeBeatInBar === 0;
        playMetronomeClick(isDownbeat, 0.65);
      }
    }
  }, [currentTotalBeats, isPlaying, isMetronomeAudible, activeBeatInBar]);

  // Format MM:SS.mmm
  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Format Bars.Beats
  const formatBarBeats = (sec: number, currentBpm: number) => {
    const beatsTotal = (sec * currentBpm) / 60;
    const bar = Math.floor(beatsTotal / 4) + 1;
    const beat = Math.floor(beatsTotal % 4) + 1;
    return `${bar.toString().padStart(2, '0')}.${beat}`;
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const newTimes = [...tapTimes, now].filter(t => now - t < 3000);
    setTapTimes(newTimes);

    if (newTimes.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < newTimes.length; i++) {
        totalDiff += (newTimes[i] - newTimes[i - 1]);
      }
      const avgMs = totalDiff / (newTimes.length - 1);
      const computedBpm = Math.round(60000 / avgMs);
      if (computedBpm >= 60 && computedBpm <= 220) {
        onChangeBpm(computedBpm);
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#12121a] border-b border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 select-none z-20 transition-colors">
      {/* Tier 1: Transport Controls, Visual Metronome Pulse & LCD Counter */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className={`min-h-[44px] min-w-[44px] sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95 ${
              isPlaying 
                ? 'bg-amber-400 dark:bg-yellow-400 text-black shadow-md shadow-yellow-400/20' 
                : 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-amber-600 dark:text-yellow-400 border border-slate-300 dark:border-neutral-700'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onStop}
            title="Stop & Reset (Enter/Home)"
            className="min-h-[44px] min-w-[44px] sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleLoop}
            title="Toggle Loop Playback"
            className={`min-h-[44px] min-w-[44px] sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isLooping 
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-700 dark:text-cyan-400 font-bold' 
                : 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Audible Metronome Click Button */}
          <button
            onClick={onToggleMetronomeAudible}
            title={isMetronomeAudible ? 'Audible Click-Track Metronome: ON' : 'Audible Click-Track Metronome: OFF'}
            className={`min-h-[44px] min-w-[44px] sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isMetronomeAudible
                ? 'bg-amber-400/20 border border-amber-500 text-amber-700 dark:text-yellow-400 font-bold'
                : 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-400 dark:text-neutral-500 border border-slate-200 dark:border-neutral-700'
            }`}
          >
            <Bell className={`w-4 h-4 ${isMetronomeAudible ? 'fill-current' : ''}`} />
          </button>

          {/* Desktop Undo / Redo */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                canUndo ? 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800' : 'text-slate-300 dark:text-neutral-700 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                canRedo ? 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800' : 'text-slate-300 dark:text-neutral-700 cursor-not-allowed'
              }`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Visual Metronome Pulse Indicator (4-beat LED dots) */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-xs">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono uppercase text-slate-400 dark:text-neutral-500 font-semibold">
              Beat Pulse
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[0, 1, 2, 3].map((b) => {
                const isActive = isPlaying && activeBeatInBar === b;
                const isDownbeat = b === 0;
                return (
                  <span
                    key={b}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                      isActive
                        ? isDownbeat
                          ? 'bg-amber-500 dark:bg-yellow-400 scale-125 shadow-md shadow-yellow-400/50'
                          : 'bg-cyan-500 dark:bg-cyan-400 scale-110 shadow-sm shadow-cyan-400/40'
                        : 'bg-slate-200 dark:bg-neutral-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:border-neutral-800 mx-1 hidden sm:block" />

          {/* Bar / Beat Readout */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-mono uppercase">Bar.Beat</span>
            <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
              {formatBarBeats(currentTime, bpm)}
            </span>
          </div>
        </div>

        {/* LCD Counter: Timecode */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#08080c] border border-slate-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-xs">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 dark:text-neutral-400 font-mono uppercase tracking-wider">Timecode</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-yellow-400 tabular-nums">
              {formatTimecode(currentTime)}
            </span>
          </div>
          <div className="hidden sm:flex flex-col border-l border-slate-200 dark:border-neutral-800 pl-2.5">
            <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-mono uppercase tracking-wider">Total</span>
            <span className="font-mono text-xs text-slate-500 dark:text-neutral-400 tabular-nums">
              {formatTimecode(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Tier 2: BPM, Grid Snap, Metronome Sound, and Timeline Zoom */}
      <div className="flex items-center gap-2 px-3 sm:px-6 py-1.5 border-t border-slate-100 dark:border-neutral-800/80 overflow-x-auto no-scrollbar">
        {/* BPM Stepper Box */}
        <div className="flex items-center bg-slate-50 dark:bg-[#08080c] border border-slate-200 dark:border-neutral-800 rounded-lg px-1.5 py-1 shrink-0">
          <button
            onClick={() => onChangeBpm(Math.max(40, bpm - 1))}
            className="p-1 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Decrease BPM"
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className="flex items-center px-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mr-1">BPM</span>
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-yellow-400 tabular-nums w-8 text-center">
              {bpm}
            </span>
          </div>
          <button
            onClick={() => onChangeBpm(Math.min(260, bpm + 1))}
            className="p-1 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Increase BPM"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* TAP Tempo */}
        <button
          onClick={handleTapTempo}
          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-mono text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer active:scale-95 shrink-0"
        >
          TAP
        </button>

        {/* Auto Detect BPM */}
        <button
          onClick={onDetectBpm}
          disabled={isDetectingBpm}
          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Activity className={`w-3.5 h-3.5 ${isDetectingBpm ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[11px]">{isDetectingBpm ? 'Detecting...' : 'Auto BPM'}</span>
        </button>

        {/* Lock Sync */}
        <button
          onClick={onToggleLockToBpm}
          className={`min-h-[34px] px-2 py-1 rounded-lg text-xs flex items-center gap-1 border transition-colors cursor-pointer shrink-0 ${
            isLockToBpm 
              ? 'bg-amber-400/20 border-amber-500 dark:border-yellow-400/50 text-amber-700 dark:text-yellow-400' 
              : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400'
          }`}
        >
          {isLockToBpm ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          <span className="font-mono text-[10px]">Sync</span>
        </button>

        {/* Grid Snap */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg p-0.5 shrink-0">
          <Grid className="w-3 h-3 text-slate-400 dark:text-neutral-500 ml-1" />
          {(['off', '1/4', '1/8', '1/16'] as const).map((snapVal) => (
            <button
              key={snapVal}
              onClick={() => onChangeGridSnap(snapVal)}
              className={`px-1.5 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                gridSnap === snapVal 
                  ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold' 
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {snapVal}
            </button>
          ))}
        </div>

        {/* Fixed Smooth Timeline Zoom Controls */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2 py-1">
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 hidden sm:inline">Zoom:</span>
          <button
            onClick={() => onChangeZoom(Math.max(0.5, +(zoom - 0.5).toFixed(1)))}
            className="p-1 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Zoom Out Waveform"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-yellow-400 tabular-nums w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => onChangeZoom(Math.min(6, +(zoom + 0.5).toFixed(1)))}
            className="p-1 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Zoom In Waveform"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Quick Fit preset */}
          <button
            onClick={() => onChangeZoom(1.0)}
            className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 rounded text-slate-700 dark:text-neutral-300 cursor-pointer ml-1"
            title="Reset Zoom to 100%"
          >
            Fit
          </button>
        </div>
      </div>
    </div>
  );
};
