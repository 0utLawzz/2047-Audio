import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Sliders, 
  Wind, 
  Zap, 
  Waves,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { MasterEffects, AudioTrack } from '../types/audio';
import { separateAudioStems } from '../utils/audioEffects';

interface EffectsRackProps {
  effects: MasterEffects;
  onChangeEffects: (newEffects: MasterEffects) => void;
  activeTrack: AudioTrack | null;
  onAddSeparatedStems: (stems: { vocal: AudioBuffer; bass: AudioBuffer; drums: AudioBuffer; other: AudioBuffer }) => void;
}

export const EffectsRack: React.FC<EffectsRackProps> = ({
  effects,
  onChangeEffects,
  activeTrack,
  onAddSeparatedStems,
}) => {
  const [isSeparatingStems, setIsSeparatingStems] = useState(false);
  const [stemSuccess, setStemSuccess] = useState(false);

  const update = (partial: Partial<MasterEffects>) => {
    onChangeEffects({ ...effects, ...partial });
  };

  const handleSeparateStems = async () => {
    if (!activeTrack?.audioBuffer) return;
    try {
      setIsSeparatingStems(true);
      setStemSuccess(false);
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
    update({
      enhanceEnabled: nextState,
      exciterAmount: nextState ? 0.75 : 0,
      warmthAmount: nextState ? 0.45 : 0,
      compThreshold: nextState ? -18 : effects.compThreshold,
      compRatio: nextState ? 4 : effects.compRatio,
    });
  };

  return (
    <div className="flex-1 p-3.5 sm:p-6 bg-slate-100 dark:bg-[#0a0a0f] overflow-y-auto space-y-4 sm:space-y-6 transition-colors">
      {/* Top Banner: One-Click Smart Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Stem Isolator */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gradient-to-br dark:from-cyan-950/30 dark:to-neutral-900 border border-slate-200 dark:border-cyan-800/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Stem Isolator (Separate Cords)
              </span>
              <span className="text-[9px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-0.5 rounded">
                Vocal · Bass · Drums · Other
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 mb-3">
              Separates the active track into 4 distinct playable multi-tracks with acoustic filtering and phase separation.
            </p>
          </div>

          <button
            onClick={handleSeparateStems}
            disabled={!activeTrack?.audioBuffer || isSeparatingStems}
            className={`w-full min-h-[44px] py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !activeTrack?.audioBuffer
                ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 cursor-not-allowed'
                : isSeparatingStems
                ? 'bg-cyan-600 text-white animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20 active:scale-[0.98]'
            }`}
          >
            {isSeparatingStems ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Separating 4 Stems...</span>
              </>
            ) : stemSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>4 Stems Created in Track List!</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Separate Track into 4 Stems</span>
              </>
            )}
          </button>
        </div>

        {/* Quality Enhancer */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gradient-to-br dark:from-yellow-950/30 dark:to-neutral-900 border border-slate-200 dark:border-yellow-700/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-yellow-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Studio Quality Enhancer
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                effects.enhanceEnabled ? 'bg-amber-400 dark:bg-yellow-400 text-black font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
              }`}>
                {effects.enhanceEnabled ? 'ACTIVE' : 'BYPASSED'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 mb-3">
              Applies studio loudness maximization, harmonic exciter, and analog tube warmth for commercial clarity.
            </p>
          </div>

          <button
            onClick={handleToggleEnhance}
            className={`w-full min-h-[44px] py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              effects.enhanceEnabled
                ? 'bg-amber-400 dark:bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                : 'bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-amber-600 dark:text-yellow-400 border border-slate-300 dark:border-neutral-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{effects.enhanceEnabled ? 'Bypass Quality Enhancer' : 'Engage Studio Quality Enhancer'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Audio DSP Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. Clean / Noise Gate */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Clean / Noise Gate
              </span>
              <button
                onClick={() => update({ noiseGate: !effects.noiseGate })}
                className={`min-h-[30px] px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  effects.noiseGate ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500'
                }`}
              >
                {effects.noiseGate ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>High-Pass Cut</span>
                  <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{effects.highPassFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={400}
                  step={5}
                  value={effects.highPassFreq}
                  onChange={(e) => update({ highPassFreq: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>Low-Pass Cut</span>
                  <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{Math.round(effects.lowPassFreq / 1000)} kHz</span>
                </div>
                <input
                  type="range"
                  min={6000}
                  max={20000}
                  step={200}
                  value={effects.lowPassFreq}
                  onChange={(e) => update({ lowPassFreq: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>Gate Threshold</span>
                  <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{effects.noiseGateThreshold} dB</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={-10}
                  step={1}
                  value={effects.noiseGateThreshold}
                  onChange={(e) => update({ noiseGateThreshold: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Reverb */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
                Convolution Reverb
              </span>
              <button
                onClick={() => update({ reverbEnabled: !effects.reverbEnabled })}
                className={`min-h-[30px] px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  effects.reverbEnabled ? 'bg-amber-400/20 dark:bg-yellow-400/20 text-amber-700 dark:text-yellow-400 border border-amber-500/40 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500'
                }`}
              >
                {effects.reverbEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>Wet / Dry Mix</span>
                  <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{Math.round(effects.reverbMix * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={effects.reverbMix}
                  onChange={(e) => update({ reverbMix: Number(e.target.value) })}
                  className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>Room Decay</span>
                  <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{effects.reverbDecay.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6.0}
                  step={0.1}
                  value={effects.reverbDecay}
                  onChange={(e) => update({ reverbDecay: Number(e.target.value) })}
                  className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Echo & Delay */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Echo & Delay
              </span>
              <button
                onClick={() => update({ delayEnabled: !effects.delayEnabled })}
                className={`min-h-[30px] px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  effects.delayEnabled ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500'
                }`}
              >
                {effects.delayEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>Delay Time</span>
                  <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(effects.delayTime * 1000)} ms</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.8}
                  step={0.01}
                  value={effects.delayTime}
                  onChange={(e) => update({ delayTime: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                  <span>Feedback</span>
                  <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(effects.delayFeedback * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.01}
                  value={effects.delayFeedback}
                  onChange={(e) => update({ delayFeedback: Number(e.target.value) })}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
