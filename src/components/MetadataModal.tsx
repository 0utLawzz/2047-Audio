import React, { useState } from 'react';
import { X, FileText, Save } from 'lucide-react';
import { AudioTrack, AudioMetadata } from '../types/audio';

interface MetadataModalProps {
  track: AudioTrack | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveMetadata: (trackId: string, metadata: AudioMetadata) => void;
}

const DEFAULT_METADATA: AudioMetadata = {
  title: '',
  artist: '',
  album: '',
  genre: '',
  year: '',
  bpm: 120,
  key: 'C Major',
  duration: 0,
  sampleRate: 44100,
  channels: 2,
  bitDepth: 24,
  fileSize: 0,
  fileType: 'audio/wav',
};

export const MetadataModal: React.FC<MetadataModalProps> = ({
  track,
  isOpen,
  onClose,
  onSaveMetadata,
}) => {
  const [formData, setFormData] = useState<AudioMetadata>(
    track ? { ...track.metadata } : DEFAULT_METADATA
  );

  React.useEffect(() => {
    if (track) {
      setFormData({ ...track.metadata });
    }
  }, [track]);

  if (!isOpen || !track) return null;

  const handleSave = () => {
    onSaveMetadata(track.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500 dark:text-yellow-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Audio Metadata & ID3 Tags
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Technical Specs Readout */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80 rounded-xl p-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-neutral-500 block">Sample Rate</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{formData.sampleRate} Hz</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-500 block">Channels</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{formData.channels === 2 ? 'Stereo (2)' : 'Mono (1)'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-500 block">Bit Depth</span>
              <span className="text-amber-600 dark:text-yellow-400 font-bold">{formData.bitDepth || 24}-bit PCM</span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block">Track Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-400 dark:focus:border-yellow-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block">Artist</label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-400 dark:focus:border-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block">Album</label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-400 dark:focus:border-yellow-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block">Genre</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-400 dark:focus:border-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block font-mono">BPM</label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-2 sm:px-3 py-2 text-xs font-mono text-amber-600 dark:text-yellow-400 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block font-mono">Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-2 sm:px-3 py-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block font-mono">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-2 sm:px-3 py-2 text-xs font-mono text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0e0e16]">
          <button
            onClick={onClose}
            className="min-h-[44px] px-3.5 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold bg-amber-400 dark:bg-yellow-400 text-black hover:bg-amber-300 dark:hover:bg-yellow-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Metadata</span>
          </button>
        </div>
      </div>
    </div>
  );
};
