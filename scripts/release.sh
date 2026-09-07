#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="${1:-patch}"

if [[ "$TARGET" != "patch" && "$TARGET" != "minor" && "$TARGET" != "major" && ! "$TARGET" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: npm run release -- [patch|minor|major|x.y.z]"
  exit 1
fi

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Releases must run from main."
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

CURRENT_VERSION="$(node -p "require('./package.json').version")"
if [[ "$TARGET" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ && "$TARGET" == "$CURRENT_VERSION" ]]; then
  NEW_VERSION="$CURRENT_VERSION"
else
  npm version "$TARGET" --no-git-tag-version
  NEW_VERSION="$(node -p "require('./package.json').version")"
fi

if git rev-parse "v${NEW_VERSION}" >/dev/null 2>&1; then
  echo "Tag v${NEW_VERSION} already exists."
  exit 1
fi

if npm view "rote-toolkit@${NEW_VERSION}" version >/dev/null 2>&1; then
  echo "rote-toolkit@${NEW_VERSION} is already published."
  exit 1
fi

echo "Testing and building ${NEW_VERSION}..."
npm test
npm run build

echo "Preview package contents..."
npm pack --dry-run >/dev/null

if ! git diff --quiet -- package.json package-lock.json; then
  git add package.json package-lock.json
  git commit -m "chore(release): v${NEW_VERSION}"
fi

echo "Publishing to npm..."
npm publish

git tag -a "v${NEW_VERSION}" -m "rote-toolkit v${NEW_VERSION}"
git push origin HEAD
git push origin "v${NEW_VERSION}"

echo "Published rote-toolkit@${NEW_VERSION}"
