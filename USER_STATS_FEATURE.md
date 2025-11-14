# User Stats Feature - Implementation Guide

## Overview

The SDK now supports returning a user's historical statistics when starting a new session, allowing games to display personal bests, total plays, and rank information immediately upon game start.

---

## What Changed

### 1. SDK Types Updated

**New `UserStats` Interface:**
```typescript
interface UserStats {
  highScore: number;           // User's personal best score
  highScoreRank: number | null; // Rank of user's high score (1 = best)
  totalPlays: number;          // Total times user played this game
  lastPlayedAt: string | null; // ISO timestamp of last session
}
```

**Updated `Session` Interface:**
```typescript
interface Session {
  sessionId: string;
  gameId: string;
  userId: string;
  token: string;
  startedAt: string;
  expiresAt: string;
  heartbeatInterval: number;
  user?: UserStats;  // ✨ NEW: User's historical stats
}
```

### 2. Backend API Response Updated

**Start Session Response (`POST /api/v1/sessions`):**
```json
{
  "sessionId": "sess_789abc",
  "gameId": "game_abc123",
  "userId": "user_456",
  "token": "eyJhbG...",
  "startedAt": "2024-11-07T10:30:00Z",
  "expiresAt": "2024-11-07T10:35:00Z",
  "heartbeatInterval": 60000,
  "status": "active",
  "user": {
    "highScore": 1200,
    "highScoreRank": 58,
    "totalPlays": 25,
    "lastPlayedAt": "2024-11-06T15:30:00Z"
  }
}
```

**First-Time Player Response:**
```json
{
  "sessionId": "sess_789abc",
  // ... other fields
  "user": {
    "highScore": 0,
    "highScoreRank": null,
    "totalPlays": 0,
    "lastPlayedAt": null
  }
}
```

---

## Backend Implementation

### Required Database Table

**`user_game_stats` Table:**
```sql
CREATE TABLE user_game_stats (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  game_id VARCHAR(255) NOT NULL,
  high_score INTEGER DEFAULT 0,
  high_score_rank INTEGER,
  total_plays INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0,  -- in seconds
  first_played_at TIMESTAMP NOT NULL,
  last_played_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_game_stats_lookup ON user_game_stats(user_id, game_id);
CREATE INDEX idx_user_game_stats_ranking ON user_game_stats(game_id, high_score DESC);
```

### Backend Logic

#### When Starting a Session

```javascript
// POST /api/v1/sessions
async function startSession(req, res) {
  const { userId, gameId } = req.body;

  // 1. Create session
  const session = await createSession(userId, gameId);

  // 2. Fetch user's stats for this game
  const userStats = await db.query(`
    SELECT
      high_score as "highScore",
      high_score_rank as "highScoreRank",
      total_plays as "totalPlays",
      last_played_at as "lastPlayedAt"
    FROM user_game_stats
    WHERE user_id = $1 AND game_id = $2
  `, [userId, gameId]);

  // 3. If no stats exist, return defaults
  const stats = userStats.rows[0] || {
    highScore: 0,
    highScoreRank: null,
    totalPlays: 0,
    lastPlayedAt: null
  };

  // 4. Return session with user stats
  return res.status(201).json({
    sessionId: session.id,
    gameId: session.gameId,
    userId: session.userId,
    token: session.token,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    heartbeatInterval: 60000,
    status: 'active',
    user: stats
  });
}
```

#### When Ending a Session

```javascript
// POST /api/v1/sessions/:sessionId/end
async function endSession(req, res) {
  const { sessionId } = req.params;
  const { finalScore, duration } = req.body;

  const session = await getSession(sessionId);

  // 1. Update or create user_game_stats
  await db.query(`
    INSERT INTO user_game_stats (
      id, user_id, game_id, high_score, total_plays,
      total_play_time, first_played_at, last_played_at
    )
    VALUES ($1, $2, $3, $4, 1, $5, NOW(), NOW())
    ON CONFLICT (user_id, game_id) DO UPDATE SET
      high_score = GREATEST(user_game_stats.high_score, EXCLUDED.high_score),
      total_plays = user_game_stats.total_plays + 1,
      total_play_time = user_game_stats.total_play_time + EXCLUDED.total_play_time,
      last_played_at = NOW(),
      updated_at = NOW()
  `, [generateId(), session.userId, session.gameId, finalScore, duration]);

  // 2. Calculate rank
  const rank = await calculateRank(session.gameId, finalScore);

  // 3. Queue background job to update high_score_rank
  await queueRankUpdateJob(session.gameId);

  // 4. Return response
  return res.json({
    sessionId,
    finalScore,
    duration,
    rank,
    // ... other fields
  });
}
```

