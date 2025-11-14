# Changelog

All notable changes to the Lyvely Game SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-07

### Added
- Initial release of Lyvely Game SDK
- Core SDK initialization with configuration
- Session management (start, heartbeat, end)
- Automatic heartbeat every 60 seconds
- Session timeout after 5 minutes of inactivity
- Score submission with metadata support
- Leaderboard fetching (daily, weekly, all-time)
- Event system (ready, sessionStart, sessionEnd, sessionExpired, scoreSubmitted, heartbeat, error)
- HTTP client with automatic retry and exponential backoff
- Error handling with custom error types
- Anonymous user ID generation and persistence
- Page visibility detection (pause heartbeat when tab hidden)
- TypeScript type definitions
- UMD and ES module builds
- Comprehensive documentation and examples

### Features
- Lightweight: ~4.5KB gzipped
- Zero dependencies
- Browser compatible (ES5 target)
- Automatic session cleanup
- Debug logging mode
- Source maps for debugging

### Developer Experience
- Simple initialization
- Promise-based async API
- Event-driven architecture
- Full TypeScript support
- Detailed error messages
- Example HTML integration
