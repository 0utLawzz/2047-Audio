# 2047 AUDIO — Next-Gen Web DAW & Beat Machine

> **"The Future of Music is Here"**
> A production-ready, ultra-low-latency in-browser digital audio workstation (DAW) and 16-pad MPC Beat Machine built with React, Web Audio API, and FFmpeg WebAssembly.

---

## 🌟 Key Features

### 1. Multi-Theme Studio Engine (Default: Studio Daylight)
- **Studio Daylight (Default)**: Modern slate surfaces with amber accents for maximum daytime legibility.
- **Cyberpunk 2047**: Deep OLED dark mode with electric yellow (`#FACC15`) and neon cyan.
- **MPC 3000 Vintage**: 1990s Akai travertine cream (`#f4f1ea`) and classic sampler rust accents.
- **Midnight Obsidian**: Stealth carbon dark (`#0b0d13`) with ice-blue and turquoise glow.

### 2. High-Performance Studio Layouts
- **3-Column Studio Overview**:
  - *Col 1 (Left)*: Track Stems, multi-track gain & pan, mute/solo, and preset audio loops.
  - *Col 2 (Center)*: Interactive retina waveform timeline with sample-accurate zoom.
  - *Col 3 (Right)*: Unified DSP Rack, 3-Band Parametric EQ, Dynamics, Limiter, and live Stereo VU spectrum monitor.
- **2-Column Slicing Studio**:
  - Expanded wide timeline for transient detection and chop slicing.
- **16-Velocity Pad Beat Machine**:
  - Modeled after the classic Android Beat Machine app with customizable keybindings, pad reassignment, clearing, and semitone pitch tuning.

### 3. Step 1 Audio Load Menu & Memory Governance
- Drag & drop support for **MP3**, **WAV** (16/24-bit), **OGG**, **M4A**, and **FLAC**.
- **10-Minute Safety Guard**: Automatic memory advisory for tracks exceeding 10 minutes (`MAX_RECOMMENDED_DURATION_SEC = 600`) to guarantee browser stability on mobile devices.
- Instant procedural audio generators (2047 Cyberpunk Groove, 808 Sub Bassline, Neon Synth Lead, Glitch Drums).

### 4. Metronome & BPM Synchronization
- **Visual Pulse Indicator**: 4-beat dynamic pulse in the TransportBar highlighting downbeat and sub-beats in sync with project tempo.
- **Audible Click-Track**: Dedicated triangle woodblock click (920 Hz on beat 1, 540 Hz on beats 2–4) with zero latency.
- Auto-BPM detection via autocorrelation and tap-tempo calculator.

### 5. Live Audio DSP & "Separate Cords" Engine
- **Stem Separation**: OfflineAudioContext isolation of **Vocals**, **Bass**, **Drums**, and **Instruments**.
- **Noise Gate / Clean**: High-pass (20–400 Hz) and low-pass (6–20 kHz) filters.
- **Convolution Reverb & Stereo Delay**: Reverb room decay and millisecond ping-pong echo.
- **Studio Quality Enhancer**: Loudness maximization, harmonic exciter, and tube saturation.

### 6. User Account & 1-Week Rolling History
- Producer profile manager with customizable artist name and avatar.
- 7-day rolling activity log recording uploads, slice events, stem splits, and master exports.

### 7. Master Export Engine
- Lossless 24-bit and 16-bit PCM WAV export.
- 320 kbps MP3 encoding via `@ffmpeg/ffmpeg` WebAssembly with automatic fallback.

---

## 🚀 Quickstart & Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Type check & lint
npm run lint

# 4. Build production bundle
npm run build
npm run preview
```

---

## 📚 Documentation & Architecture Guides
- [Deployment Guide (Vercel, Netlify, Docker)](./DEPLOYMENT.md)
- [Database & 7-Day History Architecture](./DATABASE.md)
- [Publishing & Audio Engine Optimization](./PUBLISHING.md)

---

## ⌨️ Keyboard Shortcuts
| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `Enter` / `Home` | Stop & Rewind to 00:00 |
| `S` | Slice active track at playhead |
| `Delete` / `Backspace` | Delete selected slice |
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Cmd + Y` | Redo |
| `1`–`4`, `Q`–`R`, `A`–`F`, `Z`–`V` | Trigger MPC Beat Machine Pads 1–16 |
| `Ctrl + Mouse Wheel` | Smooth Timeline Zoom In / Out |

---

## 📜 License
Apache-2.0. Copyright (c) 2026 AUDIO 2047.
