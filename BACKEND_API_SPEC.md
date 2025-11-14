# Lyvely Platform - Backend API Specification

Complete API specification for the Lyvely platform backend to support the Game SDK.

## Table of Contents

1. [Authentication](#authentication)
2. [Game Management APIs](#game-management-apis)
3. [Session APIs](#session-apis)
4. [Score APIs](#score-apis)
5. [Leaderboard APIs](#leaderboard-apis)
6. [User APIs](#user-apis)
7. [Error Responses](#error-responses)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### API Key Types

**Publishable Keys** (Client-safe)
- Format: `pk_test_*` or `pk_live_*`
- Used in: Game clients (browser, mobile)
- Permissions: Read public data, create sessions, submit scores
- Security: Domain-locked, rate-limited

**Secret Keys** (Server-only)
- Format: `sk_test_*` or `sk_live_*`
- Used in: Developer dashboards, server-side operations
- Permissions: Full access to game data
- Security: IP-locked (optional), never exposed to clients

### Authentication Headers

```
X-API-Key: pk_live_abc123xyz789
Authorization: Bearer <jwt_session_token>
```

---

## Developer Portal APIs

These endpoints are used by game developers to register games, manage API keys, and view analytics. Authentication requires a developer account token.

### 0. Register New Game

Creates a new game and generates API keys for the developer.

**Endpoint:** `POST /api/v1/developer/games`

**Authentication:** Bearer token (developer account)

**Request Headers:**
```
Authorization: Bearer <developer_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My Awesome Game",
  "description": "A fun and challenging puzzle game",
  "category": "puzzle",
  "allowedDomains": [
    "localhost:3000",
    "localhost:8080",
    "mygame.com",
    "www.mygame.com"
  ],
  "gameUrl": "https://mygame.com/play",
  "thumbnailUrl": "https://mygame.com/assets/thumbnail.jpg",
  "videoPreviewUrl": "https://mygame.com/assets/preview.mp4",
  "config": {
    "scoringType": "higher_is_better",
    "maxScore": null,
    "allowAnonymous": true
  }
}
```

**Field Descriptions:**
- `title` (required): Game title
- `description` (required): Game description
- `category` (required): Game category (puzzle, action, strategy, etc.)
- `allowedDomains` (required): Array of domains where game can be played
- `gameUrl` (optional): URL where the game is hosted
- `thumbnailUrl` (optional): Game thumbnail image
- `videoPreviewUrl` (optional): Game preview video
- `config` (optional): Game-specific configuration

**Response (201 Created):**
```json
{
  "game": {
    "id": "game_abc123",
    "developerId": "dev_456",
    "title": "My Awesome Game",
    "slug": "my-awesome-game",
    "description": "A fun and challenging puzzle game",
    "category": "puzzle",
    "status": "draft",
    "gameUrl": "https://mygame.com/play",
    "thumbnailUrl": "https://mygame.com/assets/thumbnail.jpg",
    "videoPreviewUrl": "https://mygame.com/assets/preview.mp4",
    "createdAt": "2024-11-07T10:00:00Z",
    "updatedAt": "2024-11-07T10:00:00Z"
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

**Important Notes:**
- Secret keys are **only shown once** during creation
- Both test and live keys are generated automatically
- Game starts in `draft` status (not visible in feed)
- `localhost` domains are automatically allowed for test keys

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid developer token
- `409 Conflict` - Game with same slug already exists

---

### 0.1. Update Game

Updates game information and configuration.

**Endpoint:** `PATCH /api/v1/developer/games/:gameId`

**Authentication:** Secret Key (Authorization: Bearer sk_*)

**Request Body:**
```json
{
  "title": "Updated Game Title",
  "description": "New description",
  "allowedDomains": ["mygame.com", "www.mygame.com", "newdomain.com"],
  "status": "published",
  "config": {
    "scoringType": "lower_is_better"
  }
}
```

**Response (200 OK):**
```json
{
  "game": {
    "id": "game_abc123",
    "title": "Updated Game Title",
    "status": "published",
    "updatedAt": "2024-11-07T11:00:00Z"
  }
}
```

---

### 0.2. Get API Keys

Retrieves API keys for a game (secret keys are masked).

**Endpoint:** `GET /api/v1/developer/games/:gameId/keys`

**Authentication:** Secret Key (Authorization: Bearer sk_*)

**Response (200 OK):**
```json
{
  "gameId": "game_abc123",
  "keys": [
    {
      "id": "key_123",
      "type": "publishable",
      "environment": "test",
      "key": "pk_test_abc123xyz789",
      "status": "active",
      "createdAt": "2024-11-07T10:00:00Z"
    },
    {
      "id": "key_124",
      "type": "publishable",
      "environment": "live",
      "key": "pk_live_abc123xyz789",
      "status": "active",
      "createdAt": "2024-11-07T10:00:00Z"
    },
    {
      "id": "key_125",
      "type": "secret",
      "environment": "test",
      "key": "sk_test_***************",
      "status": "active",
      "createdAt": "2024-11-07T10:00:00Z"
    },
    {
      "id": "key_126",
      "type": "secret",
      "environment": "live",
      "key": "sk_live_***************",
      "status": "active",
      "createdAt": "2024-11-07T10:00:00Z"
    }
  ]
}
```

---

### 0.3. Rotate API Keys

Generates new API keys and revokes old ones.

**Endpoint:** `POST /api/v1/developer/games/:gameId/keys/rotate`

**Authentication:** Secret Key (Authorization: Bearer sk_*)

**Request Body:**
```json
{
  "keyType": "publishable",
  "environment": "live",
  "reason": "Key compromised"
}
```

**Response (200 OK):**
```json
{
  "oldKey": {
    "key": "pk_live_old123",
    "status": "revoked",
    "revokedAt": "2024-11-07T11:00:00Z"
  },
  "newKey": {
    "key": "pk_live_new456",
    "status": "active",
    "createdAt": "2024-11-07T11:00:00Z"
  },
  "message": "API key rotated successfully. Update your game code with the new key."
}
```

---

### 0.4. Delete Game

Deletes a game and all associated data.

**Endpoint:** `DELETE /api/v1/developer/games/:gameId`

**Authentication:** Secret Key (Authorization: Bearer sk_*)

**Request Body:**
```json
{
  "confirmation": "DELETE"
}
```

**Response (200 OK):**
```json
{
  "message": "Game and all associated data deleted successfully",
  "deletedAt": "2024-11-07T11:00:00Z"
}
```

**Warning:** This action is **irreversible** and will delete:
- Game record
- All API keys
- All sessions
- All scores
- All leaderboard data

---

## Game Management APIs

### 1. Get Game Info

Validates that a game exists and is active. Used by SDK during initialization (optional but recommended).

**Purpose:** Allows SDK to fail fast if game is invalid, and to cache game configuration.

**Endpoint:** `GET /api/v1/games/:gameId`

**Authentication:** Publishable Key (X-API-Key)

**Path Parameters:**
```
gameId: string (required) - The unique game identifier
```

**Note:** This is an **optional optimization** - the backend will also validate the game when creating a session. However, calling this during SDK init provides better developer experience (early error detection).

**Request Example:**
```http
GET /api/v1/games/game_abc123 HTTP/1.1
Host: api.lyvely.com
X-API-Key: pk_live_xyz789
```

**Response (200 OK):**
```json
{
  "id": "game_abc123",
  "title": "Super Puzzle Adventure",
  "slug": "super-puzzle-adventure",
  "description": "An exciting puzzle game",
  "category": "puzzle",
  "thumbnailUrl": "https://cdn.lyvely.com/games/abc123/thumb.jpg",
  "videoPreviewUrl": "https://cdn.lyvely.com/games/abc123/preview.mp4",
  "gameUrl": "https://games.lyvely.com/super-puzzle-adventure",
  "status": "published",
  "createdAt": "2024-11-01T10:00:00Z",
  "updatedAt": "2024-11-05T15:30:00Z",
  "stats": {
    "totalPlays": 125000,
    "totalPlayers": 45000,
    "averageScore": 1250,
    "averagePlayTime": 180
  },
  "config": {
    "scoringType": "higher_is_better",
    "maxScore": null,
    "allowAnonymous": true
  }
}
```

**Error Responses:**
- `404 Not Found` - Game does not exist
- `403 Forbidden` - Game is not published or API key invalid

---

## Session APIs

### 2. Start Session

Creates a new game session for a user.

**Endpoint:** `POST /api/v1/sessions`

**Authentication:** Publishable Key (X-API-Key)

**Validation (Backend Must Perform):**
1. Validate API key exists and is active
2. Extract gameId from API key
3. Validate game exists and is published
4. Validate request origin matches game's allowed domains
5. If all valid, create session

**Request Headers:**
```
X-API-Key: pk_live_xyz789
Content-Type: application/json
Origin: https://yourgame.com (for CORS validation)
```

**Request Body:**
```json
{
  "userId": "user_456",
  "gameId": "game_abc123",
  "metadata": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "gameVersion": "1.2.0",
    "platform": "web",
    "deviceType": "desktop",
    "referrer": "https://lyvely.com/feed",
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

**Field Descriptions:**
- `userId` (required): User identifier (can be anonymous ID generated by SDK)
- `gameId` (optional): Game ID (can be inferred from API key)
- `metadata` (optional): Additional context about the session

**Response (201 Created):**
```json
{
  "sessionId": "sess_789abc",
  "gameId": "game_abc123",
  "userId": "user_456",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

**Field Descriptions:**
- `sessionId`: Unique session identifier
- `token`: JWT token for subsequent requests (valid for session duration)
- `startedAt`: UTC timestamp when session started
- `expiresAt`: UTC timestamp when session will expire (5 minutes from start)
- `heartbeatInterval`: Recommended heartbeat interval in milliseconds
- `status`: Session status (always "active" on creation)
- `user`: User's historical stats for this game
  - `highScore`: User's personal best score (0 if first time playing)
  - `highScoreRank`: Rank of user's high score on leaderboard (null if no score)
  - `totalPlays`: Total number of times user has played this game
  - `lastPlayedAt`: Timestamp of last session (null if first time)

**JWT Token Payload:**
```json
{
  "sessionId": "sess_789abc",
  "gameId": "game_abc123",
  "userId": "user_456",
  "iat": 1699354200,
  "exp": 1699357800,
  "iss": "lyvely.com"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `403 Forbidden` - Domain not allowed or API key invalid
- `429 Too Many Requests` - Rate limit exceeded
- `503 Service Unavailable` - Server cannot create session

---

### 3. Send Heartbeat

Keeps a session alive by extending the expiration time.

**Endpoint:** `POST /api/v1/sessions/:sessionId/heartbeat`

**Authentication:** Session Token (Authorization header)

**Path Parameters:**
```
sessionId: string (required) - The session identifier
```

**Request Headers:**
```
X-API-Key: pk_live_xyz789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "timestamp": "2024-11-07T10:31:00Z"
}
```

**Response (200 OK):**
```json
{
  "sessionId": "sess_789abc",
  "active": true,
  "expiresAt": "2024-11-07T10:36:00Z",
  "lastHeartbeatAt": "2024-11-07T10:31:00Z"
}
```

**Field Descriptions:**
- `active`: Whether session is still active
- `expiresAt`: Updated expiration time (5 minutes from heartbeat)
- `lastHeartbeatAt`: Timestamp of this heartbeat

**Error Responses:**
- `404 Not Found` - Session does not exist or has expired
- `410 Gone` - Session has been ended
- `401 Unauthorized` - Invalid or expired token

---

### 4. End Session

Explicitly ends a game session.

**Endpoint:** `POST /api/v1/sessions/:sessionId/end`

**Authentication:** Session Token (Authorization header)

**Path Parameters:**
```
sessionId: string (required) - The session identifier
```

**Request Headers:**
```
X-API-Key: pk_live_xyz789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "finalScore": 1500,
  "completed": true,
  "duration": 145,
  "metadata": {
    "level": 5,
    "coinsCollected": 150,
    "deaths": 3,
    "achievements": ["first_win", "speed_demon"]
  }
}
```

**Field Descriptions:**
- `finalScore` (optional): Final score for the session
- `completed` (required): Whether game was completed (true) or abandoned (false)
- `duration` (optional): Game duration in seconds
- `metadata` (optional): Additional game-specific data

**Response (200 OK):**
```json
{
  "sessionId": "sess_789abc",
  "finalScore": 1500,
  "duration": 145,
  "rank": 42,
  "totalPlayers": 1523,
  "personalBest": 1500,
  "previousBest": 1200,
  "isNewRecord": true,
  "percentile": 97.2,
  "achievements": ["first_win"],
  "endedAt": "2024-11-07T10:32:25Z"
}
```

**Field Descriptions:**
- `rank`: Player's rank on the global leaderboard (1 = best)
- `totalPlayers`: Total number of players who have played this game
- `personalBest`: Player's all-time best score
- `previousBest`: Player's previous best score
- `isNewRecord`: Whether this is a new personal best
- `percentile`: Player's percentile ranking (0-100)
- `achievements`: Any achievements unlocked in this session

**Error Responses:**
- `404 Not Found` - Session does not exist
- `401 Unauthorized` - Invalid or expired token
- `400 Bad Request` - Invalid request body

---

## Score APIs

### 5. Submit Score

Updates the score for an active session. Can be called multiple times during gameplay.

**Endpoint:** `POST /api/v1/sessions/:sessionId/score`

**Authentication:** Session Token (Authorization header)

**Path Parameters:**
```
sessionId: string (required) - The session identifier
```

**Request Headers:**
```
X-API-Key: pk_live_xyz789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "score": 1500,
  "metadata": {
    "level": 5,
    "duration": 180,
    "achievements": ["speed_demon"],
    "combo": 50,
    "timestamp": "2024-11-07T10:32:00Z",
    "signature": "hmac_sha256_signature_here"
  }
}
```

**Field Descriptions:**
- `score` (required): The current score (must be a number)
- `metadata` (optional): Additional context about the score
  - `level`: Current game level
  - `duration`: Time played in seconds
  - `achievements`: Achievements unlocked
  - `signature`: HMAC signature for score validation (optional)
  - `timestamp`: When score was achieved
  - Any custom game-specific fields

**Response (200 OK):**
```json
{
  "scoreId": "score_xyz123",
  "sessionId": "sess_789abc",
  "score": 1500,
  "currentRank": 42,
  "previousRank": 58,
  "totalPlayers": 1523,
  "isNewHighScore": true,
  "personalBest": 1500,
  "previousBest": 1200,
  "percentile": 97.2,
  "submittedAt": "2024-11-07T10:32:00Z"
}
```

**Field Descriptions:**
- `scoreId`: Unique identifier for this score submission
- `currentRank`: Player's current rank after this submission
- `previousRank`: Player's rank before this submission
- `isNewHighScore`: Whether this beats the player's personal best
- `percentile`: Player's percentile ranking

**Error Responses:**
- `404 Not Found` - Session does not exist or has expired
- `401 Unauthorized` - Invalid or expired token
- `400 Bad Request` - Invalid score (e.g., negative, not a number)
- `422 Unprocessable Entity` - Score validation failed (suspicious pattern)
- `429 Too Many Requests` - Too many score submissions (rate limited)

---

## Leaderboard APIs

### 6. Get Leaderboard

Retrieves the leaderboard for a game.

**Endpoint:** `GET /api/v1/leaderboards/:gameId`

**Authentication:** Publishable Key (X-API-Key) or None (public endpoint)

**Path Parameters:**
```
gameId: string (required) - The game identifier
```

**Query Parameters:**
```
period: string (optional) - Time period: "daily", "weekly", "all" (default: "all")
limit: number (optional) - Number of entries to return (default: 100, max: 1000)
offset: number (optional) - Pagination offset (default: 0)
userId: string (optional) - If provided, includes user's entry even if not in top results
```

**Request Example:**
```http
GET /api/v1/leaderboards/game_abc123?period=daily&limit=10&offset=0 HTTP/1.1
Host: api.lyvely.com
X-API-Key: pk_live_xyz789
```

**Response (200 OK):**
```json
{
  "gameId": "game_abc123",
  "period": "daily",
  "updatedAt": "2024-11-07T10:35:00Z",
  "totalEntries": 1523,
  "entries": [
    {
      "rank": 1,
      "userId": "user_123",
      "username": "ProGamer42",
      "displayName": "ProGamer42",
      "avatarUrl": "https://cdn.lyvely.com/avatars/user_123.jpg",
      "score": 5000,
      "duration": 120,
      "level": 10,
      "achievedAt": "2024-11-07T08:15:30Z",
      "isCurrentUser": false
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "speedrunner",
      "displayName": "speedrunner",
      "avatarUrl": "https://cdn.lyvely.com/avatars/user_456.jpg",
      "score": 4800,
      "duration": 95,
      "level": 10,
      "achievedAt": "2024-11-07T09:22:15Z",
      "isCurrentUser": false
    }
    // ... more entries
  ],
  "userEntry": {
    "rank": 42,
    "score": 1500,
    "percentile": 97.2,
    "achievedAt": "2024-11-07T10:32:25Z"
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true,
    "total": 1523
  }
}
```

**Field Descriptions:**
- `gameId`: The game identifier
- `period`: Time period for this leaderboard
- `updatedAt`: When leaderboard was last calculated
- `totalEntries`: Total number of players on this leaderboard
- `entries[]`: Array of leaderboard entries
  - `rank`: Player's rank (1 = best)
  - `userId`: User identifier
  - `username`: Display username
  - `avatarUrl`: User's avatar image URL
  - `score`: Player's score
  - `duration`: Game duration in seconds
  - `level`: Highest level reached
  - `achievedAt`: When this score was achieved
  - `isCurrentUser`: Whether this is the requesting user
- `userEntry`: Current user's entry (if authenticated and userId provided)
- `pagination`: Pagination information

**Error Responses:**
- `404 Not Found` - Game does not exist
- `400 Bad Request` - Invalid query parameters

---

### 7. Get User Leaderboard Position

Gets a specific user's position on the leaderboard with nearby players.

**Endpoint:** `GET /api/v1/leaderboards/:gameId/users/:userId`

**Authentication:** Publishable Key (X-API-Key)

**Path Parameters:**
```
gameId: string (required) - The game identifier
userId: string (required) - The user identifier
```

**Query Parameters:**
```
period: string (optional) - Time period: "daily", "weekly", "all" (default: "all")
context: number (optional) - Number of players to show above/below (default: 5)
```

**Request Example:**
```http
GET /api/v1/leaderboards/game_abc123/users/user_456?period=daily&context=5 HTTP/1.1
Host: api.lyvely.com
X-API-Key: pk_live_xyz789
```

**Response (200 OK):**
```json
{
  "gameId": "game_abc123",
  "userId": "user_456",
  "period": "daily",
  "userRank": 42,
  "userScore": 1500,
  "totalPlayers": 1523,
  "percentile": 97.2,
  "achievedAt": "2024-11-07T10:32:25Z",
  "nearby": [
    {
      "rank": 37,
      "userId": "user_789",
      "username": "player789",
      "score": 1650,
      "achievedAt": "2024-11-07T09:15:00Z"
    },
    // ... 4 more above
    {
      "rank": 42,
      "userId": "user_456",
      "username": "you",
      "score": 1500,
      "achievedAt": "2024-11-07T10:32:25Z",
      "isCurrentUser": true
    },
    // ... 5 below
    {
      "rank": 47,
      "userId": "user_999",
      "username": "newbie",
      "score": 1420,
      "achievedAt": "2024-11-07T10:10:00Z"
    }
  ]
}
```

**Field Descriptions:**
- `userRank`: User's current rank
- `userScore`: User's best score for this period
- `totalPlayers`: Total players on leaderboard
- `percentile`: User's percentile (0-100, higher is better)
- `nearby[]`: Players ranked near the user (5 above, user, 5 below)

**Error Responses:**
- `404 Not Found` - Game or user does not exist, or user has no scores

---

## User APIs

### 8. Get User Stats

Retrieves statistics for a user across all games or a specific game.

**Endpoint:** `GET /api/v1/users/:userId/stats`

**Authentication:** Publishable Key (X-API-Key)

**Path Parameters:**
```
userId: string (required) - The user identifier
```

**Query Parameters:**
```
gameId: string (optional) - Filter stats for specific game
```

**Request Example:**
```http
GET /api/v1/users/user_456/stats?gameId=game_abc123 HTTP/1.1
Host: api.lyvely.com
X-API-Key: pk_live_xyz789
```

**Response (200 OK):**
```json
{
  "userId": "user_456",
  "username": "player456",
  "gameId": "game_abc123",
  "totalGamesPlayed": 150,
  "totalPlayTime": 7200,
  "averageScore": 1250,
  "bestScore": 1500,
  "bestRank": 42,
  "totalAchievements": 15,
  "firstPlayedAt": "2024-10-15T08:00:00Z",
  "lastPlayedAt": "2024-11-07T10:32:25Z",
  "recentSessions": [
    {
      "sessionId": "sess_789abc",
      "score": 1500,
      "rank": 42,
      "duration": 145,
      "playedAt": "2024-11-07T10:32:25Z"
    }
    // ... more recent sessions
  ],
  "achievements": [
    {
      "id": "first_win",
      "name": "First Victory",
      "unlockedAt": "2024-10-15T09:30:00Z"
    }
    // ... more achievements
  ]
}
```

**Error Responses:**
- `404 Not Found` - User does not exist

---

## Error Responses

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context",
      "reason": "More details about the error"
    },
    "requestId": "req_abc123xyz",
    "timestamp": "2024-11-07T10:35:00Z"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `BAD_REQUEST` | Invalid request format or parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Valid auth but insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist |
| 410 | `GONE` | Resource existed but is no longer available |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

### Example Error Response

```json
{
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "The session has expired due to inactivity",
    "details": {
      "sessionId": "sess_789abc",
      "expiredAt": "2024-11-07T10:35:00Z",
      "reason": "No heartbeat received for 5 minutes"
    },
    "requestId": "req_abc123xyz",
    "timestamp": "2024-11-07T10:36:00Z"
  }
}
```

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699354800
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/v1/sessions` | 10 requests | per minute |
| `POST /api/v1/sessions/:id/heartbeat` | 120 requests | per hour |
| `POST /api/v1/sessions/:id/score` | 60 requests | per minute |
| `POST /api/v1/sessions/:id/end` | 10 requests | per minute |
| `GET /api/v1/leaderboards/:gameId` | 100 requests | per minute |
| `GET /api/v1/games/:gameId` | 100 requests | per minute |

### Rate Limit Response (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 10,
      "remaining": 0,
      "resetAt": "2024-11-07T10:36:00Z",
      "retryAfter": 60
    },
    "requestId": "req_abc123xyz",
    "timestamp": "2024-11-07T10:35:00Z"
  }
}
```

---

## CORS Configuration

The API must support CORS for browser-based games:

```
Access-Control-Allow-Origin: <allowed-domain>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Credentials: true
```

### Domain Validation

- Check `Origin` header against game's allowed domains list
- Reject requests from unauthorized domains with 403
- Support localhost for development (if game is in test mode)

---

## Webhook Events (Optional)

If game developers configure webhooks, send these events:

### Session Events

**`session.started`**
```json
{
  "event": "session.started",
  "gameId": "game_abc123",
  "data": {
    "sessionId": "sess_789abc",
    "userId": "user_456",
    "startedAt": "2024-11-07T10:30:00Z"
  }
}
```

**`session.ended`**
```json
{
  "event": "session.ended",
  "gameId": "game_abc123",
  "data": {
    "sessionId": "sess_789abc",
    "userId": "user_456",
    "finalScore": 1500,
    "duration": 145,
    "rank": 42,
    "endedAt": "2024-11-07T10:32:25Z"
  }
}
```

**`session.expired`**
```json
{
  "event": "session.expired",
  "gameId": "game_abc123",
  "data": {
    "sessionId": "sess_789abc",
    "userId": "user_456",
    "lastHeartbeatAt": "2024-11-07T10:31:00Z",
    "expiredAt": "2024-11-07T10:36:00Z"
  }
}
```

### Score Events

**`score.submitted`**
```json
{
  "event": "score.submitted",
  "gameId": "game_abc123",
  "data": {
    "scoreId": "score_xyz123",
    "sessionId": "sess_789abc",
    "userId": "user_456",
    "score": 1500,
    "rank": 42,
    "isNewHighScore": true,
    "submittedAt": "2024-11-07T10:32:00Z"
  }
}
```

**`leaderboard.updated`**
```json
{
  "event": "leaderboard.updated",
  "gameId": "game_abc123",
  "data": {
    "period": "daily",
    "updatedAt": "2024-11-07T10:35:00Z",
    "topScore": 5000,
    "totalPlayers": 1523
  }
}
```

### Webhook Signature

Include HMAC signature in header:
```
X-Lyvely-Signature: sha256=abc123...
```

Calculate: `HMAC_SHA256(webhook_secret, request_body)`

---

## Testing Endpoints

For development and testing, provide these endpoints:

### Reset Test Data

**Endpoint:** `DELETE /api/v1/test/games/:gameId/data`

**Authentication:** Secret Key (sk_test_*)

Deletes all sessions, scores, and leaderboards for a test game.

### Create Test Users

**Endpoint:** `POST /api/v1/test/users`

**Authentication:** Secret Key (sk_test_*)

Creates fake users for testing leaderboards.

---

## Backend Logic Requirements

### User Stats Management

The backend must maintain `user_game_stats` table to track each user's performance per game:

**When Starting a Session (`POST /api/v1/sessions`):**
```sql
-- Fetch user's stats for this game
SELECT high_score, high_score_rank, total_plays, last_played_at
FROM user_game_stats
WHERE user_id = ? AND game_id = ?

-- If no record exists, return defaults:
-- highScore: 0, highScoreRank: null, totalPlays: 0, lastPlayedAt: null
```

**When Ending a Session (`POST /api/v1/sessions/:id/end`):**
```sql
-- Update or insert user stats
INSERT INTO user_game_stats (user_id, game_id, high_score, total_plays, last_played_at, first_played_at)
VALUES (?, ?, ?, 1, NOW(), NOW())
ON CONFLICT (user_id, game_id) DO UPDATE SET
  high_score = GREATEST(user_game_stats.high_score, EXCLUDED.high_score),
  total_plays = user_game_stats.total_plays + 1,
  total_play_time = user_game_stats.total_play_time + ?,
  last_played_at = NOW(),
  updated_at = NOW()
```

**When Calculating Leaderboard Ranks:**
```sql
-- Update high_score_rank in user_game_stats
WITH ranked_scores AS (
  SELECT user_id,
         ROW_NUMBER() OVER (ORDER BY high_score DESC) as rank
  FROM user_game_stats
  WHERE game_id = ?
)
UPDATE user_game_stats
SET high_score_rank = ranked_scores.rank
FROM ranked_scores
WHERE user_game_stats.user_id = ranked_scores.user_id
  AND user_game_stats.game_id = ?
```

---

## Summary

### Developer Portal Endpoints (Required for Onboarding)

0. ✅ `POST /api/v1/developer/games` - Register new game (returns API keys)
1. ✅ `PATCH /api/v1/developer/games/:id` - Update game settings
2. ✅ `GET /api/v1/developer/games/:id/keys` - View API keys
3. ✅ `POST /api/v1/developer/games/:id/keys/rotate` - Rotate compromised keys
4. ✅ `DELETE /api/v1/developer/games/:id` - Delete game

### Game SDK Endpoints (Required for MVP)

5. ✅ `GET /api/v1/games/:gameId` - Validate game (optional)
6. ✅ `POST /api/v1/sessions` - Start session (includes user's high score)
7. ✅ `POST /api/v1/sessions/:id/heartbeat` - Keep alive
8. ✅ `POST /api/v1/sessions/:id/score` - Submit score
9. ✅ `POST /api/v1/sessions/:id/end` - End session (updates user stats)
10. ✅ `GET /api/v1/leaderboards/:gameId` - Get leaderboard

### Optional Endpoints for v1.1

11. ⭕ `GET /api/v1/leaderboards/:gameId/users/:userId` - User position
12. ⭕ `GET /api/v1/users/:userId/stats` - User statistics
13. ⭕ `GET /api/v1/developer/games/:id/analytics` - Game analytics
14. ⭕ Webhook delivery system

### Backend Implementation Checklist

- [ ] API Gateway with rate limiting
- [ ] Authentication middleware (API key + JWT)
- [ ] CORS configuration with domain validation
- [ ] Session management service with TTL
- [ ] Background job for session timeouts
- [ ] Score validation and storage
- [ ] Leaderboard calculation (Redis sorted sets recommended)
- [ ] Background job for leaderboard updates
- [ ] Webhook delivery system (optional)
- [ ] Error logging and monitoring
- [ ] Analytics tracking

---

**API Version:** 1.0
**Last Updated:** 2024-11-07
**Base URL:** `https://api.lyvely.com`
