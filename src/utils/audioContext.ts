/**
 * Audio Context & Sound Synthesis Utilities for 2047 AUDIO
 */

let globalAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioContext) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    globalAudioContext = new AudioContextClass();
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume();
  }
  return globalAudioContext;
}

/**
 * Decodes an uploaded file into an AudioBuffer
 */
export async function decodeAudioFile(file: File): Promise<{ buffer: AudioBuffer; sampleRate: number; channels: number; duration: number }> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  // decodeAudioData consumes the arrayBuffer, so slice a copy
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  return {
    buffer: audioBuffer,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    duration: audioBuffer.duration,
  };
}

/**
 * Generates rich synthetic demonstration tracks in-browser
 * Types: 'cyberpunk_beat' (full groove), '808_bass', 'neon_synth', 'glitch_drums'
 */
export function generateSyntheticDemoTrack(type: 'cyberpunk_beat' | '808_bass' | 'neon_synth' | 'glitch_drums'): AudioBuffer {
  const ctx = getAudioContext();
  const bpm = 128;
  const sampleRate = ctx.sampleRate;
  const secondsPerBeat = 60 / bpm;
  const bars = 4; // 16 beats
  const totalDuration = bars * 4 * secondsPerBeat;
  const length = Math.floor(sampleRate * totalDuration);
  
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const totalBeats = bars * 4;

  if (type === 'cyberpunk_beat' || type === 'glitch_drums') {
    // Generate Kick, Snare, HiHats, Percussion
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat * secondsPerBeat;
      const beatSample = Math.floor(beatTime * sampleRate);

      // KICK on 0, 4, 8, 12 (four-on-the-floor) and syncopated kicks
      if (beat % 4 === 0 || (beat % 8 === 6 && type === 'cyberpunk_beat')) {
        const kickDuration = 0.28;
        const kickSamples = Math.floor(kickDuration * sampleRate);
        for (let i = 0; i < kickSamples && (beatSample + i) < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 22);
          const freq = 140 * Math.exp(-t * 28) + 45;
          const kickSample = Math.sin(2 * Math.PI * freq * t) * env * 0.9;
          left[beatSample + i] += kickSample;
          right[beatSample + i] += kickSample;
        }
      }

      // SNARE / CLAP on beats 1, 3, 5, 7, etc. (beats 2 & 4 in 4/4)
      if (beat % 4 === 2) {
        const snareDuration = 0.22;
        const snareSamples = Math.floor(snareDuration * sampleRate);
        for (let i = 0; i < snareSamples && (beatSample + i) < length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18);
          const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 25);
          const s = (noise * 0.7 + tone * 0.3) * 0.75;
          left[beatSample + i] += s;
          right[beatSample + i] += s;
        }
      }

      // HI-HATS (16th notes = 4 per beat)
      for (let sub = 0; sub < 4; sub++) {
        const subTime = beatTime + (sub * (secondsPerBeat / 4));
        const subSample = Math.floor(subTime * sampleRate);
        const hatDuration = sub % 2 === 0 ? 0.05 : 0.035;
        const hatSamples = Math.floor(hatDuration * sampleRate);
        const velocity = sub === 2 ? 0.35 : (sub === 0 ? 0.25 : 0.18);
        for (let i = 0; i < hatSamples && (subSample + i) < length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 70);
          left[subSample + i] += noise * velocity;
          right[subSample + i] += noise * velocity * 0.9;
        }
      }
    }
  }

  if (type === 'cyberpunk_beat' || type === '808_bass') {
    // 808 Sub Bassline with pitch slides
    const bassNotes = [36.7, 36.7, 43.65, 41.2]; // D1, D1, F1, E1
    for (let bar = 0; bar < bars; bar++) {
      const noteFreq = bassNotes[bar % bassNotes.length];
      for (let noteIdx = 0; noteIdx < 4; noteIdx++) {
        const startTime = (bar * 4 + noteIdx) * secondsPerBeat;
        const startSample = Math.floor(startTime * sampleRate);
        const noteDuration = secondsPerBeat * 0.85;
        const noteSamples = Math.floor(noteDuration * sampleRate);

        for (let i = 0; i < noteSamples && (startSample + i) < length; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t * 50) * Math.exp(-t * 2.8);
          // Rich saw/sine saturation
          const osc1 = Math.sin(2 * Math.PI * noteFreq * t);
          const osc2 = Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.3;
          let sample = (osc1 + osc2) * env * 0.8;
          // Soft drive distortion
          sample = Math.tanh(sample * 1.5) * 0.7;
          left[startSample + i] += sample;
          right[startSample + i] += sample;
        }
      }
    }
  }

  if (type === 'cyberpunk_beat' || type === 'neon_synth') {
    // Cyberpunk arpeggio / chords (Fm / Dm synth lead)
    const scale = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25]; // Minor pentatonic
    for (let beat = 0; beat < totalBeats; beat++) {
      for (let step = 0; step < 2; step++) {
        const noteTime = (beat + step * 0.5) * secondsPerBeat;
        const noteSample = Math.floor(noteTime * sampleRate);
        const noteFreq = scale[(beat * 2 + step) % scale.length];
        const noteDuration = (secondsPerBeat * 0.48);
        const noteSamples = Math.floor(noteDuration * sampleRate);

        for (let i = 0; i < noteSamples && (noteSample + i) < length; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t * 80) * Math.exp(-t * 5.0);
          // Dual saw wave with detune for stereo width
          const sawLeft = ((2 * (t * noteFreq % 1)) - 1) * 0.35;
          const sawRight = ((2 * (t * (noteFreq * 1.008) % 1)) - 1) * 0.35;
          left[noteSample + i] += sawLeft * env * 0.45;
          right[noteSample + i] += sawRight * env * 0.45;
        }
      }
    }
  }

  // Normalize softly
  let maxPeak = 0;
  for (let i = 0; i < length; i++) {
    maxPeak = Math.max(maxPeak, Math.abs(left[i]), Math.abs(right[i]));
  }
  if (maxPeak > 0.001) {
    const scaleFactor = 0.88 / maxPeak;
    for (let i = 0; i < length; i++) {
      left[i] *= scaleFactor;
      right[i] *= scaleFactor;
    }
  }

  return buffer;
}
