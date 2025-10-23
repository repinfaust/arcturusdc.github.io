#!/usr/bin/env ts-node

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { resolve } from 'path';

// ---------- Firebase Admin Initialization ----------
let db: FirebaseFirestore.Firestore;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    db = getFirestore();
    return;
  }

  // Check for GOOGLE_APPLICATION_CREDENTIALS environment variable
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    throw new Error(
      'Missing Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON file.'
    );
  }

  // Resolve path relative to project root (parent of servers/)
  const resolvedPath = resolve(__dirname, '..', credPath);

  // Firebase Admin SDK will automatically use GOOGLE_APPLICATION_CREDENTIALS
  const app = initializeApp({
    credential: cert(require(resolvedPath)),
  });

  db = getFirestore(app);
}

initializeFirebaseAdmin();

// ---------- Constants ----------
const DEF_APP = process.env.DEFAULT_APP || 'Tou.me';
const DEF_COL = process.env.DEFAULT_COLUMN || 'Idea';
const CREATED_BY = process.env.CREATED_BY || 'mcp:stea';

// ---------- Zod Schemas ----------
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const sizeSchema = z.union([z.string(), z.number()]);

// ---------- Tool Definitions ----------

const createEpicSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  app: z.string().default(DEF_APP),
  priority: priorityEnum.default('MEDIUM'),
  column: z.string().default(DEF_COL),
  size: sizeSchema.optional(),
});

const createFeatureSchema = z.object({
  epicId: z.string(),
  name: z.string(),
  description: z.string().default(''),
  app: z.string().default(DEF_APP),
  priority: priorityEnum.default('MEDIUM'),
  column: z.string().default(DEF_COL),
  size: sizeSchema.optional(),
});

const createCardSchema = z.object({
  epicId: z.string(),
  featureId: z.string(),
  title: z.string(),
  description: z.string().default(''),
  app: z.string().default(DEF_APP),
  priority: priorityEnum.default('MEDIUM'),
  column: z.string().default(DEF_COL),
  size: sizeSchema.optional(),
  testing: z
    .object({
      userStory: z.string().optional(),
      acceptanceCriteria: z.array(z.string()).optional(),
      userFlow: z.array(z.string()).optional(),
    })
    .optional(),
});

const listEpicsSchema = z
  .object({
    app: z.string().optional(),
    limit: z.number().optional(),
  })
  .optional();

const listFeaturesSchema = z.object({
  epicId: z.string(),
});

const listCardsByFeatureSchema = z.object({
  featureId: z.string(),
});

const updateCardSchema = z.object({
  cardId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  column: z.string().optional(),
  size: sizeSchema.optional(),
  testing: z
    .object({
      userStory: z.string().optional(),
      acceptanceCriteria: z.array(z.string()).optional(),
      userFlow: z.array(z.string()).optional(),
    })
    .optional(),
});

const updateEpicSchema = z.object({
  epicId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  column: z.string().optional(),
  size: sizeSchema.optional(),
});

const updateFeatureSchema = z.object({
  featureId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  column: z.string().optional(),
  size: sizeSchema.optional(),
});

const deleteCardSchema = z.object({
  cardId: z.string(),
});

const deleteEpicSchema = z.object({
  epicId: z.string(),
});

const deleteFeatureSchema = z.object({
  featureId: z.string(),
});

// ---------- Tool Handlers ----------

async function handleCreateEpic(args: z.infer<typeof createEpicSchema>) {
  const { column, name, ...rest } = args;
  const payload = {
    ...rest,
    title: name, // Filo uses 'title' field
    name, // Keep name for compatibility
    statusColumn: column, // Filo uses 'statusColumn' not 'column'
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
  };

  const ref = await db.collection('stea_epics').add(payload);
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ epicId: ref.id, ...payload }, null, 2),
      },
    ],
  };
}

