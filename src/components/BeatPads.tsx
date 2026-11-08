import React, { useState, useEffect } from 'react';
import { Sparkles, Music, Grid, Volume2 } from 'lucide-react';
import { AudioTrack, AudioSlice } from '../types/audio';

interface BeatPadsProps {
  activeTrack: AudioTrack | null;
  onTriggerPad: (padIndex: number, slice?: AudioSlice) => void;
  onAssignSliceToPad?: (sliceId: string, padIndex: number) => void;
  onClearPad?: (padIndex: number) => void;
}

const DEFAULT_SHORTCUTS = [
  '1', '2', '3', '4',
  'Q', 'W', 'E', 'R',
  'A', 'S', 'D', 'F',
  'Z', 'X', 'C', 'V',
];

export const BeatPads: React.FC<BeatPadsProps> = ({
  activeTrack,
  onTriggerPad,
}) => {
  const [activePad, setActivePad] = useState<number | null>(null);
  const [padBank, setPadBank] = useState<'A' | 'B'>('A');

  const slices = activeTrack?.slices || [];
  const padToSliceMap = new Map<number, AudioSlice>();

  slices.forEach((slice, idx) => {
    if (slice.padIndex !== undefined && slice.padIndex < 16) {
      padToSliceMap.set(slice.padIndex, slice);
    } else if (idx < 16 && !padToSliceMap.has(idx)) {
      padToSliceMap.set(idx, slice);
    }
  });

  const handlePadPress = (padIndex: number, e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setActivePad(padIndex);
    const slice = padToSliceMap.get(padIndex);
    onTriggerPad(padIndex, slice);
    setTimeout(() => {
      setActivePad((curr) => (curr === padIndex ? null : curr));
    }, 140);
  };

  // Keyboard shortcut listener for instantaneous pad triggering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const key = e.key.toUpperCase();
      const padIdx = DEFAULT_SHORTCUTS.indexOf(key);
      if (padIdx !== -1) {
        handlePadPress(padIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [padToSliceMap]);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 bg-slate-100 dark:bg-[#0a0a0f] overflow-y-auto select-none transition-colors">
      {/* Top Pad Header & Bank Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5 sm:gap-2">
            <span>2047 MPC Beat Machine</span>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-amber-500/15 dark:bg-yellow-400/15 text-amber-700 dark:text-yellow-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              16 Velocity Pads
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Click or tap any pad to trigger · Or use keyboard keys [1-4, Q-R, A-F, Z-V]
          </p>
        </div>

        {/* Bank Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setPadBank('A')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-colors ${
                padBank === 'A' ? 'bg-amber-400 dark:bg-yellow-400 text-black' : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              BANK A
            </button>
            <button
              onClick={() => setPadBank('B')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-colors ${
                padBank === 'B' ? 'bg-cyan-500 dark:bg-cyan-400 text-black' : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              BANK B
            </button>
          </div>
        </div>
      </div>

      {/* 4x4 Beat Machine Pad Grid - Clean, Tactile & Instant Trigger */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl w-full mx-auto my-auto flex-1 auto-rows-fr">
        {Array.from({ length: 16 }).map((_, idx) => {
          const slice = padToSliceMap.get(idx);
          const isPressed = activePad === idx;
          const shortcut = DEFAULT_SHORTCUTS[idx];

          return (
            <button
              key={idx}
              onTouchStart={(e) => handlePadPress(idx, e)}
              onMouseDown={(e) => handlePadPress(idx, e)}
              className={`relative rounded-xl border p-2.5 sm:p-4 flex flex-col justify-between transition-all duration-75 select-none text-left touch-manipulation min-h-[82px] sm:min-h-[110px] cursor-pointer focus:outline-none ${
                isPressed
                  ? 'bg-amber-400 dark:bg-yellow-400 border-amber-300 dark:border-yellow-300 text-black scale-95 shadow-lg shadow-yellow-400/40 ring-4 ring-yellow-400/50'
                  : slice
                  ? 'bg-white dark:bg-[#14141e] hover:bg-slate-50 dark:hover:bg-[#1c1c2b] border-slate-300 dark:border-neutral-700/80 text-slate-900 dark:text-neutral-100 shadow-xs active:scale-95'
                  : 'bg-slate-200/60 dark:bg-neutral-950/70 border-slate-200 dark:border-neutral-800/80 text-slate-400 dark:text-neutral-600 hover:border-slate-300 dark:hover:border-neutral-700 active:scale-95'
              }`}
            >
              {/* Pad Top: Number & Hotkey */}
              <div className="flex items-center justify-between w-full pointer-events-none">
                <span className={`font-mono text-[10px] sm:text-xs font-black ${
                  isPressed ? 'text-black' : 'text-amber-600 dark:text-yellow-400'
                }`}>
                  PAD {idx + 1}
                </span>

                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                  isPressed
                    ? 'bg-black text-yellow-400 border-black'
                    : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                }`}>
                  [{shortcut}]
                </span>
              </div>

              {/* Pad Content */}
              <div className="my-auto py-1 pointer-events-none">
                {slice ? (
                  <div>
                    <p className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                      isPressed ? 'text-black' : 'text-slate-800 dark:text-neutral-200'
                    }`}>
                      {slice.name}
                    </p>
                    <p className={`text-[10px] font-mono tabular-nums ${
                      isPressed ? 'text-black font-semibold' : 'text-cyan-600 dark:text-cyan-400'
                    }`}>
                      {slice.duration.toFixed(2)}s
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-slate-400 dark:text-neutral-600 italic">
                    + Empty Pad
                  </div>
                )}
              </div>

              {/* Pad Bottom: Audio indicator dot */}
              <div className="w-full flex items-center justify-between pt-1 pointer-events-none">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isPressed 
                    ? 'bg-black' 
                    : (slice ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-slate-300 dark:bg-neutral-700')
                }`} />

                <span className="text-[9px] font-mono text-slate-400 dark:text-neutral-500">
                  {slice ? 'Ready' : 'Synth'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
