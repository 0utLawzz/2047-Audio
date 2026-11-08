# 2047 AUDIO — Publishing & Audio Engine Optimization Guide

## 1. Web Audio Engine Latency & Memory Governance

### Memory Safety Guard
- **10-Minute Track Constraint**: Browsers allocate approximately 10 MB of uncompressed 32-bit floating-point RAM per minute of stereo audio at 44.1 kHz. Capping standard track imports to 10 minutes (`MAX_RECOMMENDED_DURATION_SEC = 600`) ensures mobile devices do not trigger browser garbage collection stutter or OOM tab crashes.
- **Garbage Collection Optimization**: OfflineAudioContext instances are created strictly for transient operations (stem isolation, offline rendering) and discarded after resolving.

### High-DPI Waveform Canvas
- Waveform canvases dynamically scale with `devicePixelRatio` to prevent blurriness on 2x/3x Retina and OLED phone screens.

---

## 2. Progressive Web App (PWA) Distribution

To publish **2047 AUDIO** as a standalone installable desktop & mobile app:
1. Ensure the web app manifest is linked in `index.html`:
```json
{
  "name": "2047 AUDIO",
  "short_name": "2047 AUDIO",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#d97706",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 3. Audio Codecs & Fallbacks
- **WAV PCM (24-bit / 16-bit)**: Zero dependencies, instant client-side array buffer compilation via `wavExporter.ts`.
- **MP3 Encoding**: Powered by `@ffmpeg/ffmpeg` WebAssembly with multi-threaded WASM core and automatic fallback to 24-bit WAV if WebAssembly threads are blocked.
