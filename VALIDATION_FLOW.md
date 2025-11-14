# Game Validation Flow - Complete Guide

## Question: When Does Game Validation Happen?

**Answer:** Game validation happens at **TWO points** for defense in depth:

1. ✅ **[Optional] During SDK Initialization** - Early detection
2. ✅ **[Required] During Session Creation** - Backend enforcement

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Game Developer's Browser                                    │
│                                                               │
│  1. Initialize SDK                                            │
│     const lyvely = new LyvelySDK({                           │
│       gameId: 'game_abc123',                                 │
│       apiKey: 'pk_live_xyz789'                               │
│     });                                                       │
│                                                               │
│  2. Call ready()                                              │
│     await lyvely.ready();                                     │
│                                                               │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ├─ [OPTIONAL VALIDATION]
                    │
                    ▼
          ┌─────────────────────┐
          │  GET /api/v1/games  │
          │      /:gameId       │
          └─────────┬───────────┘
                    │
                    ▼
          ┌─────────────────────┐
          │   Lyvely Backend    │
          │                     │
          │  ✓ Game exists?     │
          │  ✓ Is published?    │
          │  ✓ API key valid?   │
          └─────────┬───────────┘
                    │
                    ├─── 200 OK: Game is valid
                    │    (SDK caches game config)
                    │
                    └─── 404/403: Game invalid
                         (SDK throws error immediately)

┌─────────────────────────────────────────────────────────────┐
│  User Plays Game                                              │
│                                                               │
│  3. Start Session                                             │
│     await lyvely.startSession();                              │
│                                                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├─ [REQUIRED VALIDATION]
                    │
                    ▼
          ┌─────────────────────┐
          │ POST /api/v1/       │
          │     sessions        │
          │                     │
          │ Headers:            │
          │  X-API-Key: pk_*    │
          │  Origin: game.com   │
          └─────────┬───────────┘
                    │
                    ▼
          ┌─────────────────────────────────────────┐
          │   Lyvely Backend - CRITICAL CHECKS      │
          │                                          │
          │  1. ✓ API key exists in database?       │
          │  2. ✓ API key status = 'active'?        │
          │  3. ✓ Extract gameId from API key       │
          │  4. ✓ Game exists?                      │
          │  5. ✓ Game status = 'published'?        │
          │  6. ✓ Origin in allowed_domains?        │
          │  7. ✓ Rate limit OK?                    │
          └─────────┬───────────────────────────────┘
                    │
                    ├─── 201 Created: All valid
                    │    → Create session
                    │    → Generate JWT token
                    │    → Fetch user stats
                    │    → Return session + user data
                    │
                    ├─── 401: Invalid API key
                    ├─── 403: Domain not allowed
                    ├─── 404: Game not found
                    └─── 429: Rate limited

┌─────────────────────────────────────────────────────────────┐
│  4. Gameplay Continues                                        │
│     - Heartbeats every 60s (no validation needed)            │
│     - Score submissions (session token validated)             │
│     - End session (session token validated)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Validation Logic

### Layer 1: SDK Initialization (Optional)

**When:** `lyvely.ready()` is called

**What it does:**
```javascript
// SDK code (simplified)
async init() {
  // Call GET /api/v1/games/:gameId
  const game = await this.httpClient.get(`/api/v1/games/${this.config.gameId}`);

  // If successful, cache game config
  this.gameConfig = game;

  // If fails, throw error
  if (!game) {
    throw new SDKError('GAME_NOT_FOUND', 'Game does not exist');
  }
}
```

