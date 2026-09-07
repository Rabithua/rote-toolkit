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
VERSION_BACKUP_DIR=""
VERSION_FILES_CHANGED=0

cleanup_version_files() {
  local exit_status=$?
  trap - EXIT

  if [[ "$exit_status" -ne 0 && "$VERSION_FILES_CHANGED" -eq 1 ]]; then
    git restore --staged -- package.json package-lock.json >/dev/null 2>&1 || true
    cp "$VERSION_BACKUP_DIR/package.json" package.json
    cp "$VERSION_BACKUP_DIR/package-lock.json" package-lock.json
    echo "Release failed; restored package.json and package-lock.json."
  fi

  if [[ -n "$VERSION_BACKUP_DIR" && -d "$VERSION_BACKUP_DIR" ]]; then
    rm -rf -- "$VERSION_BACKUP_DIR"
  fi

  exit "$exit_status"
}

trap cleanup_version_files EXIT

if [[ "$TARGET" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ && "$TARGET" == "$CURRENT_VERSION" ]]; then
  NEW_VERSION="$CURRENT_VERSION"
else
  VERSION_BACKUP_DIR="$(mktemp -d /tmp/rote-toolkit-release.XXXXXX)"
  cp package.json "$VERSION_BACKUP_DIR/package.json"
  cp package-lock.json "$VERSION_BACKUP_DIR/package-lock.json"
  VERSION_FILES_CHANGED=1
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
  VERSION_FILES_CHANGED=0
fi

echo "Publishing to npm..."
npm publish

git tag -a "v${NEW_VERSION}" -m "rote-toolkit v${NEW_VERSION}"
git push origin HEAD
git push origin "v${NEW_VERSION}"

echo "Published rote-toolkit@${NEW_VERSION}"
