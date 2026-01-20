# STEa MCP Server - Claude Code Setup

## Status: ✅ CONFIGURED

The stea-mcp server is now configured and ready to use in Claude Code (CLI).

## Configuration Location

**Global Config**: `/Users/davidloake/.claude.json`
- The server is configured under `projects["/Users/davidloake"].mcpServers["stea-mcp"]`
- This makes it available in any Claude Code session started from your home directory or subdirectories

## Available Tools

When the MCP server is running, you'll have access to these tools (prefixed with `mcp__stea-mcp__`):

**Filo (Product Backlog)**:
- `mcp__stea-mcp__stea_createEpic` - Create top-level epics
- `mcp__stea-mcp__stea_createFeature` - Create features under epics
- `mcp__stea-mcp__stea_createCard` - Create detailed task cards under features
- `mcp__stea-mcp__stea_listEpics` - List all epics
- `mcp__stea-mcp__stea_listFeatures` - List features for an epic
- `mcp__stea-mcp__stea_listCardsByFeature` - List cards for a feature
- `mcp__stea-mcp__stea_updateCard` - Update a card
- `mcp__stea-mcp__stea_updateEpic` - Update an epic
- `mcp__stea-mcp__stea_updateFeature` - Update a feature
- `mcp__stea-mcp__stea_deleteCard` - Delete a card
- `mcp__stea-mcp__stea_deleteEpic` - Delete an epic
- `mcp__stea-mcp__stea_deleteFeature` - Delete a feature

**Ruby (Documentation)** - *NEW in R3/R4/R5/R6*:
- `mcp__stea-mcp__stea_listRubySpaces` - List documentation spaces
- `mcp__stea-mcp__stea_createRubySpace` - Create a new documentation space
- `mcp__stea-mcp__stea_createRubyDoc` - Create a Ruby document with raw content
- `mcp__stea-mcp__stea_generateDoc` - **Generate doc from template (PRS/BuildSpec/ReleaseNotes) with context from source artifact (R4)**
- `mcp__stea-mcp__stea_generateReleaseNotes` - **Automatically generate release notes from Filo + Hans (R6)**
- `mcp__stea-mcp__stea_reviewDoc` - **Start review for a document using predefined checklists (R5)**
- `mcp__stea-mcp__stea_updateReview` - **Update review checklist items with pass/fail status (R5)**
- `mcp__stea-mcp__stea_completeReview` - **Complete review with approval status and signature (R5)**
- `mcp__stea-mcp__stea_listReviews` - **List all reviews for a document (R5)**

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
- **Tenant ID**: FqhckqMaorJMAQ6B29mP (Your workspace) - **REQUIRED for multi-tenant security**
- **Server Path**: `/Users/davidloake/arcturusdc.github.io/servers/stea-mcp.ts`
- **Credentials**: `/Users/davidloake/stea-775cd-1adc69763f06.json`

## Security Note

The `TENANT_ID` environment variable is **required** as of the latest update. This ensures users can only access their own tenant's data and prevents cross-tenant data leakage. Each user must have their own tenant ID configured in their MCP settings.

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
TENANT_ID="FqhckqMaorJMAQ6B29mP" \
DEFAULT_APP="Tou.me" \
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

**Filo (Backlog Management)**:
- "Show me all epics for the Tou.me app"
- "Create a new feature for [epic-id] called 'User Profile'"
- "List all cards under [feature-id]"
- "Update the card [card-id] to move it to the 'Done' column"

**Ruby (Documentation - R3/R4/R5/R6)**:
- "List all my Ruby documentation spaces"
- "Create a new Ruby space called 'API Documentation'"
- "Generate a Build Spec from card [card-id] in space [space-id]"
- "Generate a PRS for epic [epic-id] in space [space-id]"
- "Generate release notes for version v1.2.0 in space [space-id] from January 1 to January 31"
- "Create release notes for v2.0.0 including all Done cards and Hans test results"
- "Start an accessibility review for document [doc-id]"
- "Review document [doc-id] for security compliance"
- "Update review [review-id] item a11y-001 to pass with notes"
- "Complete review [review-id] with approved status"
- "List all reviews for document [doc-id]"

The `generateDoc` tool will automatically:
- Fetch the source artifact (epic/feature/card) context
- Apply the appropriate template (PRS/BuildSpec/ReleaseNotes)
- Create a properly formatted Ruby document with headings, lists, and task items
- Auto-create a DocLink from the source to the document
- Mark it as draft for review

The `generateReleaseNotes` tool will automatically:
- Query Filo for all Done cards within the date range
- Query Hans for test sessions and calculate pass rates
- Categorize cards: bugs → Fixes, features → Features, others → Improvements
- Generate formatted markdown with clickable links to source cards
- Create a published Ruby document with complete release notes
- Return statistics about the release

The `reviewDoc` tool will automatically:
- Load the specified checklist template (accessibility, security, GDPR, design-parity, or performance)
- Create a review document with 10-15 predefined checklist items
- Initialize all items with "pending" status and guidance text
- Track progress as items are reviewed
- Enforce completion requirements before allowing final approval
