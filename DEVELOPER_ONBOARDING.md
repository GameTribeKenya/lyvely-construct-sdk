# Developer Onboarding Guide

Complete guide for game developers to register their games and integrate with the Lyvely platform.

---

## Step 1: Create Developer Account

### Sign Up at Developer Portal

Visit **[developer.lyvely.com](https://developer.lyvely.com)** and create an account:

1. Click "Sign Up"
2. Enter email and password
3. Verify email address
4. Accept Developer Terms of Service
5. You're in!

---

## Step 2: Register Your Game

### Via Developer Dashboard

**Endpoint:** `POST /api/v1/developer/games`

**Using Dashboard UI:**
1. Click "Create New Game"
2. Fill in game details:
   - **Title**: "My Awesome Puzzle Game"
   - **Description**: "A fun and challenging puzzle game"
   - **Category**: Puzzle
   - **Allowed Domains**:
     - `localhost:3000` (for local testing)
     - `localhost:8080`
     - `mygame.com`
     - `www.mygame.com`
3. Click "Create Game"

**Using API:**
```bash
curl -X POST https://api.lyvely.com/api/v1/developer/games \
  -H "Authorization: Bearer YOUR_DEVELOPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Awesome Puzzle Game",
    "description": "A fun and challenging puzzle game",
    "category": "puzzle",
    "allowedDomains": [
      "localhost:3000",
      "mygame.com",
      "www.mygame.com"
    ]
  }'
```

### Response - Save These Keys!

```json
{
  "game": {
    "id": "game_abc123",
    "title": "My Awesome Puzzle Game",
    "slug": "my-awesome-puzzle-game",
    "status": "draft"
  },
  "apiKeys": {
    "publishable": {
      "test": "pk_test_abc123xyz789",
      "live": "pk_live_abc123xyz789"
    },
    "secret": {
      "test": "sk_test_secret123xyz",
      "live": "sk_live_secret456xyz"
    }
  },
  "message": "Game created successfully. Save your secret keys securely - they will not be shown again!"
}
```

**⚠️ IMPORTANT:**
- **Save secret keys immediately** - they won't be shown again!
- Use `pk_test_*` and `sk_test_*` for development
- Use `pk_live_*` and `sk_live_*` for production
- Never expose secret keys (`sk_*`) in client code

---

## Step 3: Integrate SDK into Your Game

### For Construct 3 Games

**1. Add SDK Script**

In Construct 3:
- Go to **Project Properties**
- Scroll to **Scripts** section
- Click **Add script > From URL**
- Enter: `https://cdn.lyvely.com/sdk/lyvely-game-sdk.js`
- Click **Add**

**2. Initialize SDK**

Create a **"Startup" Event Sheet** and add:

```javascript
// Event: System > On start of layout

// Action: Browser > Execute JavaScript
runtime.globalVars.lyvely = new LyvelySDK({
  gameId: 'game_abc123',           // Your Game ID
  apiKey: 'pk_test_abc123xyz789',  // Your Test API Key
  debug: true                       // Enable console logging
});

await runtime.globalVars.lyvely.ready();
console.log('Lyvely SDK ready!');
```

**3. Start Session on Game Start**

```javascript
// Event: PlayButton > On clicked

// Action: Browser > Execute JavaScript
await runtime.globalVars.lyvely.startSession();
console.log('Session started!');

// Store high score if available
const session = runtime.globalVars.lyvely.getSession();
if (session.user) {
  runtime.globalVars.HighScore = session.user.highScore;
}
```

**4. Submit Score on Game End**

```javascript
// Event: System > Compare variable (Lives = 0)

// Action: Browser > Execute JavaScript
const finalScore = runtime.globalVars.Score;

const result = await runtime.globalVars.lyvely.submitScore(finalScore);
console.log('Your rank:', result.rank);

await runtime.globalVars.lyvely.endSession(finalScore);
```

### For Custom HTML5 Games

**1. Include SDK**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Game</title>
  <script src="https://cdn.lyvely.com/sdk/lyvely-game-sdk.js"></script>
</head>
<body>
  <div id="game"></div>
  <script src="game.js"></script>
</body>
</html>
```

**2. Initialize and Use**

```javascript
// game.js
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_test_abc123xyz789',
  debug: true
});

await lyvely.ready();

// Start session
await lyvely.startSession();

// Play game...
let score = 0;

// Submit score
const result = await lyvely.submitScore(score);
console.log('Rank:', result.rank);

// End session
await lyvely.endSession(score);
```

---

## Step 4: Test Your Integration

### Local Testing

1. **Run your game locally** (e.g., `http://localhost:3000`)
2. **Open browser console** (F12)
3. **Watch for SDK logs**:
   ```
   [Lyvely SDK] Initialized
   [Lyvely SDK] Ready
   [Lyvely SDK] Session started: sess_123
   [Lyvely SDK] Score submitted: 1500 - Rank: #42
   [Lyvely SDK] Session ended
   ```

### Test Checklist

- [ ] SDK initializes without errors
- [ ] Session starts successfully
- [ ] High score is displayed (if returning player)
- [ ] Score submits successfully
- [ ] Rank is returned
- [ ] Session ends properly
- [ ] No CORS errors

