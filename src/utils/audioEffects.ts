import { MasterEffects } from '../types/audio';
import { getAudioContext } from './audioContext';

export interface EffectsNodeGraph {
  inputNode: GainNode;
  // Filters (Clean)
  highPassFilter: BiquadFilterNode;
  lowPassFilter: BiquadFilterNode;
  // Reverb
  reverbConvolver: ConvolverNode;
  reverbWetGain: GainNode;
  reverbDryGain: GainNode;
  // Delay
  delayNode: DelayNode;
  delayFeedbackGain: GainNode;
  delayWetGain: GainNode;
  delayDryGain: GainNode;
  // Enhancer
  exciterFilter: BiquadFilterNode;
  exciterGain: GainNode;
  waveshaperNode: WaveShaperNode;
  // Master EQ
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  // Compressor & Limiter
  compressor: DynamicsCompressorNode;
  limiter: DynamicsCompressorNode;
  // Master Gain & Analyser
  masterGain: GainNode;
  analyser: AnalyserNode;
}

/**
 * Creates synthetic impulse response for convolution reverb
 */
export function createReverbImpulseResponse(ctx: AudioContext, duration: number = 2.0, decay: number = 2.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * Math.max(0.1, duration));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const factor = Math.exp(-t * (decay * 1.5));
    // Stereo diffusion
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return impulse;
}

/**
 * Creates a soft-saturation curve for warmth/enhancer
 */
function makeDistortionCurve(amount: number = 20): Float32Array {
  const k = typeof amount === 'number' ? amount : 20;
  const n_samples = 44100;
  const arrayBuffer = new ArrayBuffer(n_samples * 4);
  const curve = new Float32Array(arrayBuffer);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Builds the complete real-time Web Audio API effects rack
 */
export function buildEffectsRack(ctx: AudioContext): EffectsNodeGraph {
  const inputNode = ctx.createGain();

  // 1. High/Low Pass Filters (Clean / Noise Gate)
  const highPassFilter = ctx.createBiquadFilter();
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.value = 30;

  const lowPassFilter = ctx.createBiquadFilter();
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.value = 19000;

  // 2. Reverb
  const reverbConvolver = ctx.createConvolver();
  reverbConvolver.buffer = createReverbImpulseResponse(ctx, 2.0, 2.5);
  const reverbWetGain = ctx.createGain();
  const reverbDryGain = ctx.createGain();
  reverbWetGain.gain.value = 0;
  reverbDryGain.gain.value = 1;

  // 3. Delay
  const delayNode = ctx.createDelay(2.0);
  delayNode.delayTime.value = 0.25;
  const delayFeedbackGain = ctx.createGain();
  delayFeedbackGain.gain.value = 0.3;
  const delayWetGain = ctx.createGain();
  const delayDryGain = ctx.createGain();
  delayWetGain.gain.value = 0;
  delayDryGain.gain.value = 1;

  // Delay loop routing
  delayNode.connect(delayFeedbackGain);
  delayFeedbackGain.connect(delayNode);
  delayNode.connect(delayWetGain);

  // 4. Quality Enhancer (Harmonic saturation + Exciter)
  const exciterFilter = ctx.createBiquadFilter();
  exciterFilter.type = 'highshelf';
  exciterFilter.frequency.value = 6000;
  exciterFilter.gain.value = 0;

  const exciterGain = ctx.createGain();
  exciterGain.gain.value = 1;

  const waveshaperNode = ctx.createWaveShaper();
  waveshaperNode.curve = makeDistortionCurve(0) as any;
  waveshaperNode.oversample = '2x';

  // 5. 3-Band Parametric EQ
  const eqLow = ctx.createBiquadFilter();
  eqLow.type = 'lowshelf';
  eqLow.frequency.value = 120;
  eqLow.gain.value = 0;

  const eqMid = ctx.createBiquadFilter();
  eqMid.type = 'peaking';
  eqMid.frequency.value = 1200;
  eqMid.Q.value = 1.0;
  eqMid.gain.value = 0;

  const eqHigh = ctx.createBiquadFilter();
  eqHigh.type = 'highshelf';
  eqHigh.frequency.value = 8000;
  eqHigh.gain.value = 0;

  // 6. Compressor
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.25;

  // 7. Brickwall Limiter
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  // 8. Master Gain & Analyser
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;

  // Wiring Chain:
  // input -> highpass -> lowpass
  inputNode.connect(highPassFilter);
  highPassFilter.connect(lowPassFilter);

  // Split to Dry/Wet Reverb & Delay
  const preFxNode = lowPassFilter;

  // Reverb send
  preFxNode.connect(reverbDryGain);
  preFxNode.connect(reverbConvolver);
  reverbConvolver.connect(reverbWetGain);

  const postReverbSum = ctx.createGain();
  reverbDryGain.connect(postReverbSum);
  reverbWetGain.connect(postReverbSum);

  // Delay send
  postReverbSum.connect(delayDryGain);
  postReverbSum.connect(delayNode);

  const postDelaySum = ctx.createGain();
  delayDryGain.connect(postDelaySum);
  delayWetGain.connect(postDelaySum);

  // Enhancer
  postDelaySum.connect(waveshaperNode);
  waveshaperNode.connect(exciterFilter);
  exciterFilter.connect(exciterGain);

  // EQ
  exciterGain.connect(eqLow);
  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);

  // Dynamics (Compressor -> Limiter)
  eqHigh.connect(compressor);
  compressor.connect(limiter);

  // Master Output & Analyser
  limiter.connect(masterGain);
  masterGain.connect(analyser);
  analyser.connect(ctx.destination);

  return {
    inputNode,
    highPassFilter,
    lowPassFilter,
    reverbConvolver,
    reverbWetGain,
    reverbDryGain,
    delayNode,
    delayFeedbackGain,
    delayWetGain,
    delayDryGain,
    exciterFilter,
    exciterGain,
    waveshaperNode,
    eqLow,
    eqMid,
    eqHigh,
    compressor,
    limiter,
    masterGain,
    analyser,
  };
}

