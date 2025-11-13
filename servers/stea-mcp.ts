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
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';

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

// SECURITY: Tenant ID MUST be provided via environment variable
// This ensures users can only access their own tenant's data
if (!process.env.TENANT_ID) {
  throw new Error(
    'TENANT_ID environment variable is required for multi-tenant security. ' +
    'Each user must have their own tenant ID configured in their MCP settings.'
  );
}
const TENANT_ID = process.env.TENANT_ID;

// Helper: Generate search tokens for search functionality
function generateSearchTokens(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const tokens = new Set<string>();

  // Add full text
  tokens.add(normalized);

  // Add individual words
  words.forEach(word => {
    if (word.length > 2) {
      tokens.add(word);
      // Add prefixes for autocomplete
      for (let i = 3; i <= word.length; i++) {
        tokens.add(word.substring(0, i));
      }
    }
  });

  return Array.from(tokens);
}

// ---------- Template System ----------
interface DocTemplate {
  name: string;
  description: string;
  type: string;
  variables: Array<{ name: string; description: string; required: boolean }>;
  template: string;
}

const templates = new Map<string, DocTemplate>();

function loadTemplates() {
  const templateDir = resolve(__dirname, 'templates');
  const templateTypes = ['prs', 'buildspec', 'releasenotes'];

  for (const type of templateTypes) {
    try {
      const filePath = resolve(templateDir, `${type}.yaml`);
      const content = readFileSync(filePath, 'utf8');
      const parsed = yaml.load(content) as DocTemplate;
      templates.set(type, parsed);
    } catch (error) {
      console.error(`Failed to load template ${type}:`, error);
    }
  }
}

// Load templates on startup
loadTemplates();

// Simple variable substitution in templates
function applyTemplate(templateStr: string, variables: Record<string, any>): string {
  let result = templateStr;

  // Replace {{variable}} or {{variable || "default"}}
  result = result.replace(/\{\{(\w+)\s*\|\|\s*"([^"]*)"\}\}/g, (match, varName, defaultValue) => {
    return variables[varName] || defaultValue;
  });

  // Replace simple {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || '';
  });

  return result;
}

// Convert markdown to TipTap JSON format
function markdownToTipTap(markdown: string): any {
  const lines = markdown.split('\n');
  const content: any[] = [];
  let currentList: any = null;
  let codeBlockContent: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || 'plaintext';
        codeBlockContent = [];
      } else {
        content.push({
          type: 'codeBlock',
          attrs: { language: codeLanguage },
          content: [{
            type: 'text',
            text: codeBlockContent.join('\n'),
          }],
        });
        inCodeBlock = false;
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      content.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: [{ type: 'text', text: headingMatch[2] }],
      });
      continue;
    }

    // Task list items
    const taskMatch = line.match(/^(\s*)- \[([ x])\] (.+)/);
    if (taskMatch) {
      if (!currentList || currentList.type !== 'taskList') {
        if (currentList) content.push(currentList);
        currentList = { type: 'taskList', content: [] };
      }
      currentList.content.push({
        type: 'taskItem',
        attrs: { checked: taskMatch[2] === 'x' },
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: taskMatch[3] }],
        }],
      });
      continue;
    }

    // Bullet list items
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'bulletList') {
        if (currentList) content.push(currentList);
        currentList = { type: 'bulletList', content: [] };
      }
      currentList.content.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: bulletMatch[2] }],
        }],
      });
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      content.push({ type: 'horizontalRule' });
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      continue;
    }

    // Regular paragraphs with inline formatting
    if (currentList) {
      content.push(currentList);
      currentList = null;
    }

    const paragraphContent = parseInlineFormatting(line);
    content.push({
      type: 'paragraph',
      content: paragraphContent,
    });
  }

  // Push any remaining list
  if (currentList) {
    content.push(currentList);
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
  };
}

// Parse inline formatting (bold, italic, code, links)
function parseInlineFormatting(text: string): any[] {
  const result: any[] = [];
  let remaining = text;

  // Simple regex-based parsing (could be enhanced with a proper parser)
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, mark: 'bold' },
    { regex: /\*(.+?)\*/g, mark: 'italic' },
    { regex: /__(.+?)__/g, mark: 'bold' },
    { regex: /_(.+?)_/g, mark: 'italic' },
    { regex: /`(.+?)`/g, mark: 'code' },
    { regex: /\[(.+?)\]\((.+?)\)/g, mark: 'link' },
  ];

  // For simplicity, just return plain text for now
  // A full implementation would properly parse and apply marks
  if (remaining.trim()) {
    result.push({ type: 'text', text: remaining });
  }

  return result.length > 0 ? result : [{ type: 'text', text: '' }];
}

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

const createRubyDocSchema = z.object({
  spaceId: z.string(),
  title: z.string(),
  content: z.string(), // Markdown or JSON
  type: z.enum(['documentation', 'note', 'architecture', 'meeting']).default('documentation'),
  app: z.string().optional(),
});

