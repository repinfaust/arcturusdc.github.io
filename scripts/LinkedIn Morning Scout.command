#!/bin/zsh
cd "$(dirname "$0")/.." || exit 1
node scripts/linkedin-morning-scout.mjs "$@"
echo ""
echo "Done! You can close this window or switch to your Career Ops tab."