#### Background Job: Update Ranks

```javascript
// Runs every 5 minutes
async function updateHighScoreRanks(gameId) {
  await db.query(`
    WITH ranked_scores AS (
      SELECT
        user_id,
        ROW_NUMBER() OVER (ORDER BY high_score DESC) as rank
      FROM user_game_stats
      WHERE game_id = $1
    )
    UPDATE user_game_stats
    SET high_score_rank = ranked_scores.rank
    FROM ranked_scores
    WHERE user_game_stats.user_id = ranked_scores.user_id
      AND user_game_stats.game_id = $1
  `, [gameId]);
}
```

---

## Frontend Usage

### Basic Usage

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});

await lyvely.ready();

// Start session
const session = await lyvely.startSession();

// Access user stats
if (session.user) {
  console.log('Your high score:', session.user.highScore);
  console.log('Your rank:', session.user.highScoreRank);
  console.log('Total plays:', session.user.totalPlays);

  // Display to user
  if (session.user.totalPlays > 0) {
    showMessage(`Welcome back! Your best score: ${session.user.highScore}`);
  } else {
    showMessage('Welcome! First time playing?');
  }
}
```

### Display High Score in Game UI

```javascript
// Start session and show high score
const session = await lyvely.startSession();

// Update UI
document.getElementById('highScore').textContent =
  session.user?.highScore || 0;
document.getElementById('rank').textContent =
  session.user?.highScoreRank ? `#${session.user.highScoreRank}` : '-';
document.getElementById('totalPlays').textContent =
  session.user?.totalPlays || 0;
```

### Construct 3 Example

```javascript
// In Construct 3 Browser Execute JavaScript
runtime.globalVars.lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});

await runtime.globalVars.lyvely.ready();

// Start session
const session = await runtime.globalVars.lyvely.startSession();

// Store high score in Construct variable
if (session.user) {
  runtime.globalVars.HighScore = session.user.highScore;
  runtime.globalVars.BestRank = session.user.highScoreRank || 0;
  runtime.globalVars.TotalGamesPlayed = session.user.totalPlays;
}

// Now you can display these in your game UI
```

---

## Use Cases

### 1. Show "Beat Your Best" Message

```javascript
const session = await lyvely.startSession();
const targetScore = session.user?.highScore || 0;

if (targetScore > 0) {
  showBanner(`Try to beat your best: ${targetScore}`);
}
```

### 2. Welcome Back Message

```javascript
const session = await lyvely.startSession();

if (session.user && session.user.totalPlays > 0) {
  const lastPlayed = new Date(session.user.lastPlayedAt);
  const daysSince = Math.floor((Date.now() - lastPlayed.getTime()) / 86400000);

  if (daysSince === 0) {
    showMessage('Welcome back! Playing again today?');
  } else if (daysSince === 1) {
    showMessage('Welcome back! We missed you yesterday!');
  } else {
    showMessage(`Welcome back! It's been ${daysSince} days!`);
  }
}
```

### 3. Achievement: First Time Player

```javascript
const session = await lyvely.startSession();

if (session.user && session.user.totalPlays === 0) {
  showTutorial();
  unlockAchievement('FIRST_GAME');
}
```

### 4. Display Rank Improvement

```javascript
const session = await lyvely.startSession();
const startRank = session.user?.highScoreRank;

// ... play game ...

const result = await lyvely.submitScore(finalScore);
const endRank = result.rank;

if (startRank && endRank < startRank) {
  const improvement = startRank - endRank;
  showMessage(`You improved ${improvement} ranks! 🎉`);
}
```

### 5. Persistent Progress Indicator

```javascript
const session = await lyvely.startSession();

