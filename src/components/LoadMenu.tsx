import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Sparkles, 
  Music, 
  AlertTriangle, 
  FileAudio, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  Sliders
} from 'lucide-react';
import { MAX_RECOMMENDED_DURATION_SEC, MAX_RECOMMENDED_FILE_SIZE_MB } from '../types/user';

interface LoadMenuProps {
  onAddTrackFromFile: (file: File) => void;
  onAddDemoTrack: (type: 'cyberpunk_beat' | '808_bass' | 'neon_synth' | 'glitch_drums') => void;
  onNavigateToSlicing: () => void;
  hasTracks: boolean;
  activeTrackName?: string;
}

export const LoadMenu: React.FC<LoadMenuProps> = ({
  onAddTrackFromFile,
  onAddDemoTrack,
  onNavigateToSlicing,
  hasTracks,
  activeTrackName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const processFile = (file: File) => {
    setFileWarning(null);

    // File size check (> 120MB warning)
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_RECOMMENDED_FILE_SIZE_MB) {
      setFileWarning(`Warning: File is ${sizeMb.toFixed(1)} MB. Files over ${MAX_RECOMMENDED_FILE_SIZE_MB} MB may require significant browser memory.`);
    }

    onAddTrackFromFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name))) {
      processFile(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 bg-slate-50 dark:bg-[#0a0a0f] overflow-y-auto transition-colors select-none">
      <div className="max-w-3xl w-full mx-auto space-y-6 my-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-600 dark:text-yellow-400 font-bold">
            Step 1 · Audio Ingestion
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Load Audio or Select a Preset Beat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
            Drop your track to automatically extract BPM, compute spectrum waveforms, and unlock precision slicing.
          </p>
        </div>

        {/* Drag & Drop Hero Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#12121a]/80 hover:border-amber-400 dark:hover:border-yellow-400/60 shadow-sm'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-yellow-400 flex items-center justify-center mb-3">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100">
            Click to browse or drop an audio file here
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Supports MP3, WAV (16/24-bit), OGG, M4A, and FLAC
          </p>

          {/* Limitation & Memory Advisory */}
          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-[11px] text-slate-600 dark:text-neutral-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended max length: <strong>10 minutes</strong> (600s) for fluid Web Audio DSP</span>
          </div>
        </div>

        {/* Warning if any */}
        {fileWarning && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0" />
            <span>{fileWarning}</span>
          </div>
        )}

        {/* Active Track Confirmation / Direct Slicing Shortcut */}
        {hasTracks && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 block">
                  Current Master Track: {activeTrackName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Ready for waveform slicing, DSP processing, and beat production
                </span>
              </div>
            </div>

            <button
              onClick={onNavigateToSlicing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <span>Go to Slicing Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Demo Preset Packs */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Instant Procedural Audio Presets
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
              Zero Download · Real-time Synthesized
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onAddDemoTrack('cyberpunk_beat');
                onNavigateToSlicing();
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#12121a] hover:border-amber-500 dark:hover:border-yellow-400/50 text-left transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors">
                  2047 Cyberpunk Groove
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-700 dark:text-yellow-400">
                  128 BPM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Full dynamic beat machine groove with four-on-the-floor kick, snappy snare, 16th hats, and sub bass.
              </p>
            </button>

            <button
              onClick={() => {
                onAddDemoTrack('808_bass');
                onNavigateToSlicing();
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#12121a] hover:border-cyan-500 text-left transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Sub 808 Bassline
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                  Sub Synth
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Warm saturated 808 sub tones with analog pitch modulation and overdrive.
              </p>
            </button>

            <button
              onClick={() => {
                onAddDemoTrack('neon_synth');
                onNavigateToSlicing();
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#12121a] hover:border-purple-500 text-left transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Neon Synth Lead
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-400">
                  Arpeggiator
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Stereo detuned dual saw lead arpeggio designed for chop slicing and MPC triggering.
              </p>
            </button>

            <button
              onClick={() => {
                onAddDemoTrack('glitch_drums');
                onNavigateToSlicing();
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#12121a] hover:border-pink-500 text-left transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  Cyber Glitch Drums
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-700 dark:text-pink-400">
                  Percussion
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Hyper-snappy transients and syncopated noise bursts ideal for transient trip auto-slice testing.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