### Common Issues

**CORS Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Make sure `localhost:3000` is in your allowed domains list

**Invalid API Key:**
```
401 Unauthorized: Invalid or revoked API key
```
**Solution:** Double-check you're using the correct API key

**Domain Not Allowed:**
```
403 Forbidden: Origin not in allowed domains list
```
**Solution:** Add your domain to the allowed list in dashboard

---

## Step 5: View Analytics

### Developer Dashboard

Visit `developer.lyvely.com/games/game_abc123/analytics` to see:

- **Total Sessions**: How many times your game was played
- **Total Players**: Unique players
- **Average Score**: Mean score across all players
- **Average Play Time**: Mean session duration
- **Top Players**: Current leaderboard leaders
- **Recent Sessions**: Latest gameplay sessions

---

## Step 6: Publish Your Game

### Change Status to Published

**Via Dashboard:**
1. Go to your game settings
2. Change **Status** from "Draft" to "Published"
3. Click "Save"

**Via API:**
```bash
curl -X PATCH https://api.lyvely.com/api/v1/developer/games/game_abc123 \
  -H "Authorization: Bearer sk_test_secret123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'
```

### Switch to Live API Keys

**In your game code, change:**
```javascript
// OLD (test mode)
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_test_abc123xyz789'
});

// NEW (production mode)
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_abc123xyz789',  // Use live key
  debug: false                       // Disable debug logs
});
```

### Deploy Your Game

1. Upload your game to your production domain (e.g., `mygame.com`)
2. Make sure `mygame.com` is in your allowed domains
3. Test one more time in production
4. You're live!

---

## Step 7: Monitor and Maintain

### View Live Stats

Monitor your game's performance:
- Player count
- Session duration
- Score distribution
- Leaderboard activity

### Rotate Keys if Compromised

If your API key is exposed:

```bash
curl -X POST https://api.lyvely.com/api/v1/developer/games/game_abc123/keys/rotate \
  -H "Authorization: Bearer sk_live_secret456xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "keyType": "publishable",
    "environment": "live",
    "reason": "Key exposed in public repository"
  }'
```

**Response:**
```json
{
  "oldKey": {
    "key": "pk_live_abc123xyz789",
    "status": "revoked"
  },
  "newKey": {
    "key": "pk_live_new456abc",
    "status": "active"
  }
}
```

**Update your game with the new key immediately!**

---

## API Key Security Best Practices

### ✅ DO:
- Use test keys (`pk_test_*`) during development
- Use live keys (`pk_live_*`) in production
- Store secret keys (`sk_*`) in environment variables
- Use secret keys only in backend/server code
- Rotate keys if compromised
- Add only necessary domains to allowed list

### ❌ DON'T:
- Commit secret keys to git
- Share secret keys publicly
- Use live keys in development
- Expose secret keys in client code
- Use `*` in allowed domains (wildcard) in production

---

## Environment-Specific Configuration

### Development

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_test_abc123xyz789',  // Test key
  debug: true,                      // Enable logging
  apiBaseUrl: 'https://api.lyvely.com'  // or localhost for local API
});
```

### Staging

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_test_abc123xyz789',  // Still test key
  debug: false,
  apiBaseUrl: 'https://api.lyvely.com'
});
```

### Production

```javascript
const lyvely = new LyvelySDK({
  gameId: 'game_abc123',
  apiKey: 'pk_live_abc123xyz789',  // Live key
  debug: false,
  apiBaseUrl: 'https://api.lyvely.com'
});
```

---

## Troubleshooting

### SDK not loading
- Check script URL is correct
- Check browser console for errors
- Verify CDN is accessible

### Session creation fails
- Verify API key is correct
- Check domain is in allowed list
- Check rate limits

### Scores not submitting
- Verify session is active
- Check score is a valid number
- Look for validation errors

### Support

- **Documentation**: [docs.lyvely.com](https://docs.lyvely.com)
- **Developer Portal**: [developer.lyvely.com](https://developer.lyvely.com)
- **GitHub**: [github.com/lyvely/lyvely-game-sdk](https://github.com/lyvely/lyvely-game-sdk)
- **Email**: support@lyvely.com
- **Discord**: [discord.gg/lyvely](https://discord.gg/lyvely)

---

## Quick Reference

### Register Game
```bash
POST /api/v1/developer/games
```

### Get API Keys
```bash
GET /api/v1/developer/games/:gameId/keys
```

### Update Game
```bash
PATCH /api/v1/developer/games/:gameId
```

### Rotate Keys
```bash
POST /api/v1/developer/games/:gameId/keys/rotate
```

### Initialize SDK
```javascript
const lyvely = new LyvelySDK({ gameId, apiKey });
await lyvely.ready();
```

### Start Session
```javascript
await lyvely.startSession();
```

### Submit Score
```javascript
await lyvely.submitScore(score);
```

### End Session
```javascript
await lyvely.endSession(score);
```

---

**Welcome to Lyvely! 🎮**

You're now ready to integrate your game with the platform. Happy coding!

**Last Updated:** 2024-11-07
