import { getAudioContext } from './audioContext';

let metronomeGain: GainNode | null = null;

function getMetronomeGain(): GainNode {
  const ctx = getAudioContext();
  if (!metronomeGain) {
    metronomeGain = ctx.createGain();
    metronomeGain.gain.value = 0.5;
    metronomeGain.connect(ctx.destination);
  }
  return metronomeGain;
}

export function playMetronomeClick(isDownbeat: boolean, volume: number = 0.6) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const output = getMetronomeGain();

    // Beat 1 = 900 Hz high woodblock; Beats 2,3,4 = 520 Hz lower click
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isDownbeat ? 920 : 540, now);

    // Fast exponential decay envelope for punchy click
    const peakGain = isDownbeat ? volume * 0.8 : volume * 0.45;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isDownbeat ? 0.04 : 0.025));

    osc.connect(gain);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (err) {
    // ignore click error
  }
}
