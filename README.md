# Lyvely Game SDK

Official JavaScript SDK for integrating HTML5 games with the Lyvely platform. Perfect for Construct 3, Phaser, and other web-based game engines.

## Features

- ✅ **Easy Integration** - Get started in minutes with simple API
- ✅ **Automatic Session Management** - Heartbeats and timeouts handled automatically
- ✅ **Real-time Leaderboards** - Submit scores and fetch rankings
- ✅ **Event System** - React to session lifecycle events
- ✅ **Error Handling** - Automatic retry with exponential backoff
- ✅ **Offline Support** - Queue requests when offline
- ✅ **TypeScript** - Full type definitions included
- ✅ **Lightweight** - Under 10KB gzipped

## Installation

### Via CDN (Recommended for Construct 3)

```html
<script src="https://cdn.lyvely.com/sdk/lyvely-game-sdk.js"></script>
```

### Via NPM

```bash
npm install @lyvely/game-sdk
```

```javascript
import { LyvelySDK } from '@lyvely/game-sdk';
```

## Quick Start

### 1. Get Your API Keys

Sign up at [developer.lyvely.com](https://developer.lyvely.com) and create a new game to get your:
- Game ID: `game_abc123`
- Publishable Key: `pk_live_xyz789` or `pk_test_xyz789`

### 2. Initialize the SDK

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789',
  debug: true // Enable console logging
});

// Wait for SDK to be ready
await lyvely.ready();
```

### 3. Start a Game Session

```javascript
// Start session with user ID (or let SDK create anonymous ID)
const session = await lyvely.startSession('user_123');
console.log('Session started:', session.sessionId);
```

### 4. Submit Score

```javascript
// Submit score during or after gameplay
const result = await lyvely.submitScore(1500, {
  level: 5,
  duration: 180,
  achievements: ['first_win']
});

console.log('Your rank:', result.rank);
console.log('New high score:', result.isNewHighScore);
```

### 5. End Session

```javascript
// End session when game is over
const finalResult = await lyvely.endSession(1500);
console.log('Final rank:', finalResult.rank);
console.log('Personal best:', finalResult.personalBest);
```

### 6. Get Leaderboard

```javascript
// Fetch leaderboard data
const leaderboard = await lyvely.getLeaderboard({
  period: 'daily', // 'daily', 'weekly', or 'all'
  limit: 100,
  offset: 0
});

leaderboard.entries.forEach(entry => {
  console.log(`${entry.rank}. ${entry.username}: ${entry.score}`);
});
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Game - Lyvely Integration</title>
  <script src="https://cdn.lyvely.com/sdk/lyvely-game-sdk.js"></script>
</head>
<body>
  <div id="game"></div>
  <button id="start">Start Game</button>
  <button id="submit">Submit Score</button>
  <div id="leaderboard"></div>

  <script>
    // Initialize SDK
    const lyvely = new LyvelySDK({
      gameId: 'game_abc123',
      apiKey: 'pk_test_xyz789',
      debug: true
    });

    let currentScore = 0;

    // Wait for SDK to be ready
    lyvely.ready().then(() => {
      console.log('Lyvely SDK ready!');
    });

    // Listen to events
    lyvely.on('sessionStart', (data) => {
      console.log('Session started:', data);
    });

    lyvely.on('scoreSubmitted', (data) => {
      console.log('Score submitted! Rank:', data.rank);
    });

    lyvely.on('sessionEnd', (data) => {
      console.log('Session ended. Final rank:', data.rank);
    });

    lyvely.on('error', (error) => {
      console.error('SDK Error:', error.message);
    });

    // Start game
    document.getElementById('start').addEventListener('click', async () => {
      try {
        await lyvely.startSession();
        currentScore = 0;
        startGame(); // Your game logic
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    });

    // Submit score
    document.getElementById('submit').addEventListener('click', async () => {
      try {
        const result = await lyvely.submitScore(currentScore);
        alert(`Score submitted! Your rank: ${result.rank}`);

        // End session
        await lyvely.endSession(currentScore);

        // Show leaderboard
        showLeaderboard();
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    });

    // Display leaderboard
    async function showLeaderboard() {
      const leaderboard = await lyvely.getLeaderboard({
        period: 'daily',
        limit: 10
      });

      const html = leaderboard.entries.map(entry =>
        `<div>${entry.rank}. ${entry.username}: ${entry.score}</div>`
      ).join('');

      document.getElementById('leaderboard').innerHTML = html;
    }

    function startGame() {
      // Your game logic here
      setInterval(() => {
        currentScore += 10;
      }, 1000);
    }
  </script>
</body>
</html>
```

## Construct 3 Integration

### Using Browser Execute JavaScript

```javascript
// In Construct 3, use "Browser > Execute JavaScript" action

// Initialize SDK (do this once at startup)
runtime.globalVars.lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});

