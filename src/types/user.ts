export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isGuest: boolean;
  tier: 'Free Studio' | 'Pro Producer';
  createdAt: number;
}

export interface UserHistoryItem {
  id: string;
  type: 'upload' | 'slice' | 'stem_separation' | 'export' | 'preset_loaded';
  title: string;
  detail: string;
  timestamp: number; // ms
  trackName: string;
  durationSec: number;
  bpm: number;
  fileSize?: number;
}

export const MAX_RECOMMENDED_DURATION_SEC = 600; // 10 minutes maximum for optimal browser audio engine performance
export const MAX_RECOMMENDED_FILE_SIZE_MB = 120; // 120 MB
export const HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (1 week)
