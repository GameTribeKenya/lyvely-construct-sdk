/**
 * Lyvely Game SDK
 *
 * JavaScript SDK for integrating HTML5 games (Construct 3, Phaser, etc.) with the Lyvely platform.
 *
 * @example
 * ```javascript
 * // Initialize the SDK
 * const lyvely = new LyvelySDK({
 *   gameId: 'game_abc123',
 *   apiKey: 'pk_live_xyz789'
 * });
 *
 * // Wait for SDK to be ready
 * await lyvely.ready();
 *
 * // Start a game session
 * await lyvely.startSession('user_123');
 *
 * // Submit score
 * const result = await lyvely.submitScore(1500);
 * console.log('Rank:', result.rank);
 *
 * // End session
 * await lyvely.endSession(1500);
 *
 * // Get leaderboard
 * const leaderboard = await lyvely.getLeaderboard({ period: 'daily', limit: 100 });
 * ```
 *
 * @packageDocumentation
 */

export { LyvelySDK } from './lyvely-sdk';
export type {
  SDKConfig,
  Session,
  UserStats,
  ScoreMetadata,
  ScoreResponse,
  SessionEndResponse,
  LeaderboardEntry,
  LeaderboardOptions,
  LeaderboardResponse,
  SDKEventType,
  EventCallback
} from './types';

export { SDKError, SDKErrorType } from './types';

// Default export for UMD build
export { LyvelySDK as default } from './lyvely-sdk';