await runtime.globalVars.lyvely.ready();
```

```javascript
// Start session when game starts
await runtime.globalVars.lyvely.startSession();
```

```javascript
// Submit score when game ends
const score = runtime.globalVars.Score; // Your score variable
const result = await runtime.globalVars.lyvely.submitScore(score);
```

```javascript
// End session
await runtime.globalVars.lyvely.endSession(score);
```

## API Reference

### Constructor

```typescript
new LyvelySDK(config: SDKConfig)
```

**Config Options:**
- `gameId` (required): Your game ID from developer dashboard
- `apiKey` (required): Publishable API key (pk_live_* or pk_test_*)
- `apiBaseUrl` (optional): API base URL (default: https://api.lyvely.com)
- `environment` (optional): 'production' or 'sandbox' (default: 'production')
- `debug` (optional): Enable debug logging (default: false)
- `heartbeatInterval` (optional): Heartbeat interval in ms (default: 60000)
- `sessionTimeout` (optional): Session timeout in ms (default: 300000)

### Methods

#### `ready(): Promise<void>`
Returns a promise that resolves when the SDK is initialized and ready.

#### `startSession(userId?: string, metadata?: object): Promise<Session>`
Start a new game session. If userId is not provided, an anonymous ID is generated.

#### `submitScore(score: number, metadata?: ScoreMetadata): Promise<ScoreResponse>`
Submit a score for the current session.

#### `endSession(finalScore?: number, metadata?: object): Promise<SessionEndResponse>`
End the current game session.

#### `getLeaderboard(options?: LeaderboardOptions): Promise<LeaderboardResponse>`
Fetch leaderboard data.

**Options:**
- `period`: 'daily' | 'weekly' | 'all'
- `limit`: Number of entries (default: 100)
- `offset`: Pagination offset (default: 0)

#### `getSession(): Session | null`
Get the current active session.

#### `hasActiveSession(): boolean`
Check if there's an active session.

#### `on(event: SDKEventType, callback: EventCallback): void`
Register an event listener.

#### `off(event: SDKEventType, callback: EventCallback): void`
Remove an event listener.

#### `destroy(): void`
Clean up and destroy the SDK instance.

### Events

Listen to SDK events using the `on()` method:

```javascript
lyvely.on('ready', () => {
  console.log('SDK is ready');
});

lyvely.on('sessionStart', (data) => {
  console.log('Session started:', data.sessionId);
});

lyvely.on('sessionEnd', (data) => {
  console.log('Session ended:', data.finalScore);
});

lyvely.on('sessionExpired', (data) => {
  console.log('Session expired due to inactivity');
});

lyvely.on('scoreSubmitted', (data) => {
  console.log('Score submitted:', data.score, 'Rank:', data.rank);
});

lyvely.on('heartbeat', () => {
  console.log('Heartbeat sent');
});

lyvely.on('error', (error) => {
  console.error('Error:', error.message);
});
```

## Advanced Features

### Anonymous Users

If you don't have user IDs, the SDK automatically creates and persists anonymous user IDs in localStorage:

```javascript
// SDK will create and remember anonymous user
await lyvely.startSession();
```

### Custom Metadata

Add custom metadata to sessions and scores:

```javascript
await lyvely.startSession('user_123', {
  playerLevel: 42,
  gameMode: 'hardcore'
});

await lyvely.submitScore(1500, {
  level: 5,
  duration: 180,
  achievements: ['speed_demon', 'no_damage'],
  combo: 50
});
```

### Error Handling

The SDK automatically retries failed requests with exponential backoff. Handle errors gracefully:

```javascript
try {
  await lyvely.submitScore(score);
} catch (error) {
  if (error.type === 'SESSION_EXPIRED') {
    // Session expired, start a new one
    await lyvely.startSession();
  } else if (error.type === 'RATE_LIMITED') {
    // Too many requests, wait and retry
    setTimeout(() => lyvely.submitScore(score), 5000);
  } else {
    console.error('Failed to submit score:', error.message);
  }
}
```

### Offline Support

The SDK queues requests when offline and syncs when connection is restored (coming in v1.1).

## Best Practices

1. **Initialize Once**: Create one SDK instance per game session
2. **Handle Errors**: Always wrap SDK calls in try-catch blocks
3. **End Sessions**: Always call `endSession()` when game is over
4. **Use Events**: Listen to SDK events for better UX
5. **Test Mode**: Use `pk_test_*` keys during development
6. **Security**: Never expose secret keys (`sk_*`) in client code

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari 12+, Chrome Mobile 60+)

## Troubleshooting

### SDK not loading
Make sure you're including the script tag before your game code.

### Session expired errors
Sessions expire after 5 minutes of inactivity. Always start a new session when needed.

### CORS errors
Make sure your domain is added to the allowed domains list in the developer dashboard.

### Heartbeat failures
Check your network connection. The SDK will continue trying to send heartbeats.

## Support

- Documentation: [docs.lyvely.com](https://docs.lyvely.com)
- Developer Portal: [developer.lyvely.com](https://developer.lyvely.com)
- GitHub Issues: [github.com/lyvely/lyvely-game-sdk/issues](https://github.com/lyvely/lyvely-game-sdk/issues)
- Email: support@lyvely.com

## License

MIT License - see LICENSE file for details
# lyvely-construct-sdk
