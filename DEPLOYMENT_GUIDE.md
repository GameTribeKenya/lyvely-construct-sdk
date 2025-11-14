# SDK Deployment Guide

Complete guide for deploying the Lyvely Game SDK to production.

---

## Deployment Channels

The SDK is distributed through three channels:

1. **CDN** (Cloudflare) - Primary, easiest for developers
2. **NPM** - For modern JavaScript workflows
3. **GitHub Releases** - For self-hosting

---

## Pre-Deployment Checklist

Before deploying a new version:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated
- [ ] README.md updated if needed
- [ ] Breaking changes documented
- [ ] Bundle size checked (<10KB gzipped)
- [ ] Browser compatibility tested

---

## Step 1: Prepare Release

### Update Version

```bash
# Update version in package.json
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

### Update CHANGELOG.md

```markdown
## [0.2.0] - 2024-11-10

### Added
- New feature X
- Support for Y

### Fixed
- Bug in Z

### Breaking Changes
- Changed API for method A
```

### Build for Production

```bash
# Clean previous builds
rm -rf dist/

# Build
npm run build

# Verify build
ls -lh dist/
```

### Test Built Files

```bash
# Check file sizes
du -h dist/*.js | sort -h

# Check gzipped size (should be <10KB)
gzip -c dist/lyvely-game-sdk.js | wc -c | awk '{print $1/1024 " KB"}'

# Test in browser
# Open examples/basic-example.html and verify it works
```

---

## Step 2: Deploy to CDN (Cloudflare)

### Option A: Manual Upload

```bash
# Upload to Cloudflare R2 or S3-compatible storage

# Install AWS CLI (works with Cloudflare R2)
brew install awscli

# Configure (get credentials from Cloudflare dashboard)
aws configure --profile cloudflare

# Upload latest version
aws s3 cp dist/lyvely-game-sdk.js \
  s3://lyvely-cdn/sdk/v0.2.0/lyvely-game-sdk.js \
  --profile cloudflare \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000"

aws s3 cp dist/lyvely-game-sdk.js \
  s3://lyvely-cdn/sdk/lyvely-game-sdk.js \
  --profile cloudflare \
  --content-type "application/javascript" \
  --cache-control "public, max-age=3600"
```

### Option B: Automated via GitHub Actions

Create `.github/workflows/deploy-cdn.yml`:

```yaml
name: Deploy SDK to CDN

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure AWS CLI
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.CDN_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.CDN_SECRET_KEY }}
          aws-region: auto

      - name: Get version
        id: version
        run: echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Upload to CDN (versioned)
        run: |
          aws s3 cp dist/lyvely-game-sdk.js \
            s3://lyvely-cdn/sdk/v${{ steps.version.outputs.VERSION }}/lyvely-game-sdk.js \
            --endpoint-url ${{ secrets.CDN_ENDPOINT }} \
            --content-type "application/javascript" \
            --cache-control "public, max-age=31536000, immutable"

          aws s3 cp dist/lyvely-game-sdk.esm.js \
            s3://lyvely-cdn/sdk/v${{ steps.version.outputs.VERSION }}/lyvely-game-sdk.esm.js \
            --endpoint-url ${{ secrets.CDN_ENDPOINT }} \
            --content-type "application/javascript" \
            --cache-control "public, max-age=31536000, immutable"

      - name: Upload to CDN (latest)
        run: |
          aws s3 cp dist/lyvely-game-sdk.js \
            s3://lyvely-cdn/sdk/lyvely-game-sdk.js \
            --endpoint-url ${{ secrets.CDN_ENDPOINT }} \
            --content-type "application/javascript" \
            --cache-control "public, max-age=3600"

          aws s3 cp dist/lyvely-game-sdk.esm.js \
            s3://lyvely-cdn/sdk/lyvely-game-sdk.esm.js \
            --endpoint-url ${{ secrets.CDN_ENDPOINT }} \
            --content-type "application/javascript" \
            --cache-control "public, max-age=3600"
```

### CDN File Structure

```
https://cdn.lyvely.com/sdk/
├── lyvely-game-sdk.js              # Latest (1 hour cache)
├── lyvely-game-sdk.esm.js          # Latest ESM
├── v0.1.0/
│   ├── lyvely-game-sdk.js          # Immutable (1 year cache)
│   └── lyvely-game-sdk.esm.js
├── v0.2.0/
│   ├── lyvely-game-sdk.js
│   └── lyvely-game-sdk.esm.js
└── integrity.json                  # SRI hashes
```

### Generate SRI Hashes

```bash
# Generate integrity hashes for security
openssl dgst -sha384 -binary dist/lyvely-game-sdk.js | openssl base64 -A

# Output example:
# sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC

# Create integrity.json
cat > dist/integrity.json << 'EOF'
{
  "v0.2.0": {
    "lyvely-game-sdk.js": "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC",
    "lyvely-game-sdk.esm.js": "sha384-..."
  }
}
EOF
```

---

## Step 3: Deploy to NPM

### Prerequisites

```bash
# Login to NPM (one-time)
npm login

# Verify you're logged in
npm whoami
```

### Publish to NPM

```bash
# Dry run (test without publishing)
npm publish --dry-run

# Publish to NPM
npm publish --access public

# Verify published
npm view @lyvely/game-sdk
```

### Automated NPM Publish

Create `.github/workflows/publish-npm.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Step 4: Create GitHub Release

### Manual Release

```bash
# Tag the release
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# Create GitHub release with CLI
gh release create v0.2.0 \
  dist/lyvely-game-sdk.js \
  dist/lyvely-game-sdk.esm.js \
  dist/index.d.ts \
  --title "v0.2.0" \
  --notes-file CHANGELOG.md
```

### Automated Release

Create `.github/workflows/release.yml`:

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/lyvely-game-sdk.js
            dist/lyvely-game-sdk.esm.js
            dist/index.d.ts
            dist/*.map
          body_path: CHANGELOG.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Step 5: Update Documentation

### Update Docs Site

```bash
# If you have a documentation site
cd docs-site

# Update version references
sed -i '' 's/v0.1.0/v0.2.0/g' src/pages/*.md

# Deploy docs
npm run build
npm run deploy
```

### Update README Badges

```markdown
[![npm version](https://img.shields.io/npm/v/@lyvely/game-sdk.svg)](https://www.npmjs.com/package/@lyvely/game-sdk)
[![CDN](https://img.shields.io/badge/CDN-v0.2.0-blue)](https://cdn.lyvely.com/sdk/lyvely-game-sdk.js)
```

---

## Step 6: Notify Developers

### Email Notification Template

```
Subject: Lyvely Game SDK v0.2.0 Released

Hi Developers,

We've released v0.2.0 of the Lyvely Game SDK with new features and improvements!

What's New:
- Feature X for better performance
- Bug fix for Y
- Improved error messages

Breaking Changes:
- Method A now requires parameter B

Migration Guide:
https://docs.lyvely.com/migration/v0.2.0

CDN (Auto-updated):
https://cdn.lyvely.com/sdk/lyvely-game-sdk.js

CDN (Version-locked):
https://cdn.lyvely.com/sdk/v0.2.0/lyvely-game-sdk.js

NPM:
npm install @lyvely/game-sdk@0.2.0

Full Changelog:
https://github.com/lyvely/lyvely-game-sdk/releases/tag/v0.2.0

Questions? support@lyvely.com

Happy coding!
The Lyvely Team
```

### Discord/Slack Announcement

```
🎉 **SDK Update v0.2.0**

New in this release:
• Feature X
• Bug fix for Y

📦 Get it now:
- CDN: https://cdn.lyvely.com/sdk/v0.2.0/lyvely-game-sdk.js
- NPM: `npm install @lyvely/game-sdk@0.2.0`

📖 Docs: https://docs.lyvely.com
```

---

## Rollback Procedure

If something goes wrong after deployment:

### Rollback CDN

```bash
# Copy previous version to latest
aws s3 cp s3://lyvely-cdn/sdk/v0.1.0/lyvely-game-sdk.js \
  s3://lyvely-cdn/sdk/lyvely-game-sdk.js \
  --profile cloudflare

# Purge CDN cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"files":["https://cdn.lyvely.com/sdk/lyvely-game-sdk.js"]}'
```

### Rollback NPM

```bash
# Deprecate bad version
npm deprecate @lyvely/game-sdk@0.2.0 "This version has a critical bug. Use 0.1.0 instead."

# Publish patched version
npm version patch
npm publish
```

---

## Monitoring Post-Deployment

### CDN Analytics

Check Cloudflare Analytics for:
- Request count
- Bandwidth usage
- Error rates
- Geographic distribution

### NPM Downloads

```bash
npm info @lyvely/game-sdk

# Or use npmjs.com/package/@lyvely/game-sdk
```

### Error Tracking

Monitor for errors from SDK users:
- Sentry/Rollbar integration
- Console error reports
- GitHub issues

---

## Version Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH

0.1.0 → Initial release
0.1.1 → Patch (bug fix)
0.2.0 → Minor (new feature, backward compatible)
1.0.0 → Major (breaking changes)
```

### When to Bump Versions

**Patch (0.1.0 → 0.1.1):**
- Bug fixes
- Performance improvements
- Documentation updates

**Minor (0.1.0 → 0.2.0):**
- New features (backward compatible)
- Deprecations
- New optional parameters

**Major (0.9.0 → 1.0.0):**
- Breaking changes
- Removed deprecated features
- Changed API signatures
- Production-ready release

---

## Security Considerations

### Subresource Integrity (SRI)

Always provide SRI hashes for CDN files:

```html
<script
  src="https://cdn.lyvely.com/sdk/v0.2.0/lyvely-game-sdk.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous">
</script>
```

### CDN Cache Headers

**Versioned URLs** (immutable):
```
Cache-Control: public, max-age=31536000, immutable
```

**Latest URL** (short cache):
```
Cache-Control: public, max-age=3600
```

### HTTPS Only

Always serve SDK over HTTPS:
- CDN configured with TLS 1.2+
- HSTS header enabled
- Mixed content warnings prevented

---

## Complete Deployment Checklist

### Pre-Release
- [ ] Tests passing
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Build generated
- [ ] Bundle size checked
- [ ] Browser tested

### Deployment
- [ ] CDN uploaded (versioned)
- [ ] CDN uploaded (latest)
- [ ] NPM published
- [ ] GitHub release created
- [ ] SRI hashes generated

### Post-Release
- [ ] Documentation updated
- [ ] Developers notified
- [ ] Analytics monitoring
- [ ] Error tracking active
- [ ] Support channels ready

---

## Automation Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Lyvely Game SDK"

# Get version
VERSION=$(node -p "require('./package.json').version")
echo "Version: $VERSION"

# Build
echo "📦 Building..."
npm run build

# Check size
echo "📊 Checking bundle size..."
SIZE=$(gzip -c dist/lyvely-game-sdk.js | wc -c | awk '{print $1/1024}')
echo "Gzipped size: ${SIZE}KB"

if (( $(echo "$SIZE > 10" | bc -l) )); then
  echo "❌ Bundle too large! (>10KB)"
  exit 1
fi

# Generate SRI
echo "🔒 Generating SRI hash..."
SRI=$(openssl dgst -sha384 -binary dist/lyvely-game-sdk.js | openssl base64 -A)
echo "sha384-$SRI"

# Deploy to CDN
echo "☁️  Deploying to CDN..."
# Add your CDN deployment commands here

# Publish to NPM
echo "📦 Publishing to NPM..."
npm publish --access public

# Create GitHub release
echo "🏷️  Creating GitHub release..."
gh release create "v${VERSION}" \
  dist/lyvely-game-sdk.js \
  dist/lyvely-game-sdk.esm.js \
  --title "v${VERSION}" \
  --notes-file CHANGELOG.md

echo "✅ Deployment complete!"
echo ""
echo "CDN URLs:"
echo "  Latest: https://cdn.lyvely.com/sdk/lyvely-game-sdk.js"
echo "  Versioned: https://cdn.lyvely.com/sdk/v${VERSION}/lyvely-game-sdk.js"
echo ""
echo "NPM: npm install @lyvely/game-sdk@${VERSION}"
echo ""
echo "SRI: sha384-${SRI}"
```

Make it executable:
```bash
chmod +x scripts/deploy.sh
```

Run it:
```bash
./scripts/deploy.sh
```

---

**Last Updated:** 2024-11-07
