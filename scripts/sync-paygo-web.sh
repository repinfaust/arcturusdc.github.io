#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAYGO_MOBILE_DIR="${PAYGO_MOBILE_PATH:-/Users/davidloake/dev/paygo/mobile}"
PAYGO_DIST_DIR="$PAYGO_MOBILE_DIR/dist"
PAYGO_RUNTIME_DIR="$ROOT_DIR/src/app/apps/stea/paygo/_runtime"
PAYGO_PUBLIC_ASSETS_DIR="$ROOT_DIR/public/paygo-runtime-assets"
STAMP_FILE="$PAYGO_RUNTIME_DIR/.paygo-source-stamp"

sanitize_runtime_js() {
  while IFS= read -r js_file; do
    [[ -f "$js_file" ]] || continue
    perl -0pi -e 's#"/assets/#"/paygo-runtime-assets/#g; s#"/apps/stea/paygo/runtime/assets/#"/paygo-runtime-assets/#g; s#"/_expo/#"/apps/stea/paygo/runtime/_expo/#g; s#"/favicon\.ico"#"/apps/stea/paygo/runtime/favicon.ico"#g' "$js_file"
    # Remove Firebase-style API key literals from tracked runtime bundles.
    perl -0pi -e 's#AIza[0-9A-Za-z_-]{35}#__PAYGO_FIREBASE_API_KEY__#g' "$js_file"
  done < <(find "$PAYGO_RUNTIME_DIR/_expo/static/js/web" -name 'index-*.js' | LC_ALL=C sort)
}

if [[ ! -d "$PAYGO_MOBILE_DIR" ]]; then
  echo "PAYGO mobile path not found: $PAYGO_MOBILE_DIR"
  exit 1
fi

mkdir -p "$PAYGO_RUNTIME_DIR"
mkdir -p "$PAYGO_PUBLIC_ASSETS_DIR"

SOURCE_FILE_LIST="$(
  find "$PAYGO_MOBILE_DIR" \
    \( -path "$PAYGO_MOBILE_DIR/node_modules" -o -path "$PAYGO_MOBILE_DIR/node_modules/*" \
       -o -path "$PAYGO_MOBILE_DIR/ios" -o -path "$PAYGO_MOBILE_DIR/ios/*" \
       -o -path "$PAYGO_MOBILE_DIR/android" -o -path "$PAYGO_MOBILE_DIR/android/*" \
       -o -path "$PAYGO_MOBILE_DIR/.expo" -o -path "$PAYGO_MOBILE_DIR/.expo/*" \
       -o -path "$PAYGO_MOBILE_DIR/dist" -o -path "$PAYGO_MOBILE_DIR/dist/*" \) -prune \
    -o -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.json' -o -name '.env.local' -o -name '.env.example' \) -print \
    | LC_ALL=C sort
)"

if [[ -z "$SOURCE_FILE_LIST" ]]; then
  echo "No source files found to hash in $PAYGO_MOBILE_DIR"
  exit 1
fi

SOURCE_STAMP="$({
  while IFS= read -r file; do
    shasum "$file"
  done <<< "$SOURCE_FILE_LIST"
} | shasum | awk '{print $1}')"

if [[ -f "$STAMP_FILE" ]] && [[ "$(cat "$STAMP_FILE")" == "$SOURCE_STAMP" ]]; then
  sanitize_runtime_js
  echo "PAYGO web mirror is already up to date."
  exit 0
fi

echo "Changes detected. Exporting PAYGO web bundle..."
(
  cd "$PAYGO_MOBILE_DIR"
  npx expo export --platform web
)

echo "Syncing exported files to site runtime..."
rsync -a --delete "$PAYGO_DIST_DIR/" "$PAYGO_RUNTIME_DIR/"
rsync -a --delete "$PAYGO_DIST_DIR/assets/" "$PAYGO_PUBLIC_ASSETS_DIR/"

INDEX_HTML="$PAYGO_RUNTIME_DIR/index.html"
if [[ ! -f "$INDEX_HTML" ]]; then
  echo "Missing index.html in exported bundle"
  exit 1
fi

perl -0pi -e 's#href="/favicon\.ico"#href="/apps/stea/paygo/runtime/favicon.ico"#g; s#src="/_expo/static/js/web/#src="/apps/stea/paygo/runtime/_expo/static/js/web/#g' "$INDEX_HTML"

sanitize_runtime_js

echo "$SOURCE_STAMP" > "$STAMP_FILE"

echo "PAYGO web mirror synced."
