import { UserProfile, UserHistoryItem, HISTORY_RETENTION_MS } from '../types/user';

const USER_KEY = '2047_audio_user_session';
const HISTORY_KEY = '2047_audio_user_history_1wk';

const DEFAULT_USER: UserProfile = {
  id: 'usr_guest_' + Math.random().toString(36).substring(2, 8),
  name: 'Studio Producer',
  email: 'producer@2047audio.studio',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=producer2047&backgroundColor=facc15',
  isGuest: true,
  tier: 'Free Studio',
  createdAt: Date.now(),
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load user profile from storage:', err);
  }
  saveUserProfile(DEFAULT_USER);
  return DEFAULT_USER;
}

export function saveUserProfile(user: UserProfile) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Failed to save user profile:', err);
  }
}

export function loadUserHistory(): UserHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const items: UserHistoryItem[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out items older than 7 days (1 week retention)
    const valid = items.filter(it => (now - it.timestamp) <= HISTORY_RETENTION_MS);
    if (valid.length !== items.length) {
      saveUserHistory(valid);
    }
    return valid;
  } catch (err) {
    console.warn('Failed to load user history:', err);
    return [];
  }
}

export function saveUserHistory(items: UserHistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save user history:', err);
  }
}

export function recordHistoryAction(action: Omit<UserHistoryItem, 'id' | 'timestamp'>) {
  const current = loadUserHistory();
  const newItem: UserHistoryItem = {
    ...action,
    id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
  };
  const updated = [newItem, ...current].slice(0, 50); // Keep latest 50 within 7 days
  saveUserHistory(updated);
  return updated;
}

export function clearUserHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('Failed to clear history:', err);
  }
}