**Backend checks:**
```javascript
// GET /api/v1/games/:gameId
async function getGame(req, res) {
  const { gameId } = req.params;
  const apiKey = req.headers['x-api-key'];

  // 1. Validate API key
  const keyRecord = await db.query(
    'SELECT game_id FROM api_keys WHERE key = $1 AND status = $2',
    [apiKey, 'active']
  );

  if (!keyRecord.rows[0]) {
    return res.status(401).json({ error: { code: 'INVALID_API_KEY' } });
  }

  // 2. Check API key belongs to this game
  if (keyRecord.rows[0].game_id !== gameId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  }

  // 3. Get game
  const game = await db.query(
    'SELECT * FROM games WHERE id = $1',
    [gameId]
  );

  if (!game.rows[0]) {
    return res.status(404).json({ error: { code: 'GAME_NOT_FOUND' } });
  }

  // 4. Check game is published
  if (game.rows[0].status !== 'published') {
    return res.status(403).json({ error: { code: 'GAME_NOT_PUBLISHED' } });
  }

  return res.json(game.rows[0]);
}
```

**Benefits:**
- ✅ Early error detection (before user tries to play)
- ✅ Better developer experience (clear errors in console)
- ✅ Can cache game configuration

**When to skip:**
- Performance-critical scenarios
- Mobile with slow networks
- When game config changes frequently

---

### Layer 2: Session Creation (Required)

**When:** `lyvely.startSession()` is called

**What it does:**
```javascript
// SDK code (simplified)
async startSession(userId) {
  // Call POST /api/v1/sessions
  const session = await this.httpClient.post('/api/v1/sessions', {
    userId,
    gameId: this.config.gameId
  });

  return session;
}
```

**Backend checks (MUST DO ALL OF THESE):**
```javascript
// POST /api/v1/sessions
async function createSession(req, res) {
  const apiKey = req.headers['x-api-key'];
  const origin = req.headers.origin;
  const { userId } = req.body;

  // ─────────────────────────────────────────
  // STEP 1: Validate API Key
  // ─────────────────────────────────────────
  const keyRecord = await db.query(`
    SELECT game_id, allowed_domains
    FROM api_keys
    WHERE key = $1 AND status = $2
  `, [apiKey, 'active']);

  if (!keyRecord.rows[0]) {
    return res.status(401).json({
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid or revoked API key'
      }
    });
  }

  const gameId = keyRecord.rows[0].game_id;
  const allowedDomains = keyRecord.rows[0].allowed_domains;

  // ─────────────────────────────────────────
  // STEP 2: Validate Game Exists & Published
  // ─────────────────────────────────────────
  const game = await db.query(`
    SELECT id, title, status
    FROM games
    WHERE id = $1
  `, [gameId]);

  if (!game.rows[0]) {
    return res.status(404).json({
      error: {
        code: 'GAME_NOT_FOUND',
        message: 'Game does not exist'
      }
    });
  }

  if (game.rows[0].status !== 'published') {
    return res.status(403).json({
      error: {
        code: 'GAME_NOT_PUBLISHED',
        message: 'Game is not available for play'
      }
    });
  }

  // ─────────────────────────────────────────
  // STEP 3: Validate Domain (CORS)
  // ─────────────────────────────────────────
  const isDomainAllowed = allowedDomains.includes(origin) ||
                          allowedDomains.includes('*') ||
                          (origin.includes('localhost') && game.rows[0].status === 'draft');

  if (!isDomainAllowed) {
    return res.status(403).json({
      error: {
        code: 'DOMAIN_NOT_ALLOWED',
        message: `Origin ${origin} is not in the allowed domains list`
      }
    });
  }

  // ─────────────────────────────────────────
  // STEP 4: Rate Limiting
  // ─────────────────────────────────────────
  const rateLimitKey = `session_start:${apiKey}:${Math.floor(Date.now() / 60000)}`;
  const requestCount = await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 60);

  if (requestCount > 10) { // 10 sessions per minute
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many session requests. Try again in a minute.'
      }
    });
  }

  // ─────────────────────────────────────────
  // STEP 5: Create Session
  // ─────────────────────────────────────────
  const sessionId = generateId();
  const token = generateJWT({ sessionId, gameId, userId });
  const expiresAt = new Date(Date.now() + 300000); // 5 minutes

  await db.query(`
    INSERT INTO sessions (id, game_id, user_id, status, started_at, expires_at, last_heartbeat_at)
    VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
  `, [sessionId, gameId, userId, 'active', expiresAt]);

  // ─────────────────────────────────────────
  // STEP 6: Get User Stats
  // ─────────────────────────────────────────
  const userStats = await db.query(`
    SELECT high_score, high_score_rank, total_plays, last_played_at
    FROM user_game_stats
    WHERE user_id = $1 AND game_id = $2
  `, [userId, gameId]);

  const stats = userStats.rows[0] || {
    high_score: 0,
    high_score_rank: null,
    total_plays: 0,
    last_played_at: null
  };

  // ─────────────────────────────────────────
  // STEP 7: Return Response
  // ─────────────────────────────────────────
  return res.status(201).json({
    sessionId,
    gameId,
    userId,
    token,
    startedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    heartbeatInterval: 60000,
    status: 'active',
    user: {
      highScore: stats.high_score,
      highScoreRank: stats.high_score_rank,
      totalPlays: stats.total_plays,
      lastPlayedAt: stats.last_played_at
    }
  });
}
```

