# STEa MCP Server - Claude Code Setup

## Status: ✅ CONFIGURED

The stea-mcp server is now configured and ready to use in Claude Code (CLI).

## Configuration Location

**Global Config**: `/Users/davidloake/.claude.json`
- The server is configured under `projects["/Users/davidloake"].mcpServers["stea-mcp"]`
- This makes it available in any Claude Code session started from your home directory or subdirectories

## Available Tools

When the MCP server is running, you'll have access to these tools (prefixed with `mcp__stea-mcp__`):

- `mcp__stea-mcp__stea.createEpic` - Create top-level epics
- `mcp__stea-mcp__stea.createFeature` - Create features under epics
- `mcp__stea-mcp__stea.createCard` - Create detailed task cards under features
- `mcp__stea-mcp__stea.listEpics` - List all epics
- `mcp__stea-mcp__stea.listFeatures` - List features for an epic
- `mcp__stea-mcp__stea.listCardsByFeature` - List cards for a feature
- `mcp__stea-mcp__stea.updateCard` - Update a card
- `mcp__stea-mcp__stea.updateEpic` - Update an epic
- `mcp__stea-mcp__stea.updateFeature` - Update a feature
- `mcp__stea-mcp__stea.deleteCard` - Delete a card
- `mcp__stea-mcp__stea.deleteEpic` - Delete an epic
- `mcp__stea-mcp__stea.deleteFeature` - Delete a feature

## Usage in Claude Code

1. **Start a Claude Code session** from any directory:
   ```bash
   claude
   ```

2. **Check if MCP server is loaded**:
   ```bash
   /mcp
   ```
   You should see `stea-mcp` in the list of available servers.

3. **Use the tools** by asking Claude to interact with your project board:
   ```
   Can you list all epics in my STEa board?
   ```

   ```
   Create a new epic called "Authentication System" with high priority
   ```

## Current Configuration

- **Firebase Project**: stea-775cd
- **Default App**: Tou.me
- **Default Board**: STEa
- **Default Column**: Idea
- **Server Path**: `/Users/davidloake/arcturusdc.github.io/servers/stea-mcp.ts`
- **Credentials**: `/Users/davidloake/stea-775cd-1adc69763f06.json`

## To Add to Other Projects

The MCP server is configured globally under `/Users/davidloake` and will work from any subdirectory.

If you need project-specific configuration, manually edit `.claude.json` to add the `stea-mcp` server configuration.

## Troubleshooting

### Server not showing in /mcp list
1. Make sure you're running Claude Code from `/Users/davidloake` or any subdirectory
2. Check that the server path exists:
   ```bash
   ls -la "/Users/davidloake/arcturusdc.github.io/servers/stea-mcp.ts"
   ```

### "Could not connect to MCP server" error
1. Verify tsx is installed globally or in the project:
   ```bash
   npm list tsx
   ```
2. Check Firebase credentials file exists:
   ```bash
   ls -la "/Users/davidloake/stea-775cd-1adc69763f06.json"
   ```

### Test server manually
```bash
cd "/Users/davidloake/arcturusdc.github.io"
GOOGLE_APPLICATION_CREDENTIALS="/Users/davidloake/stea-775cd-1adc69763f06.json" \
DEFAULT_APP="Tou.me" \
DEFAULT_BOARD="STEa" \
DEFAULT_COLUMN="Idea" \
CREATED_BY="mcp:stea" \
npx tsx servers/stea-mcp.ts
```

You should see: "STEa MCP server running on stdio"

## Differences from Claude Desktop

- **Claude Desktop** uses: `/Users/davidloake/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Code (CLI)** uses: `/Users/davidloake/.claude.json`
- Both are now configured and should work independently

## Next Steps

You can now use Claude Code to manage your project board directly from the terminal!

Try asking:
- "Show me all epics for the Tou.me app"
- "Create a new feature for [epic-id] called 'User Profile'"
- "List all cards under [feature-id]"
