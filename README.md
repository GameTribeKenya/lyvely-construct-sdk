# Lyvely Game SDK

JavaScript SDK for integrating HTML5 games with Lyvely platform. Works with Construct 3, Phaser, and vanilla JavaScript.

## Installation

**CDN (Recommended for Construct 3)**
```html
<script src="https://your-cdn.com/lyvely-game-sdk.js"></script>
```

**NPM**
```bash
npm install @justbrian/lyvely-game-sdk
```

## Quick Start

```javascript
// 1. Initialize
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});

await lyvely.ready();

// 2. Start session
const session = await lyvely.startSession('user_123');

// 3. Submit score
const result = await lyvely.submitScore(1500);

// 4. End session
await lyvely.endSession(1500);

// 5. Get leaderboard
const leaderboard = await lyvely.getLeaderboard({ period: 'daily' });
```

## Construct 3 Integration

Use "Browser > Execute JavaScript" action:

```javascript
// Initialize once at startup
runtime.globalVars.lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});
await runtime.globalVars.lyvely.ready();

// Start session when game starts
await runtime.globalVars.lyvely.startSession();

// Submit score when game ends
const score = runtime.globalVars.Score;
await runtime.globalVars.lyvely.submitScore(score);
await runtime.globalVars.lyvely.endSession(score);
```

## API Reference

### Configuration

```typescript
new LyvelySDK({
  gameId: string;        // Required: Your game ID
  apiKey: string;        // Required: Publishable key (pk_live_* or pk_test_*)
  apiBaseUrl?: string;   // Optional: API URL (default: https://api.lyvely.com)
  debug?: boolean;       // Optional: Enable logging (default: false)
})
```

### Methods

**`ready(): Promise<void>`**
Wait for SDK initialization.

**`startSession(userId?: string, metadata?: object): Promise<Session>`**
Start game session. Auto-generates anonymous ID if no userId provided.

**`submitScore(score: number, metadata?: object): Promise<ScoreResponse>`**
Submit score for current session.

**`endSession(finalScore?: number, metadata?: object): Promise<SessionEndResponse>`**
End current session.

**`getLeaderboard(options?: { period?: 'daily' | 'weekly' | 'all', limit?: number }): Promise<LeaderboardResponse>`**
Fetch leaderboard.

**`on(event: string, callback: Function): void`**
Listen to events: `'ready'`, `'sessionStart'`, `'sessionEnd'`, `'scoreSubmitted'`, `'error'`

### Response Types

**Session**
```typescript
{
  sessionId: string;
  userId: string;
  token: string;
  user: {
    highScore: number;
    highScoreRank: number | null;
    totalPlays: number;
    lastPlayedAt: string | null;
  }
}
```

**ScoreResponse**
```typescript
{
  scoreId: string;
  rank: number;
  totalPlayers: number;
  isNewHighScore: boolean;
  previousBest: number;
  currentScore: number;
}
```

**LeaderboardResponse**
```typescript
{
  entries: Array<{
    rank: number;
    userId: string;
    username: string;
    score: number;
    achievedAt: string;
  }>;
}
```

## License

MIT
