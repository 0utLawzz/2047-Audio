# 2047 AUDIO — Database & Session Architecture

This document outlines the data model, 1-week history retention strategy, and optional production database schemas for **2047 AUDIO**.

---

## 1. Storage Architecture

### Client-Side Persistent Tier (Zero-Latency Local)
- **Engine**: `localStorage` + `IndexedDB` fallback
- **Retention Policy**: Automatic rolling 7-day TTL (`HISTORY_RETENTION_MS = 604,800,000 ms`).
- **Safety Constraints**:
  - Maximum recommended audio length: **10 minutes (600 seconds)**
  - Maximum recommended track memory: **120 MB** per project
  - Slices per track: up to 64 slices mapped across banks A–D

### Data Model Schema

#### User Profile
```typescript
interface UserProfile {
  id: string;             // Unique user UUID / guest token
  name: string;           // Display artist name
  email: string;          // User email or guest placeholder
  avatar: string;         // DiceBear / uploaded avatar URL
  isGuest: boolean;       // Guest status
  tier: 'Free Studio' | 'Pro Producer';
  createdAt: number;      // Epoch timestamp (ms)
}
```

#### User Activity History (7-Day Rolling Buffer)
```typescript
interface UserHistoryItem {
  id: string;             // Unique event ID
  type: 'upload' | 'slice' | 'stem_separation' | 'export' | 'preset_loaded';
  title: string;          // Human-readable summary
  detail: string;         // Action parameters
  timestamp: number;      // Timestamp (ms)
  trackName: string;      // Associated track
  durationSec: number;    // Track duration (capped at 600s)
  bpm: number;            // Track tempo
  fileSize?: number;      // Uploaded bytes
}
```

---

## 2. PostgreSQL / Supabase Schema (For Cloud Production)

```sql
-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Studio Producer',
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'Free Studio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Audio Projects & History (Auto-purges after 7 days)
CREATE TABLE user_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  track_name TEXT NOT NULL,
  duration_sec NUMERIC(6, 2) CHECK (duration_sec <= 600),
  bpm INTEGER NOT NULL DEFAULT 128,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Automatic 7-Day Purge Index & Cron Job
CREATE INDEX idx_user_history_created_at ON user_history(created_at);

-- Scheduled deletion query for 1-week retention:
DELETE FROM user_history
WHERE created_at < NOW() - INTERVAL '7 days';
```

---

## 3. Firestore Document Model

```json
// Collection: users/{userId}
{
  "name": "Alex Mercer",
  "email": "alex@studio.audio",
  "tier": "Pro Producer",
  "createdAt": "2026-11-08T12:00:00Z"
}

// Subcollection: users/{userId}/history/{historyId}
{
  "type": "stem_separation",
  "title": "Separated 4 Stems (Vocals, Bass, Drums, Other)",
  "trackName": "Cyberpunk 2047 Beat",
  "durationSec": 184.2,
  "bpm": 128,
  "timestamp": 1731067200000,
  "expiresAt": 1731672000000 // TTL field for Firestore TTL policy
}
```
