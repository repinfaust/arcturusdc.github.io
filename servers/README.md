# STEa MCP Server

MCP (Model Context Protocol) server that allows Claude Code to create and manage Epics, Features, and Cards in your STEa board through Firestore.

## Setup

### 1. Configure Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings → Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file securely (DO NOT commit to git)

### 2. Configure Claude Desktop

Edit your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration (replace with your actual Firebase credentials):

```json
{
  "mcpServers": {
    "stea-mcp": {
      "command": "npx",
      "args": [
        "ts-node",
        "/FULL/PATH/TO/arcturusdc.github.io/servers/stea-mcp.ts"
      ],
      "env": {
        "FIREBASE_PROJECT_ID": "your-project-id",
        "FIREBASE_CLIENT_EMAIL": "your-service-account@project.iam.gserviceaccount.com",
        "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
        "DEFAULT_APP": "Tou.me",
        "DEFAULT_BOARD": "STEa",
        "DEFAULT_COLUMN": "Idea",
        "CREATED_BY": "mcp:stea"
      }
    }
  }
}
```

**Important**:
- Replace `/FULL/PATH/TO/` with the actual absolute path to your project
- The private key must have `\\n` for newlines in JSON (not actual newlines)
- Restart Claude Desktop after editing the config

### 3. Verify Installation

After restarting Claude Desktop, open a new chat and you should see the following tools available:

- `stea.createEpic` - Create an Epic (top-level work item)
- `stea.createFeature` - Create a Feature nested under an Epic
- `stea.createCard` - Create a Card nested under a Feature
- `stea.listEpics` - List all epics (optionally filter by app)
- `stea.listFeatures` - List features under an epic
- `stea.listCardsByFeature` - List cards under a feature

## Usage Examples

### Create an Epic
```
Use stea.createEpic to create an epic named "User Authentication Overhaul"
for app "Tou.me", priority HIGH, column "Planning", size "XL",
description "Modernize auth system with OAuth2 and improve security"
```

### Create a Feature under an Epic
```
Use stea.listEpics to find the "User Authentication Overhaul" epic.
Then create a feature with stea.createFeature:
- epicId: <the ID from listEpics>
- name: "Social login integration"
- priority: MEDIUM
- column: "Design"
- size: "5"
- description: "Add Google, GitHub, and Apple sign-in options"
```

### Create Cards under a Feature
```
Use stea.createCard with:
- epicId: <epic ID>
- featureId: <feature ID>
- title: "Implement Google OAuth flow"
- description: "Set up Google OAuth2 provider and handle callback"
- priority: HIGH
- testing:
    userStory: "As a user, I want to sign in with my Google account"
    acceptanceCriteria:
      - "User can click 'Sign in with Google' button"
      - "OAuth consent screen appears"
      - "User is redirected back and logged in"
    userFlow:
      - "Click 'Sign in with Google'"
      - "Authorize on Google consent screen"
      - "Redirected to app dashboard"
```

## Firestore Collections

The MCP server creates documents in these collections:

- **stea_epics** - Top-level work items
- **stea_features** - Mid-level items nested under epics
- **stea_cards** - Detailed task cards nested under features

### Data Schema

#### Epic
```typescript
{
  name: string
  description: string
  app: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  column: string
  size?: string | number
  createdBy: string
  createdAt: Timestamp
}
```

#### Feature
```typescript
{
  epicId: string  // parent Epic ID
  name: string
  description: string
  app: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  column: string
  size?: string | number
  createdBy: string
  createdAt: Timestamp
}
```

#### Card
```typescript
{
  epicId: string
  featureId: string  // parent Feature ID
  title: string
  description: string
  app: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  column: string
  size?: string | number
  testing?: {
    userStory?: string
    acceptanceCriteria?: string[]
    userFlow?: string[]
  }
  createdBy: string
  createdAt: Timestamp
}
```

## Firestore Composite Indexes

For optimal query performance, create these composite indexes in Firebase Console:

1. **stea_features**
   - Fields: `epicId` (Ascending), `priority` (Ascending)

2. **stea_cards**
   - Fields: `featureId` (Ascending), `priority` (Ascending)

3. **(Optional)** **stea_cards**
   - Fields: `epicId` (Ascending), `priority` (Ascending)

Go to: Firebase Console → Firestore Database → Indexes → Create Index

## Troubleshooting

### "STEa MCP server not found"
- Verify the path in `claude_desktop_config.json` is absolute and correct
- Make sure you restarted Claude Desktop after config changes

### "Permission denied" errors
- Ensure your Firebase service account has Firestore read/write permissions
- Check that the private key is properly formatted in the config

### "Epic not found" when creating Feature
- Use `stea.listEpics` to verify the Epic ID exists
- Make sure you're using the full Epic ID string

### Tools not appearing in Claude
- Check Claude Desktop logs for errors
- Verify JSON syntax in config file (use a JSON validator)
- Try `npx ts-node servers/stea-mcp.ts` manually to test for errors

## Security Notes

- The MCP server runs **locally** on your machine
- It uses Firebase Admin SDK (bypasses security rules)
- **Never commit** Firebase credentials to git
- Keep your service account key secure
- The server is not deployed to Vercel (local dev only)
