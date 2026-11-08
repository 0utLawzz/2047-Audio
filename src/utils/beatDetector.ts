/**
 * Advanced Audio Analysis: Silence Detection & BPM Estimation
 */

export interface DetectedSilence {
  start: number; // in seconds
  end: number;   // in seconds
  duration: number;
}

export interface DetectedSliceRegion {
  start: number;
  end: number;
}

/**
 * Detects silent regions in an AudioBuffer based on an RMS threshold
 * @param buffer AudioBuffer to analyze
 * @param thresholdDb Silence threshold in dB (e.g., -42dB)
 * @param minDurationSec Minimum silence length to qualify (e.g., 0.15s)
 */
export function detectSilence(
  buffer: AudioBuffer,
  thresholdDb: number = -40,
  minDurationSec: number = 0.15
): DetectedSilence[] {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const thresholdLinear = Math.pow(10, thresholdDb / 20);
  
  const windowSize = Math.floor(sampleRate * 0.02); // 20ms RMS windows
  const silences: DetectedSilence[] = [];
  
  let inSilence = false;
  let silenceStartSample = 0;

  for (let i = 0; i < channelData.length; i += windowSize) {
    let sumSquares = 0;
    const end = Math.min(i + windowSize, channelData.length);
    for (let j = i; j < end; j++) {
      sumSquares += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sumSquares / (end - i));

    if (rms < thresholdLinear) {
      if (!inSilence) {
        inSilence = true;
        silenceStartSample = i;
      }
    } else {
      if (inSilence) {
        inSilence = false;
        const durationSec = (i - silenceStartSample) / sampleRate;
        if (durationSec >= minDurationSec) {
          silences.push({
            start: silenceStartSample / sampleRate,
            end: i / sampleRate,
            duration: durationSec,
          });
        }
      }
    }
  }

  // Handle silence at end of buffer
  if (inSilence) {
    const durationSec = (channelData.length - silenceStartSample) / sampleRate;
    if (durationSec >= minDurationSec) {
      silences.push({
        start: silenceStartSample / sampleRate,
        end: channelData.length / sampleRate,
        duration: durationSec,
      });
    }
  }

  return silences;
}

/**
 * Splits audio at silence intervals into active audible slices
 */
export function getNonSilentRegions(
  buffer: AudioBuffer,
  thresholdDb: number = -40,
  minDurationSec: number = 0.15
): DetectedSliceRegion[] {
  const silences = detectSilence(buffer, thresholdDb, minDurationSec);
  const totalDuration = buffer.duration;
  
  if (silences.length === 0) {
    return [{ start: 0, end: totalDuration }];
  }

  const regions: DetectedSliceRegion[] = [];
  let currentPos = 0;

  for (const s of silences) {
    if (s.start > currentPos + 0.05) {
      regions.push({
        start: currentPos,
        end: s.start,
      });
    }
    currentPos = s.end;
  }

  if (currentPos < totalDuration - 0.05) {
    regions.push({
      start: currentPos,
      end: totalDuration,
    });
  }

  return regions;
}

/**
 * Detects transients / onsets for automatic slicing (transient trip detection)
 */
export function detectTransients(
  buffer: AudioBuffer,
  sensitivity: number = 1.35,
  maxSlices: number = 16
): number[] {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const frameSize = Math.floor(sampleRate * 0.015); // 15ms frame
  const numFrames = Math.floor(data.length / frameSize);
  
  const energies: number[] = new Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    let energy = 0;
    const start = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      energy += Math.abs(data[start + i]);
    }
    energies[f] = energy / frameSize;
  }

  // Detect sudden energy jumps (spectral flux approximation)
  const transientTimes: number[] = [];
  const minIntervalFrames = Math.floor(0.12 * sampleRate / frameSize); // min 120ms between transients
  let lastPeakFrame = -minIntervalFrames;

  for (let f = 2; f < numFrames - 2; f++) {
    const prevAvg = (energies[f - 1] + energies[f - 2]) / 2 + 0.0001;
    const diff = energies[f] / prevAvg;
    
    if (diff > sensitivity && energies[f] > 0.02 && (f - lastPeakFrame) >= minIntervalFrames) {
      transientTimes.push((f * frameSize) / sampleRate);
      lastPeakFrame = f;
      if (transientTimes.length >= maxSlices) break;
    }
  }

  return transientTimes;
}

/**
 * Estimate BPM using autocorrelation and peak intervals
 */
export function estimateBPM(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  
  // Downsample to ~4410 Hz to keep computation lightweight & fast
  const downsampleRate = 4410;
  const step = Math.floor(sampleRate / downsampleRate);
  const downsampledLength = Math.min(Math.floor(data.length / step), downsampleRate * 25); // Max 25s sample
  const downsampled = new Float32Array(downsampledLength);
  
  for (let i = 0; i < downsampledLength; i++) {
    downsampled[i] = data[i * step];
  }

  // Low-pass filter pass to isolate kick/bass beats
  const filtered = new Float32Array(downsampledLength);
  let prev = 0;
  for (let i = 0; i < downsampledLength; i++) {
    prev = prev + 0.15 * (downsampled[i] - prev);
    filtered[i] = Math.max(0, prev); // Rectify
  }

  // Calculate Autocorrelation between 60 BPM (lag = downsampleRate * 60 / 60) and 180 BPM
  const minBpm = 70;
  const maxBpm = 175;
  const minLag = Math.floor((60 / maxBpm) * downsampleRate);
  const maxLag = Math.floor((60 / minBpm) * downsampleRate);

  let bestLag = minLag;
  let maxCorr = -1;

  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let corr = 0;
    const checkLength = Math.min(downsampledLength - lag, 10000);
    for (let i = 0; i < checkLength; i += 4) {
      corr += filtered[i] * filtered[i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  let calculatedBpm = Math.round((60 * downsampleRate) / bestLag);
  
  // Normalize to standard range 80 - 160
  while (calculatedBpm < 80) calculatedBpm *= 2;
  while (calculatedBpm > 175) calculatedBpm = Math.round(calculatedBpm / 2);

  return calculatedBpm || 128;
}