async function handleCreateFeature(
  args: z.infer<typeof createFeatureSchema>
) {
  // Verify epic exists
  const epicRef = db.collection('stea_epics').doc(args.epicId);
  const epic = await epicRef.get();
  if (!epic.exists) {
    throw new Error(`Epic not found: ${args.epicId}`);
  }

  const { column, name, ...rest } = args;
  const payload = {
    ...rest,
    title: name, // Filo uses 'title' field
    name, // Keep name for compatibility
    statusColumn: column, // Filo uses 'statusColumn' not 'column'
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
  };

  const ref = await db.collection('stea_features').add(payload);
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ featureId: ref.id, ...payload }, null, 2),
      },
    ],
  };
}

async function handleCreateCard(args: z.infer<typeof createCardSchema>) {
  // Verify feature exists and belongs to epic
  const featRef = db.collection('stea_features').doc(args.featureId);
  const feat = await featRef.get();

  if (!feat.exists) {
    throw new Error(`Feature not found: ${args.featureId}`);
  }

  const featData = feat.data();
  if (featData?.epicId !== args.epicId) {
    throw new Error(
      `Feature ${args.featureId} does not belong to epic ${args.epicId}`
    );
  }

  const { column, ...rest } = args;
  const payload = {
    ...rest,
    statusColumn: column, // Filo uses 'statusColumn' not 'column'
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
  };

  const ref = await db.collection('stea_cards').add(payload);
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ cardId: ref.id, ...payload }, null, 2),
      },
    ],
  };
}

async function handleListEpics(
  args: z.infer<typeof listEpicsSchema> = {}
) {
  let query: FirebaseFirestore.Query = db.collection('stea_epics');

  if (args?.app) {
    query = query.where('app', '==', args.app);
  }

  if (args?.limit) {
    query = query.limit(args.limit);
  }

  const snap = await query.get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleListFeatures(
  args: z.infer<typeof listFeaturesSchema>
) {
  const snap = await db
    .collection('stea_features')
    .where('epicId', '==', args.epicId)
    .get();

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleListCardsByFeature(
  args: z.infer<typeof listCardsByFeatureSchema>
) {
  const snap = await db
    .collection('stea_cards')
    .where('featureId', '==', args.featureId)
    .get();

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleUpdateCard(args: z.infer<typeof updateCardSchema>) {
  const { cardId, column, ...rest } = args;

  const cardRef = db.collection('stea_cards').doc(cardId);
  const card = await cardRef.get();

  if (!card.exists) {
    throw new Error(`Card not found: ${cardId}`);
  }

  const updates: any = { ...rest };
  if (column) {
    updates.statusColumn = column;
  }

  await cardRef.update(updates);

  const updated = await cardRef.get();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ cardId, ...updated.data() }, null, 2),
      },
    ],
  };
}

async function handleUpdateEpic(args: z.infer<typeof updateEpicSchema>) {
  const { epicId, column, name, ...rest } = args;

  const epicRef = db.collection('stea_epics').doc(epicId);
  const epic = await epicRef.get();

  if (!epic.exists) {
    throw new Error(`Epic not found: ${epicId}`);
  }

  const updates: any = { ...rest };
  if (column) {
    updates.statusColumn = column;
  }
  if (name) {
    updates.name = name;
    updates.title = name;
  }

  await epicRef.update(updates);

  const updated = await epicRef.get();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ epicId, ...updated.data() }, null, 2),
      },
    ],
  };
}

async function handleUpdateFeature(args: z.infer<typeof updateFeatureSchema>) {
  const { featureId, column, name, ...rest } = args;

  const featureRef = db.collection('stea_features').doc(featureId);
  const feature = await featureRef.get();

  if (!feature.exists) {
    throw new Error(`Feature not found: ${featureId}`);
  }

  const updates: any = { ...rest };
  if (column) {
    updates.statusColumn = column;
  }
  if (name) {
    updates.name = name;
    updates.title = name;
  }

  await featureRef.update(updates);

  const updated = await featureRef.get();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ featureId, ...updated.data() }, null, 2),
      },
    ],
  };
}

