import { MasterEffects } from './audio';

export interface DSPPreset {
  id: string;
  name: string;
  tagline: string;
  category: 'vocal' | 'bass' | 'lofi' | 'master' | 'custom';
  badgeColor?: string;
  effects: Partial<MasterEffects>;
}

export const BUILTIN_DSP_PRESETS: DSPPreset[] = [
  {
    id: 'vocal-clarity',
    name: 'Vocal Clarity',
    tagline: 'De-mud high-pass, crisp presence boost & vocal comp',
    category: 'vocal',
    badgeColor: '#06B6D4',
    effects: {
      noiseGate: true,
      noiseGateThreshold: -38,
      highPassFreq: 110,
      lowPassFreq: 19500,
      eqLowGain: -2.5,
      eqMidGain: 2.0,
      eqHighGain: 3.5,
      compressorEnabled: true,
      compThreshold: -19,
      compRatio: 4.0,
      compAttack: 0.01,
      compRelease: 0.15,
      reverbEnabled: true,
      reverbMix: 0.16,
      reverbDecay: 1.6,
      delayEnabled: false,
      delayMix: 0,
      enhanceEnabled: true,
      exciterAmount: 0.75,
      warmthAmount: 0.3,
      limiterEnabled: true,
      limiterCeiling: -0.2,
      masterVolume: 1.0,
    },
  },
  {
    id: 'bass-booster',
    name: 'Bass Booster',
    tagline: 'Deep sub 120Hz punch, analog saturation & fat limiting',
    category: 'bass',
    badgeColor: '#FACC15',
    effects: {
      noiseGate: false,
      highPassFreq: 24,
      lowPassFreq: 18500,
      eqLowGain: 6.0,
      eqMidGain: -1.5,
      eqHighGain: 0.5,
      compressorEnabled: true,
      compThreshold: -14,
      compRatio: 4.5,
      compAttack: 0.03,
      compRelease: 0.35,
      reverbEnabled: false,
      delayEnabled: false,
      enhanceEnabled: true,
      exciterAmount: 0.25,
      warmthAmount: 0.85,
      limiterEnabled: true,
      limiterCeiling: -0.1,
      masterVolume: 1.05,
    },
  },
  {
    id: 'lofi-texture',
    name: 'Lo-Fi Texture',
    tagline: 'Tape warmth, filtered bandpass, flutter delay & vintage room',
    category: 'lofi',
    badgeColor: '#A855F7',
    effects: {
      noiseGate: false,
      highPassFreq: 260,
      lowPassFreq: 6800,
      eqLowGain: 2.5,
      eqMidGain: -3.0,
      eqHighGain: -5.0,
      compressorEnabled: true,
      compThreshold: -14,
      compRatio: 5.5,
      compAttack: 0.005,
      compRelease: 0.4,
      reverbEnabled: true,
      reverbMix: 0.34,
      reverbDecay: 3.2,
      delayEnabled: true,
      delayTime: 0.32,
      delayFeedback: 0.42,
      delayMix: 0.28,
      enhanceEnabled: true,
      exciterAmount: 0.15,
      warmthAmount: 0.9,
      limiterEnabled: true,
      limiterCeiling: -0.4,
      masterVolume: 0.95,
    },
  },
  {
    id: 'cyber-clean',
    name: 'Cyber Clean Master',
    tagline: 'Ultra-transparent studio bus compressor & exciter',
    category: 'master',
    badgeColor: '#22D3EE',
    effects: {
      noiseGate: false,
      highPassFreq: 30,
      lowPassFreq: 19500,
      eqLowGain: 1.0,
      eqMidGain: 0.5,
      eqHighGain: 1.5,
      compressorEnabled: true,
      compThreshold: -15,
      compRatio: 3.0,
      compAttack: 0.02,
      compRelease: 0.25,
      reverbEnabled: false,
      delayEnabled: false,
      enhanceEnabled: true,
      exciterAmount: 0.5,
      warmthAmount: 0.2,
      limiterEnabled: true,
      limiterCeiling: -0.1,
      masterVolume: 1.0,
    },
  },
  {
    id: 'studio-neutral',
    name: 'Studio Neutral',
    tagline: 'Flat frequency response and clean bypass',
    category: 'master',
    badgeColor: '#94A3B8',
    effects: {
      noiseGate: false,
      highPassFreq: 30,
      lowPassFreq: 19000,
      eqLowGain: 0,
      eqMidGain: 0,
      eqHighGain: 0,
      compressorEnabled: false,
      compThreshold: -16,
      compRatio: 3.0,
      compAttack: 0.015,
      compRelease: 0.2,
      reverbEnabled: false,
      reverbMix: 0.2,
      reverbDecay: 2.0,
      delayEnabled: false,
      delayTime: 0.25,
      delayFeedback: 0.3,
      delayMix: 0.25,
      enhanceEnabled: false,
      exciterAmount: 0,
      warmthAmount: 0,
      limiterEnabled: true,
      limiterCeiling: -0.2,
      masterVolume: 1.0,
    },
  },
];

const STORAGE_KEY = '2047_AUDIO_DSP_CUSTOM_PRESETS';

export const loadCustomDSPPresets = (): DSPPreset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load custom presets from localStorage:', err);
    return [];
  }
};

export const saveCustomDSPPreset = (preset: DSPPreset): DSPPreset[] => {
  try {
    const existing = loadCustomDSPPresets();
    const filtered = existing.filter((p) => p.id !== preset.id);
    const updated = [preset, ...filtered].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save custom preset to localStorage:', err);
    return [];
  }
};

export const deleteCustomDSPPreset = (presetId: string): DSPPreset[] => {
  try {
    const existing = loadCustomDSPPresets();
    const updated = existing.filter((p) => p.id !== presetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete custom preset from localStorage:', err);
    return [];
  }
};
