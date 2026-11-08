export interface AudioSlice {
  id: string;
  name: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;
  color: string;
  padIndex?: number; // 0-15 for 16-pad beat machine
  keyShortcut?: string; // e.g. '1', '2', 'Q', 'W'
}

export interface AudioMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  bpm: number;
  key: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  fileSize: number;
  fileType: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  audioBuffer: AudioBuffer | null;
  volume: number; // 0 to 1.5
  pan: number;    // -1 (left) to 1 (right)
  muted: boolean;
  solo: boolean;
  color: string;
  slices: AudioSlice[];
  metadata: AudioMetadata;
  isStem?: boolean;
  stemType?: 'vocal' | 'bass' | 'drums' | 'other' | 'master';
}

export interface MasterEffects {
  // Clean / Noise
  noiseGate: boolean;
  noiseGateThreshold: number; // dB (-60 to 0)
  highPassFreq: number;       // Hz (20 to 500)
  lowPassFreq: number;        // Hz (5000 to 20000)
  
  // Reverb
  reverbEnabled: boolean;
  reverbMix: number;          // 0 to 1
  reverbDecay: number;        // seconds (0.1 to 10)
  
  // Delay / Echo
  delayEnabled: boolean;
  delayTime: number;          // seconds (0.05 to 1.0)
  delayFeedback: number;      // 0 to 0.9
  delayMix: number;           // 0 to 1
  
  // Quality Enhancer
  enhanceEnabled: boolean;
  exciterAmount: number;      // 0 to 1
  warmthAmount: number;       // 0 to 1
  
  // Master EQ (3-band)
  eqLowGain: number;          // dB (-12 to +12)
  eqMidGain: number;          // dB (-12 to +12)
  eqHighGain: number;         // dB (-12 to +12)
  
  // Compressor
  compressorEnabled: boolean;
  compThreshold: number;      // dB (-40 to 0)
  compRatio: number;          // 1 to 20
  compAttack: number;         // seconds (0.001 to 0.2)
  compRelease: number;        // seconds (0.05 to 1.0)
  
  // Limiter
  limiterEnabled: boolean;
  limiterCeiling: number;     // dB (-6 to 0)
  
  // Master Gain
  masterVolume: number;       // 0 to 1.5
}

export interface HistoryAction {
  description: string;
  tracks: AudioTrack[];
}
