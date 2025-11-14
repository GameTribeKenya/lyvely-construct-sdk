# Backend API - Quick Reference

## Authentication
```
X-API-Key: pk_live_xyz789          # Publishable key
Authorization: Bearer <jwt_token>   # Session token (after starting session)
```
---

## Admin Portal Endpoints

### 🔧 Register/Add New Game
```http
POST /api/v1/developer/games
Authorization: Bearer <developer_token>
Content-Type: application/json

{
  "title": "My Awesome Game",
  "description": "A fun puzzle game",
  "category": "puzzle",
  "allowedDomains": ["localhost:3000", "gametribe.co.ke, gametribe.com"]
}
```
**Response:**
```json
{
  "game": {
    "id": "game_abc123",
    "title": "My Awesome Game",
    "slug": "my-awesome-game",
    "status": "draft"
  },
  "apiKeys": {
    "publishable": {
      "test": "pk_test_xyz789",
      "live": "pk_live_xyz789"
    },
    "secret": {
      "test": "sk_test_secret123",
      "live": "sk_live_secret456"
    }
  }
}
```

---
## Essential Endpoints (MVP)

### 1️⃣ Validate Game
```http
GET /api/v1/games/:gameId
X-API-Key: pk_live_xyz789
```
**Response:** Game info (title, config, stats)

---

### 2️⃣ Start Session
```http
POST /api/v1/sessions
X-API-Key: pk_live_xyz789
Content-Type: application/json

{
  "userId": "user_456",
  "metadata": {}
}
```
**Response:**
```json
{
  "sessionId": "sess_789",
  "token": "eyJhbG...",
  "expiresAt": "2024-11-07T10:35:00Z",
  "user": {
    "highScore": 1200,
    "highScoreRank": 58,
    "totalPlays": 25,
    "lastPlayedAt": "2024-11-06T15:30:00Z"
  }
}
```

---

### 3️⃣ Keep Alive (Heartbeat)
```http
POST /api/v1/sessions/:sessionId/heartbeat
X-API-Key: pk_live_xyz789
Authorization: Bearer <token>

{
  "timestamp": "2024-11-07T10:31:00Z"
}
```
**Response:**
```json
{
  "active": true,
  "expiresAt": "2024-11-07T10:36:00Z"
}
```
**Frequency:** Every 60 seconds

---

### 4️⃣ Submit Score
```http
POST /api/v1/sessions/:sessionId/score
X-API-Key: pk_live_xyz789
Authorization: Bearer <token>

{
  "score": 1500,
  "metadata": {
    "level": 5,
    "duration": 180
  }
}
```
**Response:**
```json
{
  "currentRank": 42,
  "isNewHighScore": true,
  "personalBest": 1500
}
```

---

### 5️⃣ End Session
```http
POST /api/v1/sessions/:sessionId/end
X-API-Key: pk_live_xyz789
Authorization: Bearer <token>

{
  "finalScore": 1500,
  "completed": true
}
```
**Response:**
```json
{
  "rank": 42,
  "personalBest": 1500,
  "isNewRecord": true
}
```

---

### 6️⃣ Get Leaderboard
```http
GET /api/v1/leaderboards/:gameId?period=daily&limit=10
X-API-Key: pk_live_xyz789
```
**Response:**
```json
{
  "entries": [
    {
      "rank": 1,
      "username": "ProGamer",
      "score": 5000
    }
  ],
  "userEntry": {
    "rank": 42,
    "score": 1500
  }
}
```

---