async function handleDeleteCard(args: z.infer<typeof deleteCardSchema>) {
  const cardRef = db.collection('stea_cards').doc(args.cardId);
  const card = await cardRef.get();

  if (!card.exists) {
    throw new Error(`Card not found: ${args.cardId}`);
  }

  await cardRef.delete();

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ cardId: args.cardId, deleted: true }, null, 2),
      },
    ],
  };
}

async function handleDeleteEpic(args: z.infer<typeof deleteEpicSchema>) {
  const epicRef = db.collection('stea_epics').doc(args.epicId);
  const epic = await epicRef.get();

  if (!epic.exists) {
    throw new Error(`Epic not found: ${args.epicId}`);
  }

  await epicRef.delete();

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ epicId: args.epicId, deleted: true }, null, 2),
      },
    ],
  };
}

async function handleDeleteFeature(args: z.infer<typeof deleteFeatureSchema>) {
  const featureRef = db.collection('stea_features').doc(args.featureId);
  const feature = await featureRef.get();

  if (!feature.exists) {
    throw new Error(`Feature not found: ${args.featureId}`);
  }

  await featureRef.delete();

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ featureId: args.featureId, deleted: true }, null, 2),
      },
    ],
  };
}

// ---------- MCP Server Setup ----------
const server = new Server(
  {
    name: 'stea-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'stea.createEpic',
        description: 'Create an Epic (top-level work item)',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Epic name' },
            description: { type: 'string', description: 'Epic description' },
            app: {
              type: 'string',
              description: `App name (default: ${DEF_APP})`,
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Priority level',
            },
            column: {
              type: 'string',
              description: `Column/status (default: ${DEF_COL})`,
            },
            size: {
              description: 'Size estimate (T-shirt or story points)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'stea.createFeature',
        description: 'Create a Feature nested under an Epic',
        inputSchema: {
          type: 'object',
          properties: {
            epicId: { type: 'string', description: 'Parent Epic ID' },
            name: { type: 'string', description: 'Feature name' },
            description: {
              type: 'string',
              description: 'Feature description',
            },
            app: {
              type: 'string',
              description: `App name (default: ${DEF_APP})`,
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Priority level',
            },
            column: {
              type: 'string',
              description: `Column/status (default: ${DEF_COL})`,
            },
            size: {
              description: 'Size estimate (T-shirt or story points)',
            },
          },
          required: ['epicId', 'name'],
        },
      },
      {
        name: 'stea.createCard',
        description: 'Create a Card nested under a Feature',
        inputSchema: {
          type: 'object',
          properties: {
            epicId: { type: 'string', description: 'Parent Epic ID' },
            featureId: { type: 'string', description: 'Parent Feature ID' },
            title: { type: 'string', description: 'Card title' },
            description: { type: 'string', description: 'Card description' },
            app: {
              type: 'string',
              description: `App name (default: ${DEF_APP})`,
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Priority level',
            },
            column: {
              type: 'string',
              description: `Column/status (default: ${DEF_COL})`,
            },
            size: {
              description: 'Size estimate (T-shirt or story points)',
            },
            testing: {
              type: 'object',
              description: 'Testing specifications',
              properties: {
                userStory: { type: 'string' },
                acceptanceCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                },
                userFlow: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          required: ['epicId', 'featureId', 'title'],
        },
      },
      {
        name: 'stea.listEpics',
        description: 'List all epics (optionally filter by app)',
        inputSchema: {
          type: 'object',
          properties: {
            app: { type: 'string', description: 'Filter by app name' },
            limit: { type: 'number', description: 'Max number of results' },
          },
        },
      },
      {
        name: 'stea.listFeatures',
        description: 'List features under an epic',
        inputSchema: {
          type: 'object',
          properties: {
            epicId: { type: 'string', description: 'Epic ID' },
          },
          required: ['epicId'],
        },
      },
      {
        name: 'stea.listCardsByFeature',
        description: 'List cards under a feature',
        inputSchema: {
          type: 'object',
          properties: {
            featureId: { type: 'string', description: 'Feature ID' },
          },
          required: ['featureId'],
        },
      },
      {
        name: 'stea.updateCard',
        description: 'Update an existing card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string', description: 'Card ID' },
            title: { type: 'string', description: 'Card title' },
            description: { type: 'string', description: 'Card description' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Priority level',
            },
            column: {
              type: 'string',
              description: 'Column/status',
            },
            size: {
              description: 'Size estimate',
            },
            testing: {
              type: 'object',
              description: 'Testing specifications',
              properties: {
                userStory: { type: 'string' },
                acceptanceCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                },
                userFlow: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          required: ['cardId'],
        },
      },
      {
        name: 'stea.updateEpic',
        description: 'Update an existing epic',
        inputSchema: {
          type: 'object',
          properties: {
            epicId: { type: 'string', description: 'Epic ID' },
            name: { type: 'string', description: 'Epic name' },
            description: { type: 'string', description: 'Epic description' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Priority level',
            },
            column: {
              type: 'string',
              description: 'Column/status',
            },
            size: {
              description: 'Size estimate',
            },
          },
          required: ['epicId'],
        },
      },
      {
        name: 'stea.updateFeature',
        description: 'Update an existing feature',
        inputSchema: {
          type: 'object',
          properties: {
            featureId: { type: 'string', description: 'Feature ID' },
            name: { type: 'string', description: 'Feature name' },
            description: { type: 'string', description: 'Feature description' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Priority level',
            },
            column: {
              type: 'string',
              description: 'Column/status',
            },
            size: {
              description: 'Size estimate',
            },
          },
          required: ['featureId'],
        },
      },
      {
        name: 'stea.deleteCard',
        description: 'Delete a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string', description: 'Card ID to delete' },
          },
          required: ['cardId'],
        },
      },
      {
        name: 'stea.deleteEpic',
        description: 'Delete an epic',
        inputSchema: {
          type: 'object',
          properties: {
            epicId: { type: 'string', description: 'Epic ID to delete' },
          },
          required: ['epicId'],
        },
      },
      {
        name: 'stea.deleteFeature',
        description: 'Delete a feature',
        inputSchema: {
          type: 'object',
          properties: {
            featureId: { type: 'string', description: 'Feature ID to delete' },
          },
          required: ['featureId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'stea.createEpic':
        return await handleCreateEpic(createEpicSchema.parse(args || {}));

      case 'stea.createFeature':
        return await handleCreateFeature(
          createFeatureSchema.parse(args || {})
        );

      case 'stea.createCard':
        return await handleCreateCard(createCardSchema.parse(args || {}));

      case 'stea.listEpics':
        return await handleListEpics(
          args ? listEpicsSchema.parse(args) : undefined
        );

      case 'stea.listFeatures':
        return await handleListFeatures(listFeaturesSchema.parse(args || {}));

      case 'stea.listCardsByFeature':
        return await handleListCardsByFeature(
          listCardsByFeatureSchema.parse(args || {})
        );

      case 'stea.updateCard':
        return await handleUpdateCard(updateCardSchema.parse(args || {}));

      case 'stea.updateEpic':
        return await handleUpdateEpic(updateEpicSchema.parse(args || {}));

      case 'stea.updateFeature':
        return await handleUpdateFeature(updateFeatureSchema.parse(args || {}));

      case 'stea.deleteCard':
        return await handleDeleteCard(deleteCardSchema.parse(args || {}));

      case 'stea.deleteEpic':
        return await handleDeleteEpic(deleteEpicSchema.parse(args || {}));

      case 'stea.deleteFeature':
        return await handleDeleteFeature(deleteFeatureSchema.parse(args || {}));

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
});

// ---------- Start Server ----------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('STEa MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