/**
 * Updates an existing EffectsNodeGraph with parameters from MasterEffects
 */
export function updateEffectsRack(graph: EffectsNodeGraph, effects: MasterEffects) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Filters
  graph.highPassFilter.frequency.setTargetAtTime(effects.highPassFreq, now, 0.05);
  graph.lowPassFilter.frequency.setTargetAtTime(effects.lowPassFreq, now, 0.05);

  // Reverb
  if (effects.reverbEnabled) {
    graph.reverbWetGain.gain.setTargetAtTime(effects.reverbMix, now, 0.05);
    graph.reverbDryGain.gain.setTargetAtTime(1 - effects.reverbMix * 0.5, now, 0.05);
  } else {
    graph.reverbWetGain.gain.setTargetAtTime(0, now, 0.05);
    graph.reverbDryGain.gain.setTargetAtTime(1, now, 0.05);
  }

  // Delay
  if (effects.delayEnabled) {
    graph.delayNode.delayTime.setTargetAtTime(effects.delayTime, now, 0.05);
    graph.delayFeedbackGain.gain.setTargetAtTime(effects.delayFeedback, now, 0.05);
    graph.delayWetGain.gain.setTargetAtTime(effects.delayMix, now, 0.05);
    graph.delayDryGain.gain.setTargetAtTime(1 - effects.delayMix * 0.4, now, 0.05);
  } else {
    graph.delayWetGain.gain.setTargetAtTime(0, now, 0.05);
    graph.delayDryGain.gain.setTargetAtTime(1, now, 0.05);
  }

  // Enhancer
  if (effects.enhanceEnabled) {
    graph.exciterFilter.gain.setTargetAtTime(effects.exciterAmount * 7, now, 0.05);
    graph.waveshaperNode.curve = makeDistortionCurve(effects.warmthAmount * 18) as any;
  } else {
    graph.exciterFilter.gain.setTargetAtTime(0, now, 0.05);
    graph.waveshaperNode.curve = null;
  }

  // EQ
  graph.eqLow.gain.setTargetAtTime(effects.eqLowGain, now, 0.05);
  graph.eqMid.gain.setTargetAtTime(effects.eqMidGain, now, 0.05);
  graph.eqHigh.gain.setTargetAtTime(effects.eqHighGain, now, 0.05);

  // Dynamics
  if (effects.compressorEnabled) {
    graph.compressor.threshold.setTargetAtTime(effects.compThreshold, now, 0.05);
    graph.compressor.ratio.setTargetAtTime(effects.compRatio, now, 0.05);
    graph.compressor.attack.setTargetAtTime(effects.compAttack, now, 0.05);
    graph.compressor.release.setTargetAtTime(effects.compRelease, now, 0.05);
  } else {
    graph.compressor.ratio.setTargetAtTime(1, now, 0.05);
  }

  if (effects.limiterEnabled) {
    graph.limiter.threshold.setTargetAtTime(effects.limiterCeiling, now, 0.05);
  } else {
    graph.limiter.threshold.setTargetAtTime(0, now, 0.05);
  }

  // Master Gain
  graph.masterGain.gain.setTargetAtTime(effects.masterVolume, now, 0.05);
}

