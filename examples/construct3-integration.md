# Construct 3 Integration Guide

This guide shows you how to integrate the Lyvely SDK into your Construct 3 game.

## Prerequisites

1. A Lyvely developer account at [developer.lyvely.com](https://developer.lyvely.com)
2. Your Game ID and API keys from the developer dashboard
3. Construct 3 (any license tier)

## Step 1: Add the SDK to Your Project

### Option A: Via CDN (Recommended)

1. In Construct 3, go to **Project Properties**
2. Scroll to **Scripts** section
3. Click **Add script**
4. Choose **From URL**
5. Enter: `https://cdn.lyvely.com/sdk/lyvely-game-sdk.js`
6. Click **Add**

### Option B: Via File

1. Download `lyvely-game-sdk.js` from the releases
2. In Construct 3, go to **Project Properties**
3. Scroll to **Scripts** section
4. Click **Add script**
5. Choose **From file**
6. Select the downloaded file

## Step 2: Initialize the SDK

Create an **Event Sheet** for your game's initialization (e.g., "Startup").

1. Add a **System > On start of layout** event
2. Add action: **Browser > Execute JavaScript**
3. Enter this code:

```javascript
// Initialize the Lyvely SDK
runtime.globalVars.lyvely = new LyvelySDK({
  gameId: 'game_abc123',           // Replace with your Game ID
  apiKey: 'pk_live_xyz789',        // Replace with your API key
  debug: true                       // Enable debug logging
});

// Wait for SDK to be ready
runtime.globalVars.lyvely.ready().then(() => {
  console.log('Lyvely SDK ready!');
});
```

**Important Notes:**
- Replace `game_abc123` with your actual Game ID
- Replace `pk_live_xyz789` with your actual Publishable API key
- Use `pk_test_*` keys during development
- Use `pk_live_*` keys in production

## Step 3: Start a Session When Game Starts

When your game begins (e.g., player clicks "Play" button):

1. Add event: **Button > On clicked** (or whatever starts your game)
2. Add action: **Browser > Execute JavaScript**
3. Enter this code:

```javascript
// Start a game session
runtime.globalVars.lyvely.startSession().then(session => {
  console.log('Session started:', session.sessionId);

  // Store session ID if you need it later
  runtime.globalVars.SessionID = session.sessionId;
}).catch(error => {
  console.error('Failed to start session:', error);
});
```

## Step 4: Submit Score When Game Ends

When your game ends:

1. Add event: **System > Compare variable** (e.g., when Lives = 0)
2. Add action: **Browser > Execute JavaScript**
3. Enter this code:

```javascript
// Get the score from Construct variables
const finalScore = runtime.globalVars.Score;

// Submit the score
runtime.globalVars.lyvely.submitScore(finalScore, {
  level: runtime.globalVars.Level,
  duration: runtime.globalVars.GameTime,
  coins: runtime.globalVars.CoinsCollected
}).then(result => {
  console.log('Score submitted!');
  console.log('Your rank:', result.rank);
  console.log('New high score:', result.isNewHighScore);

  // Store rank for display
  runtime.globalVars.PlayerRank = result.rank;

  // End the session
  return runtime.globalVars.lyvely.endSession(finalScore);
}).then(endResult => {
  console.log('Session ended');
  console.log('Personal best:', endResult.personalBest);
}).catch(error => {
  console.error('Error:', error);
});
```

## Step 5: Display Leaderboard

To show a leaderboard in your game:

1. Create a **Text** object named "LeaderboardText"
2. Add event: **Button > On clicked** (for your leaderboard button)
3. Add action: **Browser > Execute JavaScript**
4. Enter this code:

```javascript
// Fetch the leaderboard
runtime.globalVars.lyvely.getLeaderboard({
  period: 'daily',  // or 'weekly', 'all'
  limit: 10
}).then(leaderboard => {
  // Format the leaderboard text
  let text = 'TOP 10 PLAYERS\\n\\n';

  leaderboard.entries.forEach(entry => {
    text += `${entry.rank}. ${entry.username}: ${entry.score}\\n`;
  });

  // Update the text object
  const textObject = runtime.objects.LeaderboardText.getFirstInstance();
  if (textObject) {
    textObject.text = text;
  }
}).catch(error => {
  console.error('Failed to load leaderboard:', error);
});
```

## Complete Game Flow Example

Here's a complete example of a typical game flow:

### Layout: MainMenu

**Event: On start of layout**
```javascript
// Initialize SDK (only once)
if (!runtime.globalVars.lyvely) {
  runtime.globalVars.lyvely = new LyvelySDK({
    gameId: 'game_abc123',
    apiKey: 'pk_live_xyz789',
    debug: true
  });

  runtime.globalVars.lyvely.ready().then(() => {
    console.log('SDK ready');
  });
}
```

**Event: PlayButton > On clicked**
```javascript
// Start session and go to game
runtime.globalVars.lyvely.startSession().then(() => {
  runtime.globalVars.Score = 0;
  runtime.globalVars.Level = 1;
  runtime.goToLayout('GameLayout');
});
```

### Layout: GameLayout

**Event: Player > On collision with Enemy**
```javascript
runtime.globalVars.Lives -= 1;

if (runtime.globalVars.Lives <= 0) {
  // Game Over - submit score
  const score = runtime.globalVars.Score;

  runtime.globalVars.lyvely.submitScore(score).then(result => {
    runtime.globalVars.PlayerRank = result.rank;
    return runtime.globalVars.lyvely.endSession(score);
  }).then(() => {
    runtime.goToLayout('GameOverLayout');
  });
}
```

### Layout: GameOverLayout

**Event: On start of layout**
```javascript
// Display score and rank
const scoreText = runtime.objects.ScoreText.getFirstInstance();
const rankText = runtime.objects.RankText.getFirstInstance();

if (scoreText) {
  scoreText.text = 'Score: ' + runtime.globalVars.Score;
}

if (rankText) {
  rankText.text = 'Rank: #' + runtime.globalVars.PlayerRank;
}
```

**Event: LeaderboardButton > On clicked**
```javascript
runtime.globalVars.lyvely.getLeaderboard({
  period: 'all',
  limit: 10
}).then(leaderboard => {
  let text = 'LEADERBOARD\\n\\n';
  leaderboard.entries.forEach(entry => {
    text += `${entry.rank}. ${entry.username}: ${entry.score}\\n`;
  });

  const leaderboardText = runtime.objects.LeaderboardText.getFirstInstance();
  if (leaderboardText) {
    leaderboardText.text = text;
  }
});
```

## Advanced: Using Event Listeners

You can also use SDK events for better control:

```javascript
// Initialize with event listeners
runtime.globalVars.lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_xyz789'
});

// Listen to session start
runtime.globalVars.lyvely.on('sessionStart', (data) => {
  console.log('Session started!', data.sessionId);
  // You could trigger a Construct function here
});

// Listen to score submission
runtime.globalVars.lyvely.on('scoreSubmitted', (data) => {
  console.log('Score submitted! Rank:', data.rank);
  runtime.globalVars.PlayerRank = data.rank;
});

// Listen to session expiration
runtime.globalVars.lyvely.on('sessionExpired', () => {
  console.log('Session expired due to inactivity');
  // Show a "Session expired" message
  // Start a new session if player is still playing
});

// Listen to errors
runtime.globalVars.lyvely.on('error', (error) => {
  console.error('SDK Error:', error.message);
  // Handle errors gracefully
});
```

## Tips and Best Practices

### 1. Always Check for Active Session

Before submitting a score, check if there's an active session:

```javascript
if (runtime.globalVars.lyvely.hasActiveSession()) {
  // Submit score
  runtime.globalVars.lyvely.submitScore(score);
} else {
  console.warn('No active session');
}
```

### 2. Handle Network Errors

Always wrap SDK calls in try-catch or use .catch():

```javascript
runtime.globalVars.lyvely.submitScore(score)
  .then(result => {
    console.log('Success!', result.rank);
  })
  .catch(error => {
    console.error('Failed:', error.message);
    // Show error message to player
  });
```

### 3. Use Debug Mode During Development

Enable debug mode to see all SDK activity in the console:

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_test_xyz789',
  debug: true  // Disable in production
});
```

### 4. Test with Test Keys First

Always use `pk_test_*` keys during development. Only switch to `pk_live_*` keys when you're ready to go live.

### 5. Clean Up on Game Exit

If your game has an explicit exit or menu return:

```javascript
// End session when player quits
runtime.globalVars.lyvely.endSession(runtime.globalVars.Score);
```

## Troubleshooting

### "LyvelySDK is not defined"

Make sure you've added the SDK script in **Project Properties > Scripts** and it's loaded before your game code runs.

### "No active session"

You need to call `startSession()` before `submitScore()`. Make sure the session hasn't expired (5 min timeout).

### CORS Errors

Make sure your game's domain is added to the allowed domains list in the [developer dashboard](https://developer.lyvely.com).

### Scores Not Appearing

1. Check the browser console for errors
2. Verify your API key is correct
3. Make sure you're calling `submitScore()` with a valid number
4. Check your session is still active

## Need Help?

- Documentation: [docs.lyvely.com](https://docs.lyvely.com)
- Developer Portal: [developer.lyvely.com](https://developer.lyvely.com)
- Support: support@lyvely.com

## Example Project

Download a complete Construct 3 example project from:
[github.com/lyvely/construct3-example](https://github.com/lyvely/construct3-example)
