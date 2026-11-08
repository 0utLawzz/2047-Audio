import React, { useRef, useEffect } from 'react';
import { Volume2, Sliders, Shield, Activity, BarChart2 } from 'lucide-react';
import { MasterEffects } from '../types/audio';

interface MasterPanelProps {
  effects: MasterEffects;
  onChangeEffects: (newEffects: MasterEffects) => void;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

export const MasterPanel: React.FC<MasterPanelProps> = ({
  effects,
  onChangeEffects,
  analyserNode,
  isPlaying,
}) => {
  const vuCanvasRef = useRef<HTMLCanvasElement>(null);

  const update = (partial: Partial<MasterEffects>) => {
    onChangeEffects({ ...effects, ...partial });
  };

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
          dataArray[i] = Math.max(0, dataArray[i] * 0.9);
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

  return (
    <div className="flex-1 p-3.5 sm:p-6 bg-slate-100 dark:bg-[#0a0a0f] overflow-y-auto space-y-4 sm:space-y-6 transition-colors">
      {/* Top VU Meter & Master Fader Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm">
        {/* Spectrum Analyzer */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
              <Activity className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
              Master Stereo VU & Spectrum Monitor
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 tabular-nums">
              0 dB True Peak
            </span>
          </div>
          <div className="bg-slate-900 dark:bg-[#07070b] border border-slate-800 dark:border-neutral-800/80 rounded-lg p-2 h-24 sm:h-28 flex items-center justify-center">
            <canvas
              ref={vuCanvasRef}
              width={540}
              height={100}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Master Output Gain Slider */}
        <div className="flex flex-col justify-between p-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
              <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Master Fader
            </span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-yellow-400 tabular-nums">
              {Math.round(effects.masterVolume * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-2">
            Controls master bus gain before output limiter.
          </p>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={effects.masterVolume}
            onChange={(e) => update({ masterVolume: Number(e.target.value) })}
            className="w-full accent-amber-500 dark:accent-yellow-400 h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Parametric EQ, Master Dynamics, and Limiter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. 3-Band Parametric EQ */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm">
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 mb-3 font-mono">
            <BarChart2 className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
            3-Band Master EQ
          </span>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                <span>Low Bass (120 Hz)</span>
                <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{effects.eqLowGain > 0 ? `+${effects.eqLowGain}` : effects.eqLowGain} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={effects.eqLowGain}
                onChange={(e) => update({ eqLowGain: Number(e.target.value) })}
                className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                <span>Mid Range (1.2 kHz)</span>
                <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{effects.eqMidGain > 0 ? `+${effects.eqMidGain}` : effects.eqMidGain} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={effects.eqMidGain}
                onChange={(e) => update({ eqMidGain: Number(e.target.value) })}
                className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                <span>High Air (8.0 kHz)</span>
                <span className="text-amber-600 dark:text-yellow-400 tabular-nums">{effects.eqHighGain > 0 ? `+${effects.eqHighGain}` : effects.eqHighGain} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={effects.eqHighGain}
                onChange={(e) => update({ eqHighGain: Number(e.target.value) })}
                className="w-full accent-amber-500 dark:accent-yellow-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. Master Compressor */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Master Compressor
            </span>
            <button
              onClick={() => update({ compressorEnabled: !effects.compressorEnabled })}
              className={`min-h-[28px] px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                effects.compressorEnabled ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500'
              }`}
            >
              {effects.compressorEnabled ? 'ACTIVE' : 'BYPASS'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                <span>Threshold</span>
                <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{effects.compThreshold} dB</span>
              </div>
              <input
                type="range"
                min={-40}
                max={0}
                step={1}
                value={effects.compThreshold}
                onChange={(e) => update({ compThreshold: Number(e.target.value) })}
                className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                <span>Ratio</span>
                <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{effects.compRatio}:1</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={0.5}
                value={effects.compRatio}
                onChange={(e) => update({ compRatio: Number(e.target.value) })}
                className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
                <span>Attack / Release</span>
                <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(effects.compAttack * 1000)}ms / {Math.round(effects.compRelease * 1000)}ms</span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.1}
                step={0.005}
                value={effects.compAttack}
                onChange={(e) => update({ compAttack: Number(e.target.value) })}
                className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Brickwall Limiter */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
              <Shield className="w-4 h-4 text-red-500" />
              Brickwall Limiter
            </span>
            <button
              onClick={() => update({ limiterEnabled: !effects.limiterEnabled })}
              className={`min-h-[28px] px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                effects.limiterEnabled ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 font-bold' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500'
              }`}
            >
              {effects.limiterEnabled ? 'ENGAGED' : 'OFF'}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-4">
            Zero-latency true peak limiting preventing clipping on digital export.
          </p>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1">
              <span>True Peak Ceiling</span>
              <span className="text-red-500 font-bold tabular-nums">{effects.limiterCeiling} dBTP</span>
            </div>
            <input
              type="range"
              min={-3}
              max={0}
              step={0.1}
              value={effects.limiterCeiling}
              onChange={(e) => update({ limiterCeiling: Number(e.target.value) })}
              className="w-full accent-red-500 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
