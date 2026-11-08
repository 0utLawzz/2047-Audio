import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Sparkles, 
  Music, 
  Grid, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X,
  Volume2
} from 'lucide-react';
import { AudioTrack, AudioSlice } from '../types/audio';

interface BeatPadsProps {
  activeTrack: AudioTrack | null;
  onTriggerPad: (padIndex: number, slice?: AudioSlice) => void;
  onAssignSliceToPad: (sliceId: string, padIndex: number) => void;
  onClearPad: (padIndex: number) => void;
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
  onAssignSliceToPad,
  onClearPad,
}) => {
  const [activePad, setActivePad] = useState<number | null>(null);
  const [padPitch, setPadPitch] = useState<number>(0);
  const [padBank, setPadBank] = useState<'A' | 'B'>('A');

  // Custom Keybindings state
  const [customKeybindings, setCustomKeybindings] = useState<string[]>(DEFAULT_SHORTCUTS);
  const [editingKeyPadIdx, setEditingKeyPadIdx] = useState<number | null>(null);

  // Pad Slice Selector Modal / Dropdown state
  const [assigningPadIdx, setAssigningPadIdx] = useState<number | null>(null);

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
    }, 120);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (editingKeyPadIdx !== null) {
        // We are assigning a new key to the selected pad!
        e.preventDefault();
        const newKey = e.key.toUpperCase();
        if (newKey.length === 1 || newKey.startsWith('F')) {
          const updated = [...customKeybindings];
          updated[editingKeyPadIdx] = newKey;
          setCustomKeybindings(updated);
          setEditingKeyPadIdx(null);
        }
        return;
      }

      const key = e.key.toUpperCase();
      const padIdx = customKeybindings.indexOf(key);
      if (padIdx !== -1) {
        handlePadPress(padIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [padToSliceMap, customKeybindings, editingKeyPadIdx]);

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
            Click pad to trigger · Click [Edit] on pad to assign slices or change key shortcuts
          </p>
        </div>

        {/* Bank & Pitch Controls */}
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

          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-mono">
            <span className="text-slate-500 dark:text-neutral-400">Tune:</span>
            <span className="text-amber-600 dark:text-yellow-400 font-bold tabular-nums">
              {padPitch > 0 ? `+${padPitch}` : padPitch} st
            </span>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={padPitch}
              onChange={(e) => setPadPitch(parseInt(e.target.value))}
              className="w-16 accent-amber-500 dark:accent-yellow-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Rebind Key Instruction Bar if active */}
      {editingKeyPadIdx !== null && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between animate-pulse">
          <span>Press any key on your keyboard to assign to <strong>PAD {editingKeyPadIdx + 1}</strong>...</span>
          <button
            onClick={() => setEditingKeyPadIdx(null)}
            className="p-1 text-amber-900 dark:text-amber-200 hover:text-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4x4 Beat Machine Pad Grid */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl w-full mx-auto my-auto flex-1 auto-rows-fr">
        {Array.from({ length: 16 }).map((_, idx) => {
          const slice = padToSliceMap.get(idx);
          const isPressed = activePad === idx;
          const shortcut = customKeybindings[idx];

          return (
            <div
              key={idx}
              className={`relative rounded-xl border p-2 sm:p-3 flex flex-col justify-between transition-all duration-75 select-none text-left touch-manipulation min-h-[78px] sm:min-h-[105px] group ${
                isPressed
                  ? 'bg-amber-400 dark:bg-yellow-400 border-amber-300 dark:border-yellow-300 text-black scale-95 shadow-lg shadow-yellow-400/40 ring-4 ring-yellow-400/50'
                  : slice
                  ? 'bg-white dark:bg-[#151520] hover:bg-slate-50 dark:hover:bg-[#1c1c2b] border-slate-300 dark:border-neutral-700/80 text-slate-900 dark:text-neutral-100 shadow-xs'
                  : 'bg-slate-200/60 dark:bg-neutral-950/70 border-slate-200 dark:border-neutral-800/80 text-slate-400 dark:text-neutral-600 hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Pad Top: Number, Hotkey & Quick Edit triggers */}
              <div className="flex items-center justify-between w-full">
                <span className={`font-mono text-[10px] sm:text-xs font-black ${
                  isPressed ? 'text-black' : 'text-amber-600 dark:text-yellow-400'
                }`}>
                  PAD {idx + 1}
                </span>

                <div className="flex items-center gap-1">
                  {/* Clickable shortcut badge to rebind key */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingKeyPadIdx(idx);
                    }}
                    title="Click to rebind hotkey"
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded border cursor-pointer hover:border-amber-500 transition-colors ${
                      isPressed
                        ? 'bg-black text-yellow-400 border-black'
                        : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                    }`}
                  >
                    [{shortcut}]
                  </button>

                  {/* Clear / Delete Slice from Pad */}
                  {slice && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearPad(idx);
                      }}
                      title="Clear slice from pad"
                      className="p-0.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pad Trigger Button Body */}
              <button
                onTouchStart={(e) => handlePadPress(idx, e)}
                onMouseDown={() => handlePadPress(idx)}
                className="my-auto py-1 w-full text-left cursor-pointer focus:outline-none"
              >
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
              </button>

              {/* Pad Bottom: Audio indicator & Assign slice trigger */}
              <div className="w-full flex items-center justify-between pt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isPressed 
                    ? 'bg-black' 
                    : (slice ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-slate-300 dark:bg-neutral-700')
                }`} />

                {/* Option to load or assign a slice */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssigningPadIdx(assigningPadIdx === idx ? null : idx);
                  }}
                  title="Assign a slice from track to this pad"
                  className={`text-[9px] font-mono px-1 py-0.5 rounded cursor-pointer transition-colors ${
                    slice 
                      ? 'text-slate-400 hover:text-amber-500' 
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:text-amber-500'
                  }`}
                >
                  {slice ? 'Reassign' : 'Assign'}
                </button>
              </div>

              {/* Dropdown / Popover to pick slice */}
              {assigningPadIdx === idx && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 bottom-full mb-1 z-30 w-48 bg-white dark:bg-[#12121a] border border-slate-300 dark:border-neutral-700 rounded-xl shadow-xl p-2 text-xs space-y-1 max-h-40 overflow-y-auto"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block px-1">
                    Select Track Slice:
                  </span>
                  {slices.length === 0 ? (
                    <p className="text-[10px] text-slate-400 p-1">No slices on track yet. Go to Timeline to create slices.</p>
                  ) : (
                    slices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onAssignSliceToPad(s.id, idx);
                          setAssigningPadIdx(null);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-amber-400/20 text-slate-700 dark:text-neutral-200 text-xs truncate cursor-pointer"
                      >
                        {s.name} ({s.duration.toFixed(2)}s)
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
