import React, { useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Volume2, 
  VolumeX, 
  Music2, 
  Trash2, 
  Copy, 
  FileText,
  Sparkles,
  Layers
} from 'lucide-react';
import { AudioTrack } from '../types/audio';

interface TrackSidebarProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onAddTrackFromFile: (file: File) => void;
  onAddDemoTrack: (type: 'cyberpunk_beat' | '808_bass' | 'neon_synth' | 'glitch_drums') => void;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  onDeleteTrack: (trackId: string) => void;
  onDuplicateTrack: (trackId: string) => void;
  onOpenMetadata: (track: AudioTrack) => void;
  isMobileFullView?: boolean;
}

export const TrackSidebar: React.FC<TrackSidebarProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  onAddTrackFromFile,
  onAddDemoTrack,
  onUpdateTrack,
  onDeleteTrack,
  onDuplicateTrack,
  onOpenMetadata,
  isMobileFullView = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddTrackFromFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onAddTrackFromFile(file);
    }
  };

  return (
    <aside 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`${
        isMobileFullView ? 'w-full flex-1' : 'hidden md:flex w-72 lg:w-80 shrink-0'
      } bg-slate-50 dark:bg-[#0d0d14] border-r border-slate-200 dark:border-neutral-800 flex flex-col overflow-hidden transition-colors`}
    >
      {/* Sidebar Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300">
            Multi-Tracks ({tracks.length})
          </span>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload audio file (MP3, WAV, OGG, M4A)"
            className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-amber-600 dark:text-yellow-400 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Preset Beats / Stems Loader */}
      <div className="px-3 py-2 bg-slate-100 dark:bg-[#09090e] border-b border-slate-200 dark:border-neutral-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-neutral-400 mb-1.5 font-mono">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            Preset Loops
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onAddDemoTrack('cyberpunk_beat')}
            className="px-2 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-amber-400 text-[11px] text-slate-700 dark:text-neutral-300 rounded text-left truncate transition-colors cursor-pointer"
          >
            + 2047 Groove
          </button>
          <button
            onClick={() => onAddDemoTrack('808_bass')}
            className="px-2 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-cyan-400 text-[11px] text-slate-700 dark:text-neutral-300 rounded text-left truncate transition-colors cursor-pointer"
          >
            + 808 Sub Bass
          </button>
          <button
            onClick={() => onAddDemoTrack('neon_synth')}
            className="px-2 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-purple-400 text-[11px] text-slate-700 dark:text-neutral-300 rounded text-left truncate transition-colors cursor-pointer"
          >
            + Neon Synth
          </button>
          <button
            onClick={() => onAddDemoTrack('glitch_drums')}
            className="px-2 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-pink-400 text-[11px] text-slate-700 dark:text-neutral-300 rounded text-left truncate transition-colors cursor-pointer"
          >
            + Glitch Drums
          </button>
        </div>
      </div>

      {/* Track List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {tracks.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 dark:border-neutral-800 rounded-xl bg-slate-100/50 dark:bg-neutral-900/30">
            <Music2 className="w-8 h-8 text-slate-400 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-slate-600 dark:text-neutral-400 mb-2">No audio tracks yet</p>
            <button
              onClick={() => onAddDemoTrack('cyberpunk_beat')}
              className="px-3 py-1.5 bg-amber-400 dark:bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Load Demo Beat
            </button>
          </div>
        ) : (
          tracks.map((track) => {
            const isActive = track.id === activeTrackId;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`group relative rounded-xl p-3 border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900/90 border-amber-500/60 dark:border-yellow-400/60 shadow-md shadow-yellow-400/5 ring-1 ring-amber-500/30'
                    : 'bg-white/80 dark:bg-[#12121a]/80 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Track Title Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: track.color }}
                    />
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-neutral-200 focus:text-amber-600 dark:focus:text-yellow-400 focus:outline-none truncate w-full"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {track.isStem && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/60">
                        {track.stemType}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMetadata(track);
                      }}
                      title="Metadata & ID3 Tags"
                      className="p-1.5 text-slate-400 dark:text-neutral-500 hover:text-amber-500 dark:hover:text-yellow-400 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateTrack(track.id);
                      }}
                      title="Duplicate Track"
                      className="p-1.5 text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrack(track.id);
                      }}
                      title="Delete Track"
                      className="p-1.5 text-slate-400 dark:text-neutral-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Track Audio Specs */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-500 font-mono mb-2">
                  <span>{track.metadata.sampleRate / 1000} kHz · {track.metadata.channels === 2 ? 'Stereo' : 'Mono'}</span>
                  <span>{track.slices.length} Slices</span>
                </div>

                {/* Volume & Pan Controls */}
                <div className="space-y-2 pt-1.5 border-t border-slate-200/80 dark:border-neutral-800/60" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                        className={`min-w-[28px] min-h-[28px] px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                          track.muted 
                            ? 'bg-red-500 text-white' 
                            : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() => onUpdateTrack(track.id, { solo: !track.solo })}
                        className={`min-w-[28px] min-h-[28px] px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                          track.solo 
                            ? 'bg-amber-400 dark:bg-yellow-400 text-black' 
                            : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        S
                      </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-1.5 flex-1 max-w-[130px]">
                      {track.muted ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 shrink-0" />
                      )}
                      <input
                        type="range"
                        min={0}
                        max={1.5}
                        step={0.01}
                        value={track.volume}
                        onChange={(e) => onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-600 dark:text-neutral-400 w-8 text-right tabular-nums">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Pan Slider */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-500">
                    <span>Pan</span>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.05}
                      value={track.pan}
                      onChange={(e) => onUpdateTrack(track.id, { pan: parseFloat(e.target.value) })}
                      className="w-24 accent-cyan-500 dark:accent-cyan-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                    />
                    <span className="w-10 text-right tabular-nums">
                      {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
