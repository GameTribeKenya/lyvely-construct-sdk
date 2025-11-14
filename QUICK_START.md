# Quick Start Guide

Get up and running with the Lyvely Game SDK in 5 minutes.

## 1. Include the SDK

### Via CDN (Easiest)
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

## 2. Initialize

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',      // From developer.lyvely.com
  apiKey: 'pk_live_xyz789',   // From developer.lyvely.com
  debug: true                  // Optional: enable console logs
});

await lyvely.ready();
```

## 3. Start Session

```javascript
const session = await lyvely.startSession();
console.log('Session started:', session.sessionId);
```

## 4. Submit Score

```javascript
const result = await lyvely.submitScore(1500);
console.log('Your rank:', result.rank);
```

## 5. End Session

```javascript
await lyvely.endSession(1500);
```

## 6. Get Leaderboard

```javascript
const leaderboard = await lyvely.getLeaderboard({
  period: 'daily',
  limit: 10
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
  <title>My Game</title>
  <script src="https://cdn.lyvely.com/sdk/lyvely-game-sdk.js"></script>
</head>
<body>
  <button id="start">Start Game</button>
  <button id="submit">Submit Score</button>
  <div id="leaderboard"></div>

  <script>
    const lyvely = new LyvelySDK({
      gameId: 'game_abc123',
      apiKey: 'pk_live_xyz789'
    });

    let score = 0;

    document.getElementById('start').onclick = async () => {
      await lyvely.startSession();
      score = 0;
      // Start your game logic
    };

    document.getElementById('submit').onclick = async () => {
      const result = await lyvely.submitScore(score);
      alert(`Your rank: #${result.rank}`);
      await lyvely.endSession(score);
    };
  </script>
</body>
</html>
```

## Listen to Events

```javascript
lyvely.on('sessionStart', () => console.log('Session started!'));
lyvely.on('scoreSubmitted', (data) => console.log('Rank:', data.rank));
lyvely.on('error', (error) => console.error('Error:', error.message));
```

## Next Steps

- Read the [full documentation](README.md)
- Check out [Construct 3 integration guide](examples/construct3-integration.md)
- View the [complete example](examples/basic-example.html)
- Visit [developer.lyvely.com](https://developer.lyvely.com) to get your API keys

## Need Help?

- Docs: [docs.lyvely.com](https://docs.lyvely.com)
- Issues: [github.com/lyvely/lyvely-game-sdk/issues](https://github.com/lyvely/lyvely-game-sdk/issues)
- Email: support@lyvely.com