// Show play count
const playCount = session.user?.totalPlays || 0;

if (playCount >= 100) {
  unlockAchievement('VETERAN_PLAYER');
} else if (playCount >= 50) {
  unlockAchievement('EXPERIENCED_PLAYER');
} else if (playCount >= 10) {
  unlockAchievement('REGULAR_PLAYER');
}
```

---

## Performance Considerations

### Caching Strategy

**Option 1: Cache in Redis**
```javascript
// When starting session, check Redis first
const cacheKey = `user_stats:${userId}:${gameId}`;
let userStats = await redis.get(cacheKey);

if (!userStats) {
  userStats = await db.query('SELECT ... FROM user_game_stats ...');
  await redis.setex(cacheKey, 300, JSON.stringify(userStats)); // 5 min TTL
}
```

**Option 2: Denormalize in Users Table**
```sql
-- Add game_stats jsonb column to users table
ALTER TABLE users ADD COLUMN game_stats JSONB DEFAULT '{}';

-- Update after each game
UPDATE users
SET game_stats = jsonb_set(
  game_stats,
  '{game_abc123}',
  '{"highScore": 1500, "totalPlays": 26}'::jsonb
)
WHERE id = 'user_456';
```

### Database Optimization

1. **Index Creation** (already mentioned above)
2. **Partition by Game ID** (for large datasets)
3. **Materialized View for Top Players**
   ```sql
   CREATE MATERIALIZED VIEW top_players_per_game AS
   SELECT game_id, user_id, high_score, high_score_rank
   FROM user_game_stats
   WHERE high_score_rank <= 1000
   ORDER BY game_id, high_score_rank;
   ```

---

## Testing

### Test Cases

1. **First-time player**
   - All stats should be 0 or null

2. **Returning player**
   - Stats should match previous session

3. **New high score**
   - high_score should update
   - high_score_rank should recalculate

4. **No improvement**
   - high_score stays the same
   - total_plays increments

### Mock Data

```javascript
// Mock response for testing
const mockSession = {
  sessionId: 'sess_test_123',
  gameId: 'game_test',
  userId: 'user_test',
  token: 'mock_token',
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 300000).toISOString(),
  heartbeatInterval: 60000,
  status: 'active',
  user: {
    highScore: 1200,
    highScoreRank: 42,
    totalPlays: 25,
    lastPlayedAt: '2024-11-06T15:30:00Z'
  }
};
```

---

## Migration Guide

If you have an existing backend, here's how to add this feature:

### Step 1: Add Database Table

```sql
-- Create the new table
CREATE TABLE user_game_stats (
  -- see schema above
);

-- Backfill from existing data
INSERT INTO user_game_stats (
  id, user_id, game_id, high_score, total_plays,
  first_played_at, last_played_at
)
SELECT
  gen_random_uuid(),
  user_id,
  game_id,
  MAX(score) as high_score,
  COUNT(*) as total_plays,
  MIN(created_at) as first_played_at,
  MAX(created_at) as last_played_at
FROM sessions
WHERE status = 'completed'
GROUP BY user_id, game_id;
```

### Step 2: Update Start Session Endpoint

```javascript
// Add user stats lookup
const userStats = await getUserStats(userId, gameId);
response.user = userStats;
```

### Step 3: Update End Session Endpoint

```javascript
// Add user stats update
await updateUserStats(userId, gameId, finalScore, duration);
```

### Step 4: Update SDK (Already Done!)

Just use the latest version of the SDK.

---

## Summary

✅ SDK types updated with `UserStats` interface
✅ Backend API spec updated with `user` object in session response
✅ Database schema defined for `user_game_stats` table
✅ Backend logic documented (queries and background jobs)
✅ Frontend usage examples provided
✅ Performance optimization strategies included

**Benefits:**
- Games can show personal bests immediately
- Better user engagement with progress tracking
- No extra API calls needed (included in session start)
- Foundation for achievement system
- Better onboarding for new vs returning players

---

**Last Updated:** 2024-11-07
**SDK Version:** 0.1.0+
