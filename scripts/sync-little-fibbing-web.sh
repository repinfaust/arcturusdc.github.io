#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAME_ROOT="${LITTLE_FIBBING_GAME_PATH:-/Users/davidloake/dev/AssumeZero/Phaser/little-fibbing-poc-v0.2}"
GAME_DIST="$GAME_ROOT/dist"
TARGET_DIR="$SITE_ROOT/public/games/little-fibbing"

if [[ ! -d "$GAME_ROOT" ]]; then
  echo "Little Fibbing game path not found: $GAME_ROOT"
  exit 1
fi

echo "Building Little Fibbing v0.2..."
(
  cd "$GAME_ROOT"
  PATH="/Users/davidloake/.nvm/versions/node/v20.19.5/bin:$PATH" npm run build
)

if [[ ! -f "$GAME_DIST/index.html" ]]; then
  echo "Missing built index.html: $GAME_DIST/index.html"
  exit 1
fi

echo "Syncing Little Fibbing build to $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
rsync -a --delete "$GAME_DIST/" "$TARGET_DIR/"

INDEX_HTML="$TARGET_DIR/index.html"
perl -0pi -e '
  s#<meta charset="UTF-8" />#<meta charset="UTF-8" />\n    <base href="/games/little-fibbing/">#;
  s#src="/assets/#src="/games/little-fibbing/assets/#g;
  s#href="/assets/#href="/games/little-fibbing/assets/#g;
' "$INDEX_HTML"

echo "Little Fibbing web mirror synced."