**Benefits:**
- ✅ **Cannot be bypassed** - all requests go through backend
- ✅ **Enforces security** - domain validation, rate limiting
- ✅ **Protects data** - prevents unauthorized access
- ✅ **Always up-to-date** - checks current game status

---

## Why Two Layers?

### Defense in Depth Strategy

**If only SDK validation:**
- ❌ Can be bypassed (user can skip `ready()` call)
- ❌ Doesn't protect backend
- ❌ Stale data if game status changes

**If only backend validation:**
- ❌ Poor developer experience (errors happen later)
- ❌ Extra load on backend
- ❌ User may wait to find out game is invalid

**With both layers:**
- ✅ Early errors for developers (SDK validation)
- ✅ Cannot be bypassed (backend validation)
- ✅ Best of both worlds

---

## Configuration Options

### SDK: Make Init Validation Optional

```typescript
interface SDKConfig {
  gameId: string;
  apiKey: string;
  validateOnInit?: boolean; // Default: true
}
```

**Usage:**
```javascript
// Default: Validate on init (recommended)
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});
await lyvely.ready(); // Calls GET /api/v1/games/:gameId

// Skip init validation (faster, but less safe)
const lyvelyFast = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789',
  validateOnInit: false // Skip GET call
});
await lyvelyFast.ready(); // Does nothing, returns immediately
```

---

## Error Handling

### SDK Init Errors

```javascript
try {
  await lyvely.ready();
} catch (error) {
  if (error.type === 'GAME_NOT_FOUND') {
    console.error('Game does not exist. Check your gameId.');
  } else if (error.type === 'AUTH_ERROR') {
    console.error('Invalid API key. Check your credentials.');
  }
}
```

### Session Start Errors

```javascript
try {
  await lyvely.startSession();
} catch (error) {
  if (error.type === 'GAME_NOT_FOUND') {
    console.error('Game was deleted or unpublished.');
  } else if (error.type === 'FORBIDDEN') {
    console.error('Domain not allowed. Add your domain to allowed list.');
  } else if (error.type === 'RATE_LIMITED') {
    console.error('Too many requests. Slow down.');
  }
}
```

---

## Summary

### Question: When is the game validated?

**Answer:**

1. **[Optional] During `lyvely.ready()`**
   - SDK calls `GET /api/v1/games/:gameId`
   - Good for: Developer experience, early error detection
   - Can be disabled for performance

2. **[Required] During `lyvely.startSession()`**
   - Backend validates on every session creation
   - Checks: API key → game → domain → rate limits
   - **Cannot be skipped or bypassed**

### Recommendation

**Use both:**
- Enable SDK validation for development (better errors)
- Optionally disable for production (performance)
- Always rely on backend validation (security)

---

**Last Updated:** 2024-11-07
