import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Sliders, 
  Wind, 
  Zap, 
  Waves, 
  RefreshCw, 
  CheckCircle2,
  Volume2,
  Activity,
  BarChart2,
  Shield,
  Gauge,
  Bookmark,
  Plus,
  Trash2,
  Check,
  Disc
} from 'lucide-react';
import { MasterEffects, AudioTrack } from '../types/audio';
import { separateAudioStems } from '../utils/audioEffects';
import { 
  DSPPreset, 
  BUILTIN_DSP_PRESETS, 
  loadCustomDSPPresets, 
  saveCustomDSPPreset, 
  deleteCustomDSPPreset 
} from '../types/presets';

interface DSPMasterRackProps {
  effects: MasterEffects;
  onChangeEffects: (newEffects: MasterEffects) => void;
  activeTrack: AudioTrack | null;
  onAddSeparatedStems: (stems: { vocal: AudioBuffer; bass: AudioBuffer; drums: AudioBuffer; other: AudioBuffer }) => void;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  onBufferSync?: () => void;
}

export const DSPMasterRack: React.FC<DSPMasterRackProps> = ({
  effects,
  onChangeEffects,
  activeTrack,
  onAddSeparatedStems,
  analyserNode,
  isPlaying,
  onBufferSync,
}) => {
  const [activeRackTab, setActiveRackTab] = useState<'all' | 'dsp' | 'eq_dynamics' | 'stems'>('all');
  const [isSeparatingStems, setIsSeparatingStems] = useState(false);
  const [stemSuccess, setStemSuccess] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<DSPPreset[]>(() => loadCustomDSPPresets());
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [presetSuccessMessage, setPresetSuccessMessage] = useState<string | null>(null);
  const vuCanvasRef = useRef<HTMLCanvasElement>(null);

  const update = (partial: Partial<MasterEffects>) => {
    setActivePresetId(null);
    onChangeEffects({ ...effects, ...partial });
  };

  const handleApplyPreset = (preset: DSPPreset) => {
    setActivePresetId(preset.id);
    onBufferSync?.();
    onChangeEffects({
      ...effects,
      ...preset.effects,
    });
    setPresetSuccessMessage(`Loaded "${preset.name}"`);
    setTimeout(() => setPresetSuccessMessage(null), 2500);
  };

  const handleSaveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) return;
    const newPreset: DSPPreset = {
      id: `custom_${Date.now()}`,
      name: customPresetName.trim(),
      tagline: 'Custom User FX Configuration',
      category: 'custom',
      badgeColor: '#EC4899',
      effects: { ...effects },
    };
    const updated = saveCustomDSPPreset(newPreset);
    setCustomPresets(updated);
    setActivePresetId(newPreset.id);
    setCustomPresetName('');
    setIsSavingCustom(false);
    setPresetSuccessMessage(`Saved "${newPreset.name}" to presets`);
    setTimeout(() => setPresetSuccessMessage(null), 2500);
  };

  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomDSPPreset(id);
    setCustomPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
  };

  // Real-time Spectrum Analyzer & VU
  useEffect(() => {
    let animId: number;
    const canvas = vuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 128);

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(0, dataArray[i] * 0.88);
        }
      }

      const numBars = 32;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        const val = dataArray[i * 2] || 0;
        const percent = val / 255;
        const barHeight = percent * height;
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#06B6D4');
        grad.addColorStop(0.7, '#FACC15');
        grad.addColorStop(1, '#EF4444');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.1);
      ctx.lineTo(width, height * 0.1);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [analyserNode, isPlaying]);

  const handleSeparateStems = async () => {
    if (!activeTrack?.audioBuffer) return;
    try {
      setIsSeparatingStems(true);
      setStemSuccess(false);
      onBufferSync?.();
      const stems = await separateAudioStems(activeTrack.audioBuffer);
      onAddSeparatedStems(stems);
      setStemSuccess(true);
      setTimeout(() => setStemSuccess(false), 4000);
    } catch (err) {
      console.error('Stem separation error:', err);
    } finally {
      setIsSeparatingStems(false);
    }
  };

  const handleToggleEnhance = () => {
    const nextState = !effects.enhanceEnabled;
    onBufferSync?.();
    update({
      enhanceEnabled: nextState,
      exciterAmount: nextState ? 0.75 : 0,
      warmthAmount: nextState ? 0.45 : 0,
      compThreshold: nextState ? -18 : effects.compThreshold,
      compRatio: nextState ? 4 : effects.compRatio,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 bg-slate-50 dark:bg-[#0a0a0f] overflow-y-auto space-y-4 select-none transition-colors">
      {/* Top VU Spectrum & Master Output Gain Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
            <Activity className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" />
            Master Stereo Spectrum & VU
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">Master:</span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-yellow-400 tabular-nums">
              {Math.round(effects.masterVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Realtime Canvas */}
        <div className="bg-slate-900 dark:bg-[#07070b] border border-slate-800 dark:border-neutral-800/80 rounded-lg p-2 h-20 flex items-center justify-center">
          <canvas
            ref={vuCanvasRef}
            width={480}
            height={80}
            className="w-full h-full block"
          />
        </div>

        {/* Master Gain Slider */}
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={effects.masterVolume}
          onChange={(e) => update({ masterVolume: Number(e.target.value) })}
          className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* DSP Presets System (Vocal Clarity, Bass Booster, Lo-Fi Texture, Custom) */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 font-mono">
              DSP & Master FX Presets
            </span>
          </div>

          <button
            onClick={() => setIsSavingCustom(!isSavingCustom)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700/80 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
            title="Save current rack settings as a reusable preset"
          >
            <Plus className="w-3 h-3 text-amber-500" />
            <span>Save Custom</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {presetSuccessMessage && (
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/50 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in duration-150">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{presetSuccessMessage}</span>
          </div>
        )}

        {/* Inline Save Preset Form */}
        {isSavingCustom && (
          <form onSubmit={handleSaveCustomPreset} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
              Save Current FX Chain as Preset:
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                placeholder="e.g. My Heavy 808 Crunch"
                autoFocus
                className="flex-1 bg-white dark:bg-[#14141e] border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-amber-400 dark:bg-yellow-400 text-black text-xs font-bold rounded cursor-pointer hover:bg-amber-300 transition-colors shrink-0"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSavingCustom(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Built-in Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {BUILTIN_DSP_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                title={preset.tagline}
                className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[46px] group active:scale-[0.98] ${
                  isActive
                    ? 'bg-amber-400/15 dark:bg-yellow-400/15 border-amber-500 dark:border-yellow-400 text-slate-900 dark:text-neutral-100 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0e0e16] border-slate-200 dark:border-neutral-800/80 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold truncate leading-tight group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors">
                    {preset.name}
                  </span>
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0 ml-1"
                    style={{ backgroundColor: preset.badgeColor || '#FACC15' }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 dark:text-neutral-500 truncate block font-mono mt-0.5">
                  {preset.category.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* User Custom Presets if any */}
        {customPresets.length > 0 && (
          <div className="pt-1.5 border-t border-slate-100 dark:border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500 block mb-1">
              Custom Presets ({customPresets.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {customPresets.map((cp) => {
                const isActive = activePresetId === cp.id;
                return (
                  <div
                    key={cp.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-800 dark:text-cyan-300 font-bold'
                        : 'bg-slate-50 dark:bg-[#0e0e16] border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <button
                      onClick={() => handleApplyPreset(cp)}
                      className="cursor-pointer truncate max-w-[120px]"
                      title="Load this custom preset"
                    >
                      {cp.name}
                    </button>
                    <button
                      onClick={(e) => handleDeleteCustomPreset(cp.id, e)}
                      title="Delete preset"
                      className="p-0.5 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Preset Tagline Readout */}
        {activePresetId && (
          <div className="p-2 rounded bg-slate-50 dark:bg-[#08080c] border border-slate-200/80 dark:border-neutral-800/60 text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
            Active: <span className="text-amber-600 dark:text-yellow-400 font-bold">{
              BUILTIN_DSP_PRESETS.find(p => p.id === activePresetId)?.tagline || 
              customPresets.find(p => p.id === activePresetId)?.tagline || 
              'Custom adjustments applied'
            }</span>
          </div>
        )}
      </div>

      {/* Rack Filter Tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveRackTab('all')}
          className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
            activeRackTab === 'all'
              ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
          }`}
        >
          All Unified
        </button>
        <button
          onClick={() => setActiveRackTab('dsp')}
          className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
            activeRackTab === 'dsp'
              ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
          }`}
        >
          DSP Effects
        </button>
        <button
          onClick={() => setActiveRackTab('eq_dynamics')}
          className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
            activeRackTab === 'eq_dynamics'
              ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
          }`}
        >
          EQ & Limiter
        </button>
        <button
          onClick={() => setActiveRackTab('stems')}
          className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
            activeRackTab === 'stems'
              ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
          }`}
        >
          Stems
        </button>
      </div>

      {/* Section 1: One-Click Stem Isolator & Quality Enhancer */}
      {(activeRackTab === 'all' || activeRackTab === 'stems') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stem Isolator */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-cyan-800/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Separate Cords (Stems)
                </span>
                <span className="text-[9px] font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">
                  4 Stems
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-2.5">
                Isolate active track into Vocals, Bass, Drums, and Instruments.
              </p>
            </div>

            <button
              onClick={handleSeparateStems}
              disabled={!activeTrack?.audioBuffer || isSeparatingStems}
              className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !activeTrack?.audioBuffer
                  ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 cursor-not-allowed'
                  : isSeparatingStems
                  ? 'bg-cyan-600 text-white animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-xs active:scale-[0.98]'
              }`}
            >
              {isSeparatingStems ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Separating...</span>
                </>
              ) : stemSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  <span>4 Stems Created!</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Separate into 4 Stems</span>
                </>
              )}
            </button>
          </div>

          {/* Quality Enhancer */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-yellow-700/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-700 dark:text-yellow-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Quality Enhancer
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  effects.enhanceEnabled ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                }`}>
                  {effects.enhanceEnabled ? 'ACTIVE' : 'BYPASS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-2.5">
                Harmonic exciter + tube saturation for punchy clarity.
              </p>
            </div>

            <button
              onClick={handleToggleEnhance}
              className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                effects.enhanceEnabled
                  ? 'bg-amber-400 dark:bg-yellow-400 text-black shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-amber-700 dark:text-yellow-400 border border-slate-300 dark:border-neutral-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{effects.enhanceEnabled ? 'Bypass Enhancer' : 'Engage Enhancer'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Section 2: 3-Band Parametric EQ, Compressor & Limiter */}
      {(activeRackTab === 'all' || activeRackTab === 'eq_dynamics') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 3-Band EQ */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
              <BarChart2 className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" />
              3-Band Parametric EQ
            </span>

            <div className="space-y-2 text-[11px] font-mono">
              <div>
                <div className="flex justify-between text-slate-500 dark:text-neutral-400 mb-0.5">
                  <span>Low (120 Hz)</span>
                  <span className="text-amber-600 dark:text-yellow-400">{effects.eqLowGain > 0 ? `+${effects.eqLowGain}` : effects.eqLowGain} dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={effects.eqLowGain}
                  onChange={(e) => update({ eqLowGain: Number(e.target.value) })}
                  className="w-full accent-amber-500 dark:accent-yellow-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-500 dark:text-neutral-400 mb-0.5">
                  <span>Mid (1.2 kHz)</span>
                  <span className="text-amber-600 dark:text-yellow-400">{effects.eqMidGain > 0 ? `+${effects.eqMidGain}` : effects.eqMidGain} dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={effects.eqMidGain}
                  onChange={(e) => update({ eqMidGain: Number(e.target.value) })}
                  className="w-full accent-amber-500 dark:accent-yellow-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-500 dark:text-neutral-400 mb-0.5">
                  <span>High (8 kHz)</span>
                  <span className="text-amber-600 dark:text-yellow-400">{effects.eqHighGain > 0 ? `+${effects.eqHighGain}` : effects.eqHighGain} dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={effects.eqHighGain}
                  onChange={(e) => update({ eqHighGain: Number(e.target.value) })}
                  className="w-full accent-amber-500 dark:accent-yellow-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Compressor & Limiter */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Compressor & Brickwall
              </span>
              <button
                onClick={() => update({ compressorEnabled: !effects.compressorEnabled })}
                className={`text-[9px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                  effects.compressorEnabled ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold border border-cyan-500/40' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500'
                }`}
              >
                {effects.compressorEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div>
                <div className="flex justify-between text-slate-500 dark:text-neutral-400 mb-0.5">
                  <span>Threshold</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{effects.compThreshold} dB</span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={0}
                  step={1}
                  value={effects.compThreshold}
                  onChange={(e) => update({ compThreshold: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-500 dark:text-neutral-400 mb-0.5">
                  <span>Ratio</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{effects.compRatio}:1</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={effects.compRatio}
                  onChange={(e) => update({ compRatio: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-500 dark:text-neutral-400 mb-0.5">
                  <span>Limiter Ceiling</span>
                  <span className="text-red-500 font-bold">{effects.limiterCeiling} dBTP</span>
                </div>
                <input
                  type="range"
                  min={-3}
                  max={0}
                  step={0.1}
                  value={effects.limiterCeiling}
                  onChange={(e) => update({ limiterCeiling: Number(e.target.value) })}
                  className="w-full accent-red-500 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Clean Noise Gate, Reverb & Delay */}
      {(activeRackTab === 'all' || activeRackTab === 'dsp') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Clean Noise Gate */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1 font-mono">
                <Wind className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Noise Gate
              </span>
              <button
                onClick={() => update({ noiseGate: !effects.noiseGate })}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                  effects.noiseGate ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500'
                }`}
              >
                {effects.noiseGate ? 'ON' : 'OFF'}
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400 mb-0.5">
                <span>HP Cut</span>
                <span>{effects.highPassFreq} Hz</span>
              </div>
              <input
                type="range"
                min={20}
                max={400}
                step={5}
                value={effects.highPassFreq}
                onChange={(e) => update({ highPassFreq: Number(e.target.value) })}
                className="w-full accent-cyan-500 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Reverb */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1 font-mono">
                <Waves className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" />
                Reverb
              </span>
              <button
                onClick={() => update({ reverbEnabled: !effects.reverbEnabled })}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                  effects.reverbEnabled ? 'bg-amber-400/20 text-amber-700 dark:text-yellow-400 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500'
                }`}
              >
                {effects.reverbEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400 mb-0.5">
                <span>Wet Mix</span>
                <span>{Math.round(effects.reverbMix * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effects.reverbMix}
                onChange={(e) => update({ reverbMix: Number(e.target.value) })}
                className="w-full accent-amber-500 dark:accent-yellow-400 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Delay */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1 font-mono">
                <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Echo Delay
              </span>
              <button
                onClick={() => update({ delayEnabled: !effects.delayEnabled })}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                  effects.delayEnabled ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500'
                }`}
              >
                {effects.delayEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400 mb-0.5">
                <span>Feedback</span>
                <span>{Math.round(effects.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.85}
                step={0.01}
                value={effects.delayFeedback}
                onChange={(e) => update({ delayFeedback: Number(e.target.value) })}
                className="w-full accent-cyan-500 h-1 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
