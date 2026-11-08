/**
 * 2047 AUDIO — Next-Gen DAW & Beat Machine
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AudioTrack, 
  AudioSlice, 
  AudioMetadata, 
  MasterEffects, 
  HistoryAction 
} from './types/audio';
import { ThemeVibe, THEME_PRESETS } from './types/theme';
import { UserProfile, UserHistoryItem, MAX_RECOMMENDED_DURATION_SEC } from './types/user';
import { 
  getAudioContext, 
  decodeAudioFile, 
  generateSyntheticDemoTrack 
} from './utils/audioContext';
import { 
  buildEffectsRack, 
  updateEffectsRack, 
  EffectsNodeGraph 
} from './utils/audioEffects';
import { 
  estimateBPM, 
  detectTransients, 
  getNonSilentRegions 
} from './utils/beatDetector';
import { 
  loadUserProfile, 
  saveUserProfile, 
  recordHistoryAction 
} from './utils/historyStore';
import { Header } from './components/Header';
import { TransportBar } from './components/TransportBar';
import { TrackSidebar } from './components/TrackSidebar';
import { Timeline } from './components/Timeline';
import { BeatPads } from './components/BeatPads';
import { DSPMasterRack } from './components/DSPMasterRack';
import { LoadMenu } from './components/LoadMenu';
import { MetadataModal } from './components/MetadataModal';
import { ExportModal } from './components/ExportModal';
import { UserAuthModal } from './components/UserAuthModal';
import { BufferingOverlay } from './components/BufferingOverlay';
import { Grid, Activity, Layers, Sliders, BarChart2, Download, Upload } from 'lucide-react';

const DEFAULT_EFFECTS: MasterEffects = {
  noiseGate: false,
  noiseGateThreshold: -42,
  highPassFreq: 30,
  lowPassFreq: 19000,
  reverbEnabled: false,
  reverbMix: 0.25,
  reverbDecay: 2.2,
  delayEnabled: false,
  delayTime: 0.25,
  delayFeedback: 0.35,
  delayMix: 0.3,
  enhanceEnabled: false,
  exciterAmount: 0.5,
  warmthAmount: 0.35,
  eqLowGain: 0,
  eqMidGain: 0,
  eqHighGain: 0,
  compressorEnabled: true,
  compThreshold: -16,
  compRatio: 3.5,
  compAttack: 0.015,
  compRelease: 0.2,
  limiterEnabled: true,
  limiterCeiling: -0.2,
  masterVolume: 1.0,
};

export default function App() {
  // Theme state: DEFAULT VIEW IS MIDNIGHT VIEW ('midnight-obsidian')
  const [currentTheme, setCurrentTheme] = useState<ThemeVibe>('midnight-obsidian');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Layout & Studio Navigation: '3col' | 'slicing' | 'beatpads' | 'load'
  // When opening app, default load to 1. Load Audio
  const [activeLayout, setActiveLayout] = useState<'3col' | 'slicing' | 'beatpads' | 'load'>('load');

  // Visual Indicator for Undo / Redo / History Action
  const [lastActionNotice, setLastActionNotice] = useState<{
    text: string;
    type: 'undo' | 'redo' | 'action';
    timestamp: number;
  } | null>({
    text: '2047 Studio Initialized',
    type: 'action',
    timestamp: Date.now(),
  });

  // User Profile & Auth
  const [currentUser, setCurrentUser] = useState<UserProfile>(loadUserProfile());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [inspectMetadataTrack, setInspectMetadataTrack] = useState<AudioTrack | null>(null);

  // Live Audio Engine Buffering state
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [bufferingMessage, setBufferingMessage] = useState<string>('Syncing DSP Engine Buffer... Please wait');

  // Metronome Click-Track State
  const [isMetronomeAudible, setIsMetronomeAudible] = useState<boolean>(false);

  // Audio Tracks State
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);

  // Playback & Transport State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [bpm, setBpm] = useState<number>(128);
  const [isDetectingBpm, setIsDetectingBpm] = useState<boolean>(false);
  const [isLockToBpm, setIsLockToBpm] = useState<boolean>(true);
  const [gridSnap, setGridSnap] = useState<'off' | '1/4' | '1/8' | '1/16' | '1/32'>('1/4');
  const [zoom, setZoom] = useState<number>(1.0);

  // Effects State
  const [effects, setEffects] = useState<MasterEffects>(DEFAULT_EFFECTS);

  // Undo / Redo History
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  // Web Audio Graph References
  const effectsGraphRef = useRef<EffectsNodeGraph | null>(null);
  const trackNodesRef = useRef<Map<string, { source: AudioBufferSourceNode | null; gain: GainNode; pan: StereoPannerNode }>>(new Map());
  const playbackStartTimeRef = useRef<number>(0);
  const playbackPauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  // Apply Theme to Document Element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    const selectedPreset = THEME_PRESETS.find(p => p.id === currentTheme);
    if (selectedPreset?.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  // Total duration across all tracks
  const totalDuration = tracks.reduce((max, t) => {
    return Math.max(max, t.audioBuffer?.duration || 0);
  }, 0) || 7.5;

  const pushHistory = useCallback((description: string, currentTracks: AudioTrack[]) => {
    setUndoStack((prev) => [...prev.slice(-20), { description, tracks: JSON.parse(JSON.stringify(currentTracks.map(t => ({ ...t, audioBuffer: t.audioBuffer })))) }]);
    setRedoStack([]);
    setLastActionNotice({
      text: description,
      type: 'action',
      timestamp: Date.now(),
    });
  }, []);

  // Trigger live change sync buffer overlay
  const triggerBufferSync = useCallback((customMsg?: string) => {
    setBufferingMessage(customMsg || 'Syncing DSP Engine Buffer... Please wait');
    setIsBuffering(true);
    setTimeout(() => {
      setIsBuffering(false);
    }, 280);
  }, []);

  // Initialize Web Audio graph
  useEffect(() => {
    const ctx = getAudioContext();
    if (!effectsGraphRef.current) {
      effectsGraphRef.current = buildEffectsRack(ctx);
    }
  }, []);

  // Update effects graph when parameters change
  useEffect(() => {
    if (effectsGraphRef.current) {
      updateEffectsRack(effectsGraphRef.current, effects);
    }
  }, [effects]);

  // Load initial Cyberpunk Beat Demo on mount so user has immediate playback
  useEffect(() => {
    try {
      const demoBuffer = generateSyntheticDemoTrack('cyberpunk_beat');
      const detectedBpm = estimateBPM(demoBuffer) || 128;
      setBpm(detectedBpm);

      const transients = detectTransients(demoBuffer, 1.3, 8);
      const initialSlices: AudioSlice[] = [];
      
      for (let i = 0; i < transients.length; i++) {
        const start = transients[i];
        const end = i < transients.length - 1 ? transients[i + 1] : Math.min(start + 0.6, demoBuffer.duration);
        initialSlices.push({
          id: `slice_demo_${i}`,
          name: `Slice ${i + 1}`,
          startTime: start,
          endTime: end,
          duration: end - start,
          color: i % 2 === 0 ? '#FACC15' : '#22D3EE',
          padIndex: i,
        });
      }

      const initialTrack: AudioTrack = {
        id: 'track_1',
        name: '2047 Cyberpunk Groove',
        audioBuffer: demoBuffer,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        color: '#FACC15',
        slices: initialSlices,
        metadata: {
          title: '2047 Cyberpunk Groove',
          artist: '2047 Studio',
          album: 'Neon Horizon',
          genre: 'Cyberpunk / Beat Machine',
          year: '2047',
          bpm: detectedBpm,
          key: 'D Minor',
          duration: demoBuffer.duration,
          sampleRate: demoBuffer.sampleRate,
          channels: demoBuffer.numberOfChannels,
          bitDepth: 24,
          fileSize: Math.floor(demoBuffer.length * 4),
          fileType: 'audio/wav',
        },
      };

      setTracks([initialTrack]);
      setActiveTrackId(initialTrack.id);

      // Log initial load to 1-week history
      recordHistoryAction({
        type: 'preset_loaded',
        title: 'Loaded 2047 Cyberpunk Groove',
        detail: 'Procedural synthesized multi-stem beat',
        trackName: initialTrack.name,
        durationSec: demoBuffer.duration,
        bpm: detectedBpm,
      });
    } catch (err) {
      console.warn('Initial demo beat setup:', err);
    }
  }, []);

  // Audio Playback Engine
  const stopAllPlaybackSources = useCallback(() => {
    trackNodesRef.current.forEach(({ source }) => {
      if (source) {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // ignore
        }
      }
    });
    trackNodesRef.current.clear();
  }, []);

  const startPlaybackAtTime = useCallback((offsetSec: number) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    stopAllPlaybackSources();

    const graph = effectsGraphRef.current;
    if (!graph) return;

    const anySolo = tracks.some(t => t.solo);

    tracks.forEach((track) => {
      if (!track.audioBuffer) return;
      if (track.muted) return;
      if (anySolo && !track.solo) return;

      const source = ctx.createBufferSource();
      source.buffer = track.audioBuffer;
      source.loop = isLooping;

      const gain = ctx.createGain();
      gain.gain.value = track.volume;

      const pan = ctx.createStereoPanner();
      pan.pan.value = track.pan;

      source.connect(gain);
      gain.connect(pan);
      pan.connect(graph.inputNode);

      const trackDur = track.audioBuffer.duration;
      const startOffset = isLooping ? (offsetSec % trackDur) : offsetSec;

      if (startOffset < trackDur) {
        source.start(0, startOffset);
      }

      trackNodesRef.current.set(track.id, { source, gain, pan });
    });

    playbackStartTimeRef.current = ctx.currentTime - offsetSec;
    playbackPauseOffsetRef.current = offsetSec;
    setIsPlaying(true);
  }, [tracks, isLooping, stopAllPlaybackSources]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopAllPlaybackSources();
      setIsPlaying(false);
      playbackPauseOffsetRef.current = currentTime;
    } else {
      startPlaybackAtTime(currentTime >= totalDuration ? 0 : currentTime);
    }
  }, [isPlaying, currentTime, totalDuration, startPlaybackAtTime, stopAllPlaybackSources]);

  const handleStop = useCallback(() => {
    stopAllPlaybackSources();
    setIsPlaying(false);
    setCurrentTime(0);
    playbackPauseOffsetRef.current = 0;
  }, [stopAllPlaybackSources]);

  const handleSeek = useCallback((newTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, newTime));
    setCurrentTime(clamped);
    playbackPauseOffsetRef.current = clamped;
    if (isPlaying) {
      startPlaybackAtTime(clamped);
    }
  }, [totalDuration, isPlaying, startPlaybackAtTime]);

  useEffect(() => {
    if (!isPlaying) return;
    const ctx = getAudioContext();

    const updateTime = () => {
      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      if (isLooping) {
        const loopTime = elapsed % (totalDuration || 1);
        setCurrentTime(loopTime);
      } else {
        if (elapsed >= totalDuration) {
          handleStop();
          return;
        }
        setCurrentTime(elapsed);
      }
      animFrameRef.current = requestAnimationFrame(updateTime);
    };

    animFrameRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, isLooping, totalDuration, handleStop]);

  // Trigger individual slice playback
  const handleTriggerSlice = useCallback((slice: AudioSlice) => {
    const activeTrack = tracks.find(t => t.id === activeTrackId);
    if (!activeTrack?.audioBuffer) return;

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = activeTrack.audioBuffer;

    const gain = ctx.createGain();
    gain.gain.value = activeTrack.volume;

    const graph = effectsGraphRef.current;
    if (graph) {
      source.connect(gain);
      gain.connect(graph.inputNode);
    } else {
      source.connect(gain);
      gain.connect(ctx.destination);
    }

    source.start(0, slice.startTime, slice.duration);
  }, [tracks, activeTrackId]);

  const handleTriggerPad = useCallback((padIndex: number, slice?: AudioSlice) => {
    if (slice) {
      handleTriggerSlice(slice);
    } else {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 110 * Math.pow(1.05946, padIndex);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  }, [handleTriggerSlice]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        handleSliceAtCurrentTime();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedSliceId) {
          handleRemoveSlice(selectedSliceId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        handleRedo();
      } else if (e.code === 'Enter' || e.code === 'Home') {
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, selectedSliceId, currentTime]);

  // Track Ingestion & 1-Week History Logging
  const handleAddTrackFromFile = async (file: File) => {
    try {
      triggerBufferSync('Decoding audio stream & generating waveform...');
      const decoded = await decodeAudioFile(file);
      const detectedBpm = estimateBPM(decoded.buffer);
      
      const newTrack: AudioTrack = {
        id: `track_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        audioBuffer: decoded.buffer,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        color: tracks.length % 2 === 0 ? '#FACC15' : '#22D3EE',
        slices: [],
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: currentUser.name || 'Studio Producer',
          album: 'Uploaded Audio',
          genre: 'Electronic',
          year: new Date().getFullYear().toString(),
          bpm: detectedBpm,
          key: 'Auto',
          duration: decoded.duration,
          sampleRate: decoded.sampleRate,
          channels: decoded.channels,
          bitDepth: 24,
          fileSize: file.size,
          fileType: file.type || 'audio/wav',
        },
      };

      pushHistory(`Add Track ${newTrack.name}`, tracks);
      setTracks((prev) => [...prev, newTrack]);
      setActiveTrackId(newTrack.id);
      setBpm(detectedBpm);

      // Record in 1-week history store
      recordHistoryAction({
        type: 'upload',
        title: `Uploaded ${newTrack.name}`,
        detail: `${(file.size / (1024 * 1024)).toFixed(1)} MB · ${(decoded.duration / 60).toFixed(1)} min`,
        trackName: newTrack.name,
        durationSec: decoded.duration,
        bpm: detectedBpm,
        fileSize: file.size,
      });

      // Advance directly to 2-col Slicing Studio as requested
      setActiveLayout('slicing');
    } catch (err) {
      console.error('File decode error:', err);
    }
  };

  const handleAddDemoTrack = (type: 'cyberpunk_beat' | '808_bass' | 'neon_synth' | 'glitch_drums') => {
    triggerBufferSync('Generating procedural preset audio...');
    const demoBuffer = generateSyntheticDemoTrack(type);
    const names = {
      cyberpunk_beat: '2047 Full Groove',
      '808_bass': 'Sub 808 Bassline',
      neon_synth: 'Neon Synth Lead',
      glitch_drums: 'Cyber Glitch Drums',
    };
    const colors = {
      cyberpunk_beat: '#FACC15',
      '808_bass': '#06B6D4',
      neon_synth: '#A855F7',
      glitch_drums: '#EC4899',
    };

    const newTrack: AudioTrack = {
      id: `track_demo_${Date.now()}`,
      name: names[type],
      audioBuffer: demoBuffer,
      volume: 0.85,
      pan: 0,
      muted: false,
      solo: false,
      color: colors[type],
      slices: [],
      metadata: {
        title: names[type],
        artist: '2047 SoundLab',
        album: 'Cybernetic Elements',
        genre: 'Cyberpunk',
        year: '2047',
        bpm: bpm || 128,
        key: 'D Minor',
        duration: demoBuffer.duration,
        sampleRate: demoBuffer.sampleRate,
        channels: demoBuffer.numberOfChannels,
        bitDepth: 24,
        fileSize: Math.floor(demoBuffer.length * 4),
        fileType: 'audio/wav',
      },
    };

    pushHistory(`Add Demo ${names[type]}`, tracks);
    setTracks((prev) => [...prev, newTrack]);
    setActiveTrackId(newTrack.id);

    recordHistoryAction({
      type: 'preset_loaded',
      title: `Loaded ${names[type]}`,
      detail: 'Synthesized loop preset',
      trackName: names[type],
      durationSec: demoBuffer.duration,
      bpm: bpm || 128,
    });
  };

  const handleUpdateTrack = (trackId: string, updates: Partial<AudioTrack>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTrack = (trackId: string) => {
    pushHistory('Delete Track', tracks);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (activeTrackId === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId);
      setActiveTrackId(remaining[0]?.id || '');
    }
  };

  const handleDuplicateTrack = (trackId: string) => {
    const source = tracks.find((t) => t.id === trackId);
    if (!source) return;
    const duplicated: AudioTrack = {
      ...source,
      id: `track_${Date.now()}`,
      name: `${source.name} (Copy)`,
      slices: [...source.slices],
    };
    pushHistory(`Duplicate Track ${source.name}`, tracks);
    setTracks((prev) => [...prev, duplicated]);
    setActiveTrackId(duplicated.id);
  };

  const handleAddSeparatedStems = (stems: { vocal: AudioBuffer; bass: AudioBuffer; drums: AudioBuffer; other: AudioBuffer }) => {
    triggerBufferSync('Mounting 4 separated stem channels...');
    const parent = tracks.find(t => t.id === activeTrackId);
    const parentName = parent?.name || 'Track';

    const stemDefs = [
      { key: 'vocal' as const, name: `${parentName} · Vocals`, color: '#EC4899', buffer: stems.vocal },
      { key: 'bass' as const, name: `${parentName} · Bass`, color: '#06B6D4', buffer: stems.bass },
      { key: 'drums' as const, name: `${parentName} · Drums`, color: '#FACC15', buffer: stems.drums },
      { key: 'other' as const, name: `${parentName} · Instruments`, color: '#A855F7', buffer: stems.other },
    ];

    const newStemTracks: AudioTrack[] = stemDefs.map((def) => ({
      id: `stem_${def.key}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: def.name,
      audioBuffer: def.buffer,
      volume: 0.85,
      pan: 0,
      muted: false,
      solo: false,
      color: def.color,
      isStem: true,
      stemType: def.key,
      slices: [],
      metadata: {
        title: def.name,
        artist: parent?.metadata.artist || '2047 Stem',
        album: 'Separated Stems',
        genre: 'Stem',
        year: '2047',
        bpm: bpm,
        key: parent?.metadata.key || 'Auto',
        duration: def.buffer.duration,
        sampleRate: def.buffer.sampleRate,
        channels: def.buffer.numberOfChannels,
        bitDepth: 24,
        fileSize: Math.floor(def.buffer.length * 4),
        fileType: 'audio/wav',
      },
    }));

    pushHistory('Separate Stems', tracks);
    setTracks((prev) => [...prev, ...newStemTracks]);
    setActiveTrackId(newStemTracks[0].id);

    recordHistoryAction({
      type: 'stem_separation',
      title: `Separated 4 Stems from ${parentName}`,
      detail: 'Vocals, Bass, Drums, Instruments',
      trackName: parentName,
      durationSec: parent?.metadata.duration || 10,
      bpm,
    });
  };

  // Timeline Slicing Handlers
  const handleAddSlice = (slice: AudioSlice) => {
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active) return;
    pushHistory('Add Slice', tracks);
    const updatedSlices = [...active.slices, slice];
    handleUpdateTrack(active.id, { slices: updatedSlices });
  };

  const handleRemoveSlice = (sliceId: string) => {
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active) return;
    pushHistory('Remove Slice', tracks);
    handleUpdateTrack(active.id, {
      slices: active.slices.filter((s) => s.id !== sliceId),
    });
    if (selectedSliceId === sliceId) setSelectedSliceId(null);
  };

  const handleSliceAtCurrentTime = () => {
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active?.audioBuffer) return;

    const sliceCount = active.slices.length;
    const sliceDuration = 0.5;
    const end = Math.min(currentTime + sliceDuration, active.audioBuffer.duration);

    const newSlice: AudioSlice = {
      id: `slice_${Date.now()}`,
      name: `Slice ${sliceCount + 1}`,
      startTime: currentTime,
      endTime: end,
      duration: end - currentTime,
      color: sliceCount % 2 === 0 ? '#FACC15' : '#22D3EE',
      padIndex: sliceCount < 16 ? sliceCount : undefined,
    };

    handleAddSlice(newSlice);
    setSelectedSliceId(newSlice.id);
  };

  const handleAutoSlice = () => {
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active?.audioBuffer) return;

    triggerBufferSync('Analyzing transient flux for auto slice...');
    const transients = detectTransients(active.audioBuffer, 1.35, 16);
    if (transients.length === 0) return;

    const newSlices: AudioSlice[] = [];
    for (let i = 0; i < transients.length; i++) {
      const start = transients[i];
      const end = i < transients.length - 1 ? transients[i + 1] : Math.min(start + 0.6, active.audioBuffer.duration);
      newSlices.push({
        id: `slice_auto_${Date.now()}_${i}`,
        name: `Slice ${i + 1}`,
        startTime: start,
        endTime: end,
        duration: end - start,
        color: i % 2 === 0 ? '#FACC15' : '#22D3EE',
        padIndex: i < 16 ? i : undefined,
      });
    }

    pushHistory('Auto Slice', tracks);
    handleUpdateTrack(active.id, { slices: newSlices });

    recordHistoryAction({
      type: 'slice',
      title: `Auto Sliced ${newSlices.length} Beats`,
      detail: 'Transient spectral flux trip detector',
      trackName: active.name,
      durationSec: active.metadata.duration,
      bpm,
    });
  };

  const handleSplitAtSilence = () => {
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active?.audioBuffer) return;

    triggerBufferSync('Detecting silence pauses...');
    const nonSilent = getNonSilentRegions(active.audioBuffer, -42, 0.12);
    const newSlices: AudioSlice[] = nonSilent.slice(0, 16).map((region, idx) => ({
      id: `slice_silence_${Date.now()}_${idx}`,
      name: `Slice ${idx + 1}`,
      startTime: region.start,
      endTime: region.end,
      duration: region.end - region.start,
      color: idx % 2 === 0 ? '#FACC15' : '#22D3EE',
      padIndex: idx < 16 ? idx : undefined,
    }));

    pushHistory('Split at Silence', tracks);
    handleUpdateTrack(active.id, { slices: newSlices });

    recordHistoryAction({
      type: 'slice',
      title: `Split at Silence (${newSlices.length} Slices)`,
      detail: '-42 dB RMS threshold detector',
      trackName: active.name,
      durationSec: active.metadata.duration,
      bpm,
    });
  };

  const handleDetectBpm = () => {
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active?.audioBuffer) return;

    setIsDetectingBpm(true);
    setTimeout(() => {
      const detected = estimateBPM(active.audioBuffer!);
      setBpm(detected);
      setIsDetectingBpm(false);
    }, 300);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, { description: lastAction.description, tracks }]);
    setUndoStack((prev) => prev.slice(0, -1));
    setTracks(lastAction.tracks);
    setLastActionNotice({
      text: `Undid: ${lastAction.description}`,
      type: 'undo',
      timestamp: Date.now(),
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, { description: nextAction.description, tracks }]);
    setRedoStack((prev) => prev.slice(0, -1));
    setTracks(nextAction.tracks);
    setLastActionNotice({
      text: `Redid: ${nextAction.description}`,
      type: 'redo',
      timestamp: Date.now(),
    });
  };

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      <div className={`flex-1 flex flex-col w-full ${isMobilePreview ? 'max-w-md mx-auto border-x border-slate-300 dark:border-neutral-800 shadow-2xl my-2 rounded-2xl overflow-hidden' : ''}`}>
        {/* Top Header */}
        <Header
          onOpenExport={() => setIsExportOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentTheme={currentTheme}
          onChangeTheme={setCurrentTheme}
          isMobilePreview={isMobilePreview}
          onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
          activeLayout={activeLayout}
          onChangeLayout={setActiveLayout}
          currentUser={currentUser}
          lastActionNotice={lastActionNotice}
        />

        {/* Master Transport Toolbar with Visual & Click-Track Metronome */}
        <TransportBar
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onStop={handleStop}
          isLooping={isLooping}
          onToggleLoop={() => setIsLooping(!isLooping)}
          currentTime={currentTime}
          totalDuration={totalDuration}
          bpm={bpm}
          onChangeBpm={setBpm}
          onDetectBpm={handleDetectBpm}
          isDetectingBpm={isDetectingBpm}
          isLockToBpm={isLockToBpm}
          onToggleLockToBpm={() => setIsLockToBpm(!isLockToBpm)}
          gridSnap={gridSnap}
          onChangeGridSnap={setGridSnap}
          zoom={zoom}
          onChangeZoom={setZoom}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          isMetronomeAudible={isMetronomeAudible}
          onToggleMetronomeAudible={() => setIsMetronomeAudible(!isMetronomeAudible)}
        />

        {/* Studio View Deck */}
        <div className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
          {/* VIEW MODE 1: Step 1 Load Menu */}
          {activeLayout === 'load' && (
            <LoadMenu
              onAddTrackFromFile={handleAddTrackFromFile}
              onAddDemoTrack={handleAddDemoTrack}
              onNavigateToSlicing={() => setActiveLayout('slicing')}
              hasTracks={tracks.length > 0}
              activeTrackName={activeTrack?.name}
            />
          )}

          {/* VIEW MODE 2: 3-Column Studio Overview (Tracks | Timeline/Pads | Unified DSP & EQ) */}
          {activeLayout === '3col' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
              {/* Col 1: Left Track Stems & Presets */}
              <TrackSidebar
                tracks={tracks}
                activeTrackId={activeTrackId}
                onSelectTrack={setActiveTrackId}
                onAddTrackFromFile={handleAddTrackFromFile}
                onAddDemoTrack={handleAddDemoTrack}
                onUpdateTrack={handleUpdateTrack}
                onDeleteTrack={handleDeleteTrack}
                onDuplicateTrack={handleDuplicateTrack}
                onOpenMetadata={setInspectMetadataTrack}
                isMobileFullView={false}
              />

              {/* Col 2: Center Waveform Timeline */}
              <main className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-neutral-800">
                <Timeline
                  tracks={tracks}
                  activeTrack={activeTrack}
                  currentTime={currentTime}
                  totalDuration={totalDuration}
                  bpm={bpm}
                  zoom={zoom}
                  gridSnap={gridSnap}
                  onSeek={handleSeek}
                  onAddSlice={handleAddSlice}
                  onRemoveSlice={handleRemoveSlice}
                  onPlaySlice={handleTriggerSlice}
                  onSliceAtCurrentTime={handleSliceAtCurrentTime}
                  onAutoSlice={handleAutoSlice}
                  onSplitAtSilence={handleSplitAtSilence}
                  selectedSliceId={selectedSliceId}
                  onSelectSlice={setSelectedSliceId}
                  onZoomChange={setZoom}
                />
              </main>

              {/* Col 3: Right Unified DSP, EQ & Dynamics Master Rack */}
              <aside className="w-80 lg:w-96 flex flex-col shrink-0 border-l border-slate-200 dark:border-neutral-800 overflow-hidden bg-slate-50 dark:bg-[#0d0d14]">
                <DSPMasterRack
                  effects={effects}
                  onChangeEffects={setEffects}
                  activeTrack={activeTrack}
                  onAddSeparatedStems={handleAddSeparatedStems}
                  analyserNode={effectsGraphRef.current?.analyser || null}
                  isPlaying={isPlaying}
                  onBufferSync={triggerBufferSync}
                />
              </aside>
            </div>
          )}

          {/* VIEW MODE 3: 2-Column Slicing Studio (Wide Timeline | Combined DSP & EQ) */}
          {activeLayout === 'slicing' && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[500px]">
              {/* Left: Long Precision Timeline (70% width for detailed transient slicing) */}
              <main className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-neutral-800">
                <Timeline
                  tracks={tracks}
                  activeTrack={activeTrack}
                  currentTime={currentTime}
                  totalDuration={totalDuration}
                  bpm={bpm}
                  zoom={zoom}
                  gridSnap={gridSnap}
                  onSeek={handleSeek}
                  onAddSlice={handleAddSlice}
                  onRemoveSlice={handleRemoveSlice}
                  onPlaySlice={handleTriggerSlice}
                  onSliceAtCurrentTime={handleSliceAtCurrentTime}
                  onAutoSlice={handleAutoSlice}
                  onSplitAtSilence={handleSplitAtSilence}
                  selectedSliceId={selectedSliceId}
                  onSelectSlice={setSelectedSliceId}
                  onZoomChange={setZoom}
                />
              </main>

              {/* Right: Combined DSP, EQ & Slices Inspector (30% width) */}
              <aside className="w-full lg:w-96 flex flex-col shrink-0 overflow-hidden bg-slate-50 dark:bg-[#0d0d14]">
                <DSPMasterRack
                  effects={effects}
                  onChangeEffects={setEffects}
                  activeTrack={activeTrack}
                  onAddSeparatedStems={handleAddSeparatedStems}
                  analyserNode={effectsGraphRef.current?.analyser || null}
                  isPlaying={isPlaying}
                  onBufferSync={triggerBufferSync}
                />
              </aside>
            </div>
          )}

          {/* VIEW MODE 4: 16-Pad MPC Beat Machine */}
          {activeLayout === 'beatpads' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
              {/* Left Track Stems */}
              <TrackSidebar
                tracks={tracks}
                activeTrackId={activeTrackId}
                onSelectTrack={setActiveTrackId}
                onAddTrackFromFile={handleAddTrackFromFile}
                onAddDemoTrack={handleAddDemoTrack}
                onUpdateTrack={handleUpdateTrack}
                onDeleteTrack={handleDeleteTrack}
                onDuplicateTrack={handleDuplicateTrack}
                onOpenMetadata={setInspectMetadataTrack}
                isMobileFullView={false}
              />

              {/* Center 16 Velocity MPC Pads */}
              <main className="flex-1 flex flex-col overflow-hidden">
                <BeatPads
                  activeTrack={activeTrack}
                  onTriggerPad={handleTriggerPad}
                />
              </main>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0d0d14]/95 backdrop-blur-md border-t border-slate-200 dark:border-neutral-800 pb-safe grid grid-cols-4 items-center h-14 px-1 select-none shadow-lg">
          <button
            onClick={() => setActiveLayout('load')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeLayout === 'load'
                ? 'text-amber-600 dark:text-yellow-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-0.5">Load</span>
          </button>

          <button
            onClick={() => setActiveLayout('slicing')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeLayout === 'slicing'
                ? 'text-amber-600 dark:text-yellow-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-0.5">Slicing</span>
          </button>

          <button
            onClick={() => setActiveLayout('beatpads')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeLayout === 'beatpads'
                ? 'text-amber-600 dark:text-yellow-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-0.5">Pads</span>
          </button>

          <button
            onClick={() => setActiveLayout('3col')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeLayout === '3col'
                ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-0.5">DSP & EQ</span>
          </button>
        </nav>
      </div>

      {/* Floating Master Export Button on Desktop */}
      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsExportOpen(true)}
          className="min-h-[48px] px-5 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-yellow-400 dark:to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-xl hover:shadow-yellow-400/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-amber-200 dark:border-yellow-200"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          <span>Master Export 24-Bit</span>
        </button>
      </div>

      {/* Live Changes Sync Buffering Overlay */}
      {isBuffering && (
        <BufferingOverlay
          isBuffering={isBuffering}
          message={bufferingMessage}
        />
      )}

      {/* User Auth & 1-Week History Modal */}
      {isAuthModalOpen && (
        <UserAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUpdateUser={setCurrentUser}
        />
      )}

      {/* Metadata ID3 Modal */}
      {inspectMetadataTrack && (
        <MetadataModal
          track={inspectMetadataTrack}
          isOpen={!!inspectMetadataTrack}
          onClose={() => setInspectMetadataTrack(null)}
          onSaveMetadata={(trackId, meta) => {
            handleUpdateTrack(trackId, { metadata: meta, name: meta.title });
          }}
        />
      )}

      {/* Master 24-bit WAV & MP3 Export Modal */}
      {isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          tracks={tracks}
          effects={effects}
          totalDuration={totalDuration}
        />
      )}
    </div>
  );
}
