#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BUMP_TYPE="${1:-patch}"

if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "Usage: npm run release -- [patch|minor|major]"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Please commit or stash changes first."
  exit 1
fi

if ! npm whoami >/dev/null 2>&1; then
  echo "Not logged in to npm. Run: npm login"
  exit 1
fi

echo "Building..."
npm run build

echo "Preview package contents..."
npm pack --dry-run >/dev/null

echo "Bumping version (${BUMP_TYPE})..."
npm version "$BUMP_TYPE" -m "chore(release): %s"

echo "Publishing to npm..."
npm publish

NEW_VERSION="$(node -p "require('./package.json').version")"
echo "Published rote-toolkit@${NEW_VERSION}"
echo "Next: git push && git push --tags"