const listRubySpacesSchema = z.object({
  limit: z.number().optional(),
});

const createRubySpaceSchema = z.object({
  name: z.string(),
  icon: z.string().default('📚'),
});

const generateDocSchema = z.object({
  templateType: z.enum(['prs', 'buildspec', 'releasenotes']),
  spaceId: z.string(),
  sourceType: z.enum(['epic', 'feature', 'card', 'note']).optional(),
  sourceId: z.string().optional(),
  variables: z.record(z.any()).optional(),
});

// ---------- Tool Handlers ----------

async function handleCreateEpic(args: z.infer<typeof createEpicSchema>) {
  const { column, name, ...rest } = args;
  const payload = {
    ...rest,
    title: name,
    name,
    label: name,
    epicLabel: name,
    statusColumn: column,
    entityType: 'epic',
    type: 'epic',
    archived: false,
    tenantId: TENANT_ID,
    searchTokens: generateSearchTokens(`${name} ${rest.description || ''} ${rest.app || ''}`),
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
    title: name,
    name,
    label: name,
    statusColumn: column,
    entityType: 'feature',
    type: 'feature',
    archived: false,
    tenantId: TENANT_ID,
    searchTokens: generateSearchTokens(`${name} ${rest.description || ''} ${rest.app || ''}`),
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

  const { column, testing, ...rest } = args;
  const payload = {
    ...rest,
    // Flatten testing fields to root level
    ...(testing?.userStory && { userStory: testing.userStory }),
    ...(testing?.acceptanceCriteria && { acceptanceCriteria: testing.acceptanceCriteria }),
    ...(testing?.userFlow && { userFlow: testing.userFlow }),
    label: rest.title,
    statusColumn: column,
    entityType: 'card',
    type: 'card',
    archived: false,
    tenantId: TENANT_ID,
    searchTokens: generateSearchTokens(`${rest.title} ${rest.description || ''} ${rest.app || ''}`),
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
  const { cardId, column, testing, ...rest } = args;

  const cardRef = db.collection('stea_cards').doc(cardId);
  const card = await cardRef.get();

  if (!card.exists) {
    throw new Error(`Card not found: ${cardId}`);
  }

  const updates: any = { ...rest };
  if (column) {
    updates.statusColumn = column;
  }
  // Flatten testing fields to root level
  if (testing?.userStory) updates.userStory = testing.userStory;
  if (testing?.acceptanceCriteria) updates.acceptanceCriteria = testing.acceptanceCriteria;
  if (testing?.userFlow) updates.userFlow = testing.userFlow;

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

async function handleListRubySpaces(args: z.infer<typeof listRubySpacesSchema>) {
  let query: FirebaseFirestore.Query = db.collection('stea_doc_spaces')
    .where('tenantId', '==', TENANT_ID);

  if (args.limit) {
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

async function handleCreateRubySpace(args: z.infer<typeof createRubySpaceSchema>) {
  const payload = {
    name: args.name,
    icon: args.icon,
    tenantId: TENANT_ID,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
  };

  const ref = await db.collection('stea_doc_spaces').add(payload);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ spaceId: ref.id, ...payload }, null, 2),
      },
    ],
  };
}

async function handleCreateRubyDoc(args: z.infer<typeof createRubyDocSchema>) {
  // Verify space exists
  const spaceRef = db.collection('stea_doc_spaces').doc(args.spaceId);
  const space = await spaceRef.get();

  if (!space.exists) {
    throw new Error(`Ruby space not found: ${args.spaceId}`);
  }

  // Convert markdown content to TipTap JSON format (simplified)
  const contentJson = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: args.content,
          },
        ],
      },
    ],
  };

  const payload = {
    title: args.title,
    content: contentJson,
    type: args.type,
    spaceId: args.spaceId,
    tenantId: TENANT_ID,
    ...(args.app && { app: args.app }),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection('stea_docs').add(payload);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ documentId: ref.id, ...payload }, null, 2),
      },
    ],
  };
}

