import React, { useState } from 'react';
import { X, Download, Disc, RefreshCw, Sparkles, FileAudio, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { AudioTrack, MasterEffects } from '../types/audio';
import { exportAudioWithFFmpeg } from '../utils/ffmpegHelper';
import { MAX_RECOMMENDED_DURATION_SEC } from '../types/user';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: AudioTrack[];
  effects: MasterEffects;
  totalDuration: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  effects,
  totalDuration,
}) => {
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav');
  const [bitDepth, setBitDepth] = useState<16 | 24>(24);
  const [normalize, setNormalize] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  if (!isOpen) return null;

  const durationMin = totalDuration / 60;
  const isOverRecommendedLimit = totalDuration > MAX_RECOMMENDED_DURATION_SEC;
  
  // Calculate approximate file size
  const estimatedSizeMb = format === 'mp3' 
    ? (totalDuration * 40) / 1024 
    : format === 'wav' && bitDepth === 24 
    ? (totalDuration * 264.6) / 1024 
    : (totalDuration * 176.4) / 1024;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(10);
      setStatusMessage('Summing audio tracks and DSP rack...');

      const activeBuffers = tracks.filter((t) => t.audioBuffer && !t.muted);
      if (activeBuffers.length === 0) {
        setStatusMessage('No active audio tracks to export. Please add or unmute a track.');
        setIsExporting(false);
        return;
      }

      const sampleRate = 44100;
      const duration = Math.max(1, totalDuration || activeBuffers[0].audioBuffer!.duration);
      const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

      activeBuffers.forEach((track) => {
        const src = offlineCtx.createBufferSource();
        src.buffer = track.audioBuffer;
        
        const gain = offlineCtx.createGain();
        gain.gain.value = track.volume;

        const panner = offlineCtx.createStereoPanner();
        panner.pan.value = track.pan;

        src.connect(gain);
        gain.connect(panner);
        panner.connect(offlineCtx.destination);
        src.start(0);
      });

      setExportProgress(35);
      setStatusMessage('Rendering offline mixdown buffer...');
      const renderedBuffer = await offlineCtx.startRendering();

      setExportProgress(65);
      setStatusMessage('Encoding 24-bit PCM WAV stream / FFmpeg WASM...');

      const result = await exportAudioWithFFmpeg(
        renderedBuffer,
        format,
        bitDepth,
        normalize,
        (prog, msg) => {
          setExportProgress(Math.max(65, prog));
          setStatusMessage(msg);
        }
      );

      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setDownloadFilename(result.filename);
      setExportProgress(100);
      setStatusMessage('Export Complete! Ready for download.');
    } catch (err) {
      console.error('Export error:', err);
      setStatusMessage('Export error occurred. Please check audio tracks and retry.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-amber-500 dark:text-yellow-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Master Audio Export Engine
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Track Duration & Estimated Size Summary Card */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80 rounded-xl p-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block">Duration</span>
              <span className="text-amber-600 dark:text-yellow-400 font-bold">{totalDuration.toFixed(1)}s ({durationMin.toFixed(1)}m)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Estimated Size</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">~{estimatedSizeMb.toFixed(1)} MB</span>
            </div>
            <div>
              <span className="text-slate-400 block">Max Limit</span>
              <span className="text-slate-600 dark:text-neutral-300 font-bold">10 min (600s)</span>
            </div>
          </div>

          {/* Limitation Warning if > 10 min */}
          {isOverRecommendedLimit && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Duration Exceeds 10-Minute Recommendation</span>
                <span className="text-[11px] opacity-90">
                  Exporting tracks longer than 10 minutes requires significant browser memory. Ensure you have sufficient RAM available.
                </span>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="text-xs text-slate-600 dark:text-neutral-400 block mb-2 font-medium">Export Format</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setFormat('wav')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  format === 'wav'
                    ? 'bg-amber-400/10 dark:bg-yellow-400/10 border-amber-500 dark:border-yellow-400 text-amber-700 dark:text-yellow-400 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0a0a0f] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">WAV (PCM)</span>
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-normal block mt-1">
                  Studio Master Lossless
                </span>
              </button>

              <button
                onClick={() => setFormat('mp3')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  format === 'mp3'
                    ? 'bg-cyan-500/10 border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0a0a0f] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">MP3 (FFmpeg WASM)</span>
                  <FileAudio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-normal block mt-1">
                  320 kbps Streaming
                </span>
              </button>
            </div>
          </div>

          {/* Bit Depth for WAV */}
          {format === 'wav' && (
            <div>
              <label className="text-xs text-slate-600 dark:text-neutral-400 block mb-2 font-mono">Bit Depth</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBitDepth(24)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                    bitDepth === 24
                      ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold border-amber-400 dark:border-yellow-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0a0a0f] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  24-bit Studio Master
                </button>
                <button
                  onClick={() => setBitDepth(16)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                    bitDepth === 16
                      ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold border-amber-400 dark:border-yellow-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0a0a0f] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  16-bit Standard CD
                </button>
              </div>
            </div>
          )}

          {/* Normalization */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 block">
                Peak Loudness Normalization
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-500 block">
                Maximizes audio to -0.1 dB True Peak without digital distortion.
              </span>
            </div>
            <input
              type="checkbox"
              checked={normalize}
              onChange={(e) => setNormalize(e.target.checked)}
              className="w-4 h-4 accent-amber-500 dark:accent-yellow-400 rounded cursor-pointer"
            />
          </div>

          {/* Progress Bar */}
          {statusMessage && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80 font-mono text-[11px]">
              <div className="flex justify-between text-slate-600 dark:text-neutral-400">
                <span className="truncate pr-2">{statusMessage}</span>
                <span className="text-amber-600 dark:text-yellow-400 shrink-0">{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-cyan-400 dark:from-yellow-400 dark:to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download Link */}
          {downloadUrl && (
            <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 block truncate">
                  {downloadFilename}
                </span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400/80 block">
                  Export ready for distribution
                </span>
              </div>
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="min-h-[40px] px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0e0e16]">
          <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
            {tracks.length} track(s) · {totalDuration.toFixed(1)}s
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="min-h-[40px] px-3 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isExporting
                  ? 'bg-slate-300 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 cursor-not-allowed'
                  : 'bg-amber-400 dark:bg-yellow-400 hover:bg-amber-300 dark:hover:bg-yellow-300 text-black'
              }`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Rendering...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Render Mix</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
