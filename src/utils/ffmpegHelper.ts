import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { audioBufferToWav } from './wavExporter';

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoading = false;
let isFFmpegLoaded = false;

/**
 * Initializes FFmpeg WASM if supported in current browser environment
 */
export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg | null> {
  if (isFFmpegLoaded && ffmpegInstance) {
    return ffmpegInstance;
  }
  if (isFFmpegLoading) {
    // Wait for existing load
    let checks = 0;
    while (isFFmpegLoading && checks < 30) {
      await new Promise(r => setTimeout(r, 200));
      checks++;
    }
    return ffmpegInstance;
  }

  try {
    isFFmpegLoading = true;
    onLog?.('Initializing FFmpeg WebAssembly engine...');
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      onLog?.(message);
    });

    // Try loading single-thread or standard wasm core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    isFFmpegLoaded = true;
    onLog?.('FFmpeg WebAssembly engine loaded successfully.');
    return ffmpegInstance;
  } catch (err) {
    console.warn('FFmpeg WASM load fallback (using native Web Audio engine):', err);
    onLog?.('Using ultra-low-latency Web Audio native audio engine.');
    return null;
  } finally {
    isFFmpegLoading = false;
  }
}

/**
 * Transcodes or exports master mix with FFmpeg WASM, with native 24-bit WAV fallback
 */
export async function exportAudioWithFFmpeg(
  buffer: AudioBuffer,
  format: 'wav' | 'mp3',
  bitDepth: 16 | 24 = 24,
  normalize: boolean = true,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress?.(15, 'Rendering audio data stream...');

  // Base WAV file from audio buffer
  const rawWavBlob = audioBufferToWav(buffer, bitDepth, normalize);

  if (format === 'wav') {
    onProgress?.(100, 'Master 24-bit WAV exported.');
    return {
      blob: rawWavBlob,
      filename: `2047_Audio_Master_${bitDepth}bit.wav`,
    };
  }

  // If user requested MP3 or container encoding, try FFmpeg WASM
  try {
    onProgress?.(30, 'Starting FFmpeg WASM processor...');
    const ffmpeg = await getFFmpeg((msg) => onProgress?.(45, msg));
    
    if (!ffmpeg) {
      // Fallback to high quality WAV if FFmpeg WASM cannot start
      onProgress?.(100, 'Exported high-fidelity WAV format.');
      return {
        blob: rawWavBlob,
        filename: `2047_Audio_Master_${bitDepth}bit.wav`,
      };
    }

    const inputData = new Uint8Array(await rawWavBlob.arrayBuffer());
    await ffmpeg.writeFile('input.wav', inputData);

    onProgress?.(60, 'Encoding master mix via FFmpeg...');
    await ffmpeg.exec(['-i', 'input.wav', '-b:a', '320k', 'output.mp3']);

    const outputData = await ffmpeg.readFile('output.mp3');
    const mp3Blob = new Blob([outputData as any], { type: 'audio/mp3' });
    
    // Clean up virtual fs
    await ffmpeg.deleteFile('input.wav');
    await ffmpeg.deleteFile('output.mp3');

    onProgress?.(100, 'MP3 export completed.');
    return {
      blob: mp3Blob,
      filename: `2047_Audio_Master_320kbps.mp3`,
    };
  } catch (err) {
    console.error('FFmpeg export error, falling back to WAV:', err);
    onProgress?.(100, 'Fallback export to 24-bit WAV completed.');
    return {
      blob: rawWavBlob,
      filename: `2047_Audio_Master_${bitDepth}bit.wav`,
    };
  }
}