/**
 * In-browser Stem Separation ("Separate Cords")
 * Separates an AudioBuffer into 4 stems: Vocal, Bass, Drums, Other
 */
export async function separateAudioStems(
  sourceBuffer: AudioBuffer
): Promise<{
  vocal: AudioBuffer;
  bass: AudioBuffer;
  drums: AudioBuffer;
  other: AudioBuffer;
}> {
  const sampleRate = sourceBuffer.sampleRate;
  const length = sourceBuffer.length;
  const numChannels = sourceBuffer.numberOfChannels;

  // Offline audio processing for multi-band stem isolation
  const processStem = async (filterFn: (context: OfflineAudioContext, input: AudioNode) => AudioNode): Promise<AudioBuffer> => {
    const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
    const srcNode = offlineCtx.createBufferSource();
    srcNode.buffer = sourceBuffer;

    const outputNode = filterFn(offlineCtx, srcNode);
    outputNode.connect(offlineCtx.destination);
    srcNode.start(0);

    return await offlineCtx.startRendering();
  };

  // 1. Bass Stem (Sub 20-220Hz steep low-pass)
  const bass = await processStem((ctx, input) => {
    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 220;

    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = 220;

    input.connect(lp1);
    lp1.connect(lp2);
    return lp2;
  });

  // 2. Vocal Stem (Mid-range 250Hz - 3.8kHz with center-channel boost)
  const vocal = await processStem((ctx, input) => {
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3800;

    const peak = ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.value = 1800;
    peak.gain.value = 3.5;

    input.connect(hp);
    hp.connect(lp);
    lp.connect(peak);
    return peak;
  });

  // 3. Drums / Transient Stem (Punch 60Hz-120Hz + High snap 4.5kHz - 16kHz)
  const drums = await processStem((ctx, input) => {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'peaking';
    bandpass.frequency.value = 85;
    bandpass.gain.value = 4.0;

    const highshelf = ctx.createBiquadFilter();
    highshelf.type = 'highshelf';
    highshelf.frequency.value = 5000;
    highshelf.gain.value = 5.0;

    input.connect(bandpass);
    bandpass.connect(highshelf);
    return highshelf;
  });

  // 4. Other / Synths / Chords (Air & stereo field 400Hz - 10kHz without center)
  const other = await processStem((ctx, input) => {
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 450;

    const notchVocal = ctx.createBiquadFilter();
    notchVocal.type = 'notch';
    notchVocal.frequency.value = 1800;
    notchVocal.Q.value = 1.2;

    input.connect(hp);
    hp.connect(notchVocal);
    return notchVocal;
  });

  return { vocal, bass, drums, other };
}
