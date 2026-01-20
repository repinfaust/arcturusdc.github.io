#!/bin/bash
# Helper script to add stea-mcp to Claude Code configuration for a specific project

PROJECT_DIR=$(pwd)
CLAUDE_CONFIG="$HOME/.claude.json"
SERVER_PATH="/Volumes/wd/Projects/acturusdc site local/arcturusdc.github.io/servers/stea-mcp.ts"
CREDS_PATH="stea-775cd-1adc69763f06.json"

echo "Adding stea-mcp server to Claude Code for project: $PROJECT_DIR"
echo ""
echo "This will modify: $CLAUDE_CONFIG"
echo "Note: You'll need to manually edit the file to add the configuration under:"
echo "  projects[\"$PROJECT_DIR\"].mcpServers"
echo ""
echo "Add this JSON object:"
echo '
"stea-mcp": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "tsx",
    "'$SERVER_PATH'"
  ],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "'$CREDS_PATH'",
    "DEFAULT_APP": "Tou.me",
    "DEFAULT_BOARD": "STEa",
    "DEFAULT_COLUMN": "Idea",
    "CREATED_BY": "mcp:stea"
  }
}
'
echo ""
echo "The server is already configured globally at /Users/davidloake"
echo "It should be available in any Claude Code session started from your home directory."