async function handleGenerateDoc(args: z.infer<typeof generateDocSchema>) {
  const startTime = Date.now();

  // Load template
  const template = templates.get(args.templateType);
  if (!template) {
    throw new Error(`Template not found: ${args.templateType}`);
  }

  // Verify space exists
  const spaceRef = db.collection('stea_doc_spaces').doc(args.spaceId);
  const space = await spaceRef.get();
  if (!space.exists) {
    throw new Error(`Ruby space not found: ${args.spaceId}`);
  }

  // Extract context from source artifact if provided
  let contextVariables: Record<string, any> = args.variables || {};
  let sourceArtifact: any = null;

  if (args.sourceId && args.sourceType) {
    const collectionMap: Record<string, string> = {
      epic: 'stea_epics',
      feature: 'stea_features',
      card: 'stea_cards',
      note: 'projects', // Harls notes
    };

    const collection = collectionMap[args.sourceType];
    if (collection) {
      const artifactRef = db.collection(collection).doc(args.sourceId);
      const artifact = await artifactRef.get();

      if (artifact.exists) {
        sourceArtifact = { id: artifact.id, ...artifact.data() };

        // Extract context based on type
        if (args.sourceType === 'epic' || args.sourceType === 'feature') {
          contextVariables.title = contextVariables.title || sourceArtifact.name || sourceArtifact.title;
          contextVariables.overview = contextVariables.overview || sourceArtifact.description || '';
          contextVariables.constraints = contextVariables.constraints || sourceArtifact.constraints;
          contextVariables.dependencies = contextVariables.dependencies || sourceArtifact.dependencies;
        } else if (args.sourceType === 'card') {
          contextVariables.title = contextVariables.title || sourceArtifact.title;
          contextVariables.overview = contextVariables.overview || sourceArtifact.description || '';
          contextVariables.userStory = contextVariables.userStory || sourceArtifact.userStory;
          contextVariables.acceptanceCriteria = contextVariables.acceptanceCriteria ||
            (sourceArtifact.acceptanceCriteria ? sourceArtifact.acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n') : '');
          contextVariables.constraints = contextVariables.constraints || sourceArtifact.constraints;
          contextVariables.dependencies = contextVariables.dependencies || sourceArtifact.dependencies;
        }
      }
    }
  }

  // Apply template with variables
  const markdown = applyTemplate(template.template, contextVariables);

  // Convert to TipTap JSON
  const contentJson = markdownToTipTap(markdown);

  // Create document
  const docTitle = contextVariables.title || template.name;
  const payload = {
    title: docTitle,
    content: contentJson,
    type: template.type,
    spaceId: args.spaceId,
    tenantId: TENANT_ID,
    draft: true, // Mark as draft
    templateType: args.templateType,
    templateVersion: '1.0', // Could be tracked in template YAML
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: CREATED_BY,
  };

  const ref = await db.collection('stea_docs').add(payload);
  const docId = ref.id;

  // Auto-create DocLink if source provided
  if (args.sourceId && args.sourceType) {
    try {
      await db.collection('stea_doc_links').add({
        fromType: args.sourceType,
        fromId: args.sourceId,
        toType: 'document',
        toId: docId,
        relation: 'generated_from',
        tenantId: TENANT_ID,
        createdBy: CREATED_BY,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (linkError) {
      console.error('Failed to create DocLink:', linkError);
      // Don't fail the whole operation if link creation fails
    }
  }

  const elapsed = Date.now() - startTime;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          documentId: docId,
          title: docTitle,
          draft: true,
          templateType: args.templateType,
          sourceId: args.sourceId,
          sourceType: args.sourceType,
          linkCreated: !!args.sourceId,
          generationTime: `${elapsed}ms`,
        }, null, 2),
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
      {
        name: 'stea.listRubySpaces',
        description: 'List Ruby documentation spaces',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max number of results' },
          },
        },
      },
      {
        name: 'stea.createRubySpace',
        description: 'Create a new Ruby documentation space',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Space name' },
            icon: { type: 'string', description: 'Space icon (emoji, default: 📚)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'stea.createRubyDoc',
        description: 'Create a Ruby documentation document in a space',
        inputSchema: {
          type: 'object',
          properties: {
            spaceId: { type: 'string', description: 'Parent space ID' },
            title: { type: 'string', description: 'Document title' },
            content: { type: 'string', description: 'Document content (markdown or plain text)' },
            type: {
              type: 'string',
              enum: ['documentation', 'note', 'architecture', 'meeting'],
              description: 'Document type (default: documentation)',
            },
            app: { type: 'string', description: 'Associated app name (optional)' },
          },
          required: ['spaceId', 'title', 'content'],
        },
      },
      {
        name: 'stea.generateDoc',
        description: 'Generate a Ruby doc from a template (PRS, BuildSpec, or ReleaseNotes) with context from a source artifact',
        inputSchema: {
          type: 'object',
          properties: {
            templateType: {
              type: 'string',
              enum: ['prs', 'buildspec', 'releasenotes'],
              description: 'Template type to use',
            },
            spaceId: { type: 'string', description: 'Target Ruby space ID' },
            sourceType: {
              type: 'string',
              enum: ['epic', 'feature', 'card', 'note'],
              description: 'Type of source artifact (optional)',
            },
            sourceId: { type: 'string', description: 'ID of source artifact (optional)' },
            variables: {
              type: 'object',
              description: 'Additional template variables (optional)',
            },
          },
          required: ['templateType', 'spaceId'],
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

      case 'stea.listRubySpaces':
        return await handleListRubySpaces(listRubySpacesSchema.parse(args || {}));

      case 'stea.createRubySpace':
        return await handleCreateRubySpace(createRubySpaceSchema.parse(args || {}));

      case 'stea.createRubyDoc':
        return await handleCreateRubyDoc(createRubyDocSchema.parse(args || {}));

      case 'stea.generateDoc':
        return await handleGenerateDoc(generateDocSchema.parse(args || {}));

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
