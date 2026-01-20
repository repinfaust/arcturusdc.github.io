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
import SwaggerParser from '@apidevtools/swagger-parser';
import { getStorage } from 'firebase-admin/storage';
import { createHash } from 'crypto';
import axios from 'axios';

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

// ---------- Review Checklist System ----------
interface ReviewChecklistItem {
  id: string;
  question: string;
  category: string;
  severity: 'Critical' | 'Major' | 'Minor';
  guidance: string;
}

interface ReviewChecklist {
  name: string;
  description: string;
  category: string;
  items: ReviewChecklistItem[];
}

const reviewChecklists = new Map<string, ReviewChecklist>();

function loadReviewChecklists() {
  const reviewsDir = resolve(__dirname, 'templates', 'reviews');
  const checklistTypes = ['accessibility', 'security', 'gdpr', 'design-parity', 'performance'];

  for (const type of checklistTypes) {
    try {
      const filePath = resolve(reviewsDir, `${type}.yaml`);
      const content = readFileSync(filePath, 'utf8');
      const parsed = yaml.load(content) as ReviewChecklist;
      reviewChecklists.set(type, parsed);
    } catch (error) {
      console.error(`Failed to load review checklist ${type}:`, error);
    }
  }
}

// Load review checklists on startup
loadReviewChecklists();

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

const generateReleaseNotesSchema = z.object({
  spaceId: z.string(),
  version: z.string(),
  githubRepo: z.string().optional(), // e.g., "owner/repo"
  fromTag: z.string().optional(), // e.g., "v1.0.0"
  toTag: z.string().optional(), // e.g., "v1.1.0" or "HEAD"
  startDate: z.string().optional(), // ISO date for Filo/Hans query
  endDate: z.string().optional(), // ISO date
  includeGithub: z.boolean().default(true),
  includeFilo: z.boolean().default(true),
  includeHans: z.boolean().default(true),
});

const reviewDocSchema = z.object({
  docId: z.string(),
  checklistType: z.enum(['accessibility', 'security', 'gdpr', 'design-parity', 'performance']),
  reviewerId: z.string().optional(),
  reviewerName: z.string().optional(),
});

const updateReviewSchema = z.object({
  reviewId: z.string(),
  itemId: z.string(),
  status: z.enum(['pass', 'fail', 'n/a']),
  notes: z.string().optional(),
  suggestedFix: z.string().optional(),
  owner: z.string().optional(),
});

const completeReviewSchema = z.object({
  reviewId: z.string(),
  status: z.enum(['approved', 'changes-requested']),
  reviewerSignature: z.string(),
  summary: z.string().optional(),
});

const listReviewsSchema = z.object({
  docId: z.string(),
  checklistType: z.enum(['accessibility', 'security', 'gdpr', 'design-parity', 'performance', 'all']).default('all'),
});

// ---------- R7: API & Component Docs Schemas ----------

const importOpenAPISchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  specUrl: z.string().optional(), // URL to fetch spec from
  specContent: z.string().optional(), // Or direct spec content (JSON/YAML)
  projectId: z.string().optional(),
  docId: z.string().optional(),
  webhookUrl: z.string().optional(),
  webhookSecret: z.string().optional(),
  sourceRepo: z.string().optional(), // e.g., "org/repo"
  sourceBranch: z.string().optional(),
  sourcePath: z.string().optional(),
});

const syncFigmaComponentsSchema = z.object({
  figmaFileId: z.string(), // Figma file ID
  figmaAccessToken: z.string(), // User's Figma personal access token
  name: z.string(),
  projectId: z.string().optional(),
  docId: z.string().optional(),
});

const listAPIEndpointsSchema = z.object({
  specId: z.string(),
  method: z.string().optional(), // Filter by HTTP method
  tags: z.array(z.string()).optional(), // Filter by tags
  limit: z.number().default(50),
});

const listFigmaComponentsSchema = z.object({
  fileId: z.string(),
  type: z.enum(['COMPONENT', 'COMPONENT_SET', 'all']).default('all'),
  limit: z.number().default(50),
});

const listAPISpecsSchema = z.object({
  projectId: z.string().optional(),
  limit: z.number().default(20),
});

const listFigmaFilesSchema = z.object({
  projectId: z.string().optional(),
  limit: z.number().default(20),
});

// R8: Template Management
const listTemplatesSchema = z.object({
  category: z.string().optional(),
  includeBuiltIn: z.boolean().default(true),
  limit: z.number().default(50),
});

const getTemplateSchema = z.object({
  templateId: z.string(),
});

const createTemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  type: z.string().default('documentation'),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().default(false),
  })),
  template: z.string(),
});

const updateTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().default(false),
  })).optional(),
  template: z.string().optional(),
});

const deleteTemplateSchema = z.object({
  templateId: z.string(),
});

const syncBuiltInTemplatesSchema = z.object({
  force: z.boolean().default(false),
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

async function handleGenerateReleaseNotes(args: z.infer<typeof generateReleaseNotesSchema>) {
  const startTime = Date.now();

  // Verify space exists
  const spaceRef = db.collection('stea_doc_spaces').doc(args.spaceId);
  const space = await spaceRef.get();
  if (!space.exists) {
    throw new Error(`Ruby space not found: ${args.spaceId}`);
  }

  // Determine date range
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (args.startDate) {
    startDate = new Date(args.startDate);
  }
  if (args.endDate) {
    endDate = new Date(args.endDate);
  } else {
    endDate = new Date(); // Default to now
  }

  const sections = {
    features: [] as string[],
    improvements: [] as string[],
    fixes: [] as string[],
    tests: [] as string[],
    knownIssues: [] as string[],
  };

  // Query Filo for Done cards
  if (args.includeFilo) {
    try {
      let filoQuery = db.collection('stea_cards')
        .where('tenantId', '==', TENANT_ID)
        .where('statusColumn', '==', 'Done');

      // Note: Firestore doesn't support range queries on dates easily without composite indexes
      // For now, we'll fetch all Done cards and filter client-side
      const filoSnap = await filoQuery.get();

      filoSnap.forEach((doc) => {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.();

        // Filter by date if provided
        if (startDate && updatedAt && updatedAt < startDate) return;
        if (endDate && updatedAt && updatedAt > endDate) return;

        const title = data.title || 'Untitled';
        const cardType = data.type || 'feature';
        const epicId = data.epicId || '';
        const featureId = data.featureId || '';

        // Build link
        const link = `[${title}](https://www.arcturusdc.com/apps/stea/filo?card=${doc.id})`;

        // Categorize by type
        if (cardType === 'bug') {
          sections.fixes.push(`- ${link}`);
        } else if (cardType === 'feature') {
          sections.features.push(`- ${link}`);
        } else {
          sections.improvements.push(`- ${link}`);
        }
      });
    } catch (error) {
      console.error('Error fetching Filo cards:', error);
    }
  }

  // Query Hans for test results
  if (args.includeHans) {
    try {
      let hansQuery = db.collection('toume_test_sessions')
        .where('tenantId', '==', TENANT_ID)
        .orderBy('timestamp', 'desc')
        .limit(10); // Get recent test sessions

      const hansSnap = await hansQuery.get();

      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;

      hansSnap.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.();

        // Filter by date
        if (startDate && timestamp && timestamp < startDate) return;
        if (endDate && timestamp && timestamp > endDate) return;

        const summary = data.summary || {};
        totalTests += summary.total || 0;
        passedTests += summary.passed || 0;
        failedTests += summary.failed || 0;
      });

      if (totalTests > 0) {
        const passRate = ((passedTests / totalTests) * 100).toFixed(1);
        sections.tests.push(`- Total tests run: ${totalTests}`);
        sections.tests.push(`- Passed: ${passedTests} (${passRate}%)`);
        sections.tests.push(`- Failed: ${failedTests}`);
      }
    } catch (error) {
      console.error('Error fetching Hans test results:', error);
    }
  }

  // TODO: GitHub integration (requires GITHUB_TOKEN env var)
  // For now, this is optional and can be added later
  if (args.includeGithub && args.githubRepo && args.fromTag && args.toTag) {
    sections.improvements.push(`- GitHub PR integration coming soon (${args.fromTag}...${args.toTag})`);
  }

  // Build markdown using template variables
  const releaseDate = endDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

  const variables = {
    version: args.version,
    releaseDate: releaseDate,
    features: sections.features.length > 0 ? sections.features.join('\n') : 'No new features in this release',
    improvements: sections.improvements.length > 0 ? sections.improvements.join('\n') : 'No improvements in this release',
    fixes: sections.fixes.length > 0 ? sections.fixes.join('\n') : 'No bug fixes in this release',
    breaking: '', // Could be extracted from card labels/tags
    knownIssues: sections.knownIssues.length > 0 ? sections.knownIssues.join('\n') : 'No known issues at this time',
  };

  // Load and apply release notes template
  const template = templates.get('releasenotes');
  if (!template) {
    throw new Error('Release notes template not found');
  }

  const markdown = applyTemplate(template.template, variables);

  // Add test results section manually (not in template variables)
  let enhancedMarkdown = markdown;
  if (sections.tests.length > 0) {
    const testSection = `\n## 📊 Test Results\n${sections.tests.join('\n')}\n`;
    // Insert after Known Issues section
    enhancedMarkdown = markdown.replace('## 🔗 Links & Evidence', `${testSection}\n## 🔗 Links & Evidence`);
  }

  // Convert to TipTap JSON
  const contentJson = markdownToTipTap(enhancedMarkdown);

  // Create document
  const docTitle = `Release Notes - ${args.version}`;
  const payload = {
    title: docTitle,
    content: contentJson,
    type: 'documentation',
    spaceId: args.spaceId,
    tenantId: TENANT_ID,
    draft: false, // Release notes are published
    templateType: 'releasenotes',
    templateVersion: '1.0',
    metadata: {
      version: args.version,
      releaseDate: releaseDate,
      generatedFrom: {
        filo: args.includeFilo,
        hans: args.includeHans,
        github: args.includeGithub,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
    createdBy: CREATED_BY,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: CREATED_BY,
  };

  const ref = await db.collection('stea_docs').add(payload);
  const elapsed = Date.now() - startTime;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          documentId: ref.id,
          title: docTitle,
          version: args.version,
          stats: {
            features: sections.features.length,
            improvements: sections.improvements.length,
            fixes: sections.fixes.length,
            testsRun: sections.tests.length > 0,
          },
          generationTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

// ---------- Review Handlers ----------

async function handleReviewDoc(args: z.infer<typeof reviewDocSchema>) {
  const startTime = Date.now();

  // Verify document exists
  const docRef = db.collection('stea_docs').doc(args.docId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error(`Document not found: ${args.docId}`);
  }
  const docData = doc.data();

  // Verify tenant access
  if (docData?.tenantId !== TENANT_ID) {
    throw new Error('Access denied: Document belongs to a different tenant');
  }

  // Load checklist
  const checklist = reviewChecklists.get(args.checklistType);
  if (!checklist) {
    throw new Error(`Checklist not found: ${args.checklistType}`);
  }

  // Initialize review items from checklist
  const items = checklist.items.map(item => ({
    id: item.id,
    question: item.question,
    category: item.category,
    severity: item.severity,
    guidance: item.guidance,
    status: 'pending' as const,
    notes: '',
    suggestedFix: '',
    owner: '',
  }));

  // Create review document
  const payload = {
    docId: args.docId,
    docTitle: docData?.title || 'Untitled',
    checklistType: args.checklistType,
    checklistName: checklist.name,
    items: items,
    status: 'in-review' as const,
    reviewerId: args.reviewerId || CREATED_BY,
    reviewerName: args.reviewerName || 'Unknown',
    tenantId: TENANT_ID,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection('stea_reviews').add(payload);
  const elapsed = Date.now() - startTime;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          reviewId: ref.id,
          docId: args.docId,
          checklistType: args.checklistType,
          checklistName: checklist.name,
          totalItems: items.length,
          status: 'in-review',
          creationTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleUpdateReview(args: z.infer<typeof updateReviewSchema>) {
  const startTime = Date.now();

  // Fetch review
  const reviewRef = db.collection('stea_reviews').doc(args.reviewId);
  const review = await reviewRef.get();
  if (!review.exists) {
    throw new Error(`Review not found: ${args.reviewId}`);
  }
  const reviewData = review.data();

  // Verify tenant access
  if (reviewData?.tenantId !== TENANT_ID) {
    throw new Error('Access denied: Review belongs to a different tenant');
  }

  // Find and update the item
  const items = reviewData?.items || [];
  const itemIndex = items.findIndex((item: any) => item.id === args.itemId);
  if (itemIndex === -1) {
    throw new Error(`Review item not found: ${args.itemId}`);
  }

  items[itemIndex] = {
    ...items[itemIndex],
    status: args.status,
    notes: args.notes || items[itemIndex].notes,
    suggestedFix: args.suggestedFix || items[itemIndex].suggestedFix,
    owner: args.owner || items[itemIndex].owner,
  };

  // Update review
  await reviewRef.update({
    items: items,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const elapsed = Date.now() - startTime;

  // Calculate progress
  const pending = items.filter((i: any) => i.status === 'pending').length;
  const passed = items.filter((i: any) => i.status === 'pass').length;
  const failed = items.filter((i: any) => i.status === 'fail').length;
  const na = items.filter((i: any) => i.status === 'n/a').length;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          reviewId: args.reviewId,
          itemId: args.itemId,
          itemStatus: args.status,
          progress: {
            pending,
            passed,
            failed,
            na,
            total: items.length,
          },
          updateTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleCompleteReview(args: z.infer<typeof completeReviewSchema>) {
  const startTime = Date.now();

  // Fetch review
  const reviewRef = db.collection('stea_reviews').doc(args.reviewId);
  const review = await reviewRef.get();
  if (!review.exists) {
    throw new Error(`Review not found: ${args.reviewId}`);
  }
  const reviewData = review.data();

  // Verify tenant access
  if (reviewData?.tenantId !== TENANT_ID) {
    throw new Error('Access denied: Review belongs to a different tenant');
  }

  // Check if all items are reviewed
  const items = reviewData?.items || [];
  const pendingItems = items.filter((i: any) => i.status === 'pending').length;
  if (pendingItems > 0) {
    throw new Error(`Cannot complete review: ${pendingItems} items are still pending`);
  }

  // Update review with completion status
  await reviewRef.update({
    status: args.status,
    reviewerSignature: args.reviewerSignature,
    summary: args.summary || '',
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Calculate final stats
  const passed = items.filter((i: any) => i.status === 'pass').length;
  const failed = items.filter((i: any) => i.status === 'fail').length;
  const na = items.filter((i: any) => i.status === 'n/a').length;
  const critical = items.filter((i: any) => i.severity === 'Critical' && i.status === 'fail').length;

  const elapsed = Date.now() - startTime;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          reviewId: args.reviewId,
          status: args.status,
          summary: args.summary || 'No summary provided',
          stats: {
            total: items.length,
            passed,
            failed,
            na,
            criticalFailures: critical,
          },
          completionTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleListReviews(args: z.infer<typeof listReviewsSchema>) {
  const startTime = Date.now();

  // Build query
  let query = db.collection('stea_reviews')
    .where('tenantId', '==', TENANT_ID)
    .where('docId', '==', args.docId);

  // Filter by checklist type if specified
  if (args.checklistType !== 'all') {
    query = query.where('checklistType', '==', args.checklistType);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  const elapsed = Date.now() - startTime;

  const reviews = snapshot.docs.map(doc => {
    const data = doc.data();
    const items = data.items || [];
    const pending = items.filter((i: any) => i.status === 'pending').length;
    const passed = items.filter((i: any) => i.status === 'pass').length;
    const failed = items.filter((i: any) => i.status === 'fail').length;
    const na = items.filter((i: any) => i.status === 'n/a').length;

    return {
      reviewId: doc.id,
      docId: data.docId,
      docTitle: data.docTitle,
      checklistType: data.checklistType,
      checklistName: data.checklistName,
      status: data.status,
      reviewerId: data.reviewerId,
      reviewerName: data.reviewerName,
      reviewerSignature: data.reviewerSignature,
      summary: data.summary,
      progress: {
        total: items.length,
        pending,
        passed,
        failed,
        na,
      },
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          docId: args.docId,
          checklistType: args.checklistType,
          count: reviews.length,
          reviews,
          queryTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

// ---------- R7: API & Component Docs Handlers ----------

// Helper: Generate SHA256 hash
function generateSHA256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Helper: Generate code samples for API endpoint
function generateCodeSamples(path: string, method: string, parameters: any[], requestBody: any, security: any[]): any {
  const hasPathParams = parameters.some(p => p.in === 'path');
  const queryParams = parameters.filter(p => p.in === 'query');
  const headerParams = parameters.filter(p => p.in === 'header');

  // Build example path with path parameters replaced
  let examplePath = path;
  parameters.filter(p => p.in === 'path').forEach(p => {
    examplePath = examplePath.replace(`{${p.name}}`, `<${p.name}>`);
  });

  // Build query string
  let queryString = '';
  if (queryParams.length > 0) {
    queryString = '?' + queryParams.map(p => `${p.name}=<${p.name}>`).join('&');
  }

  // cURL sample
  let curlSample = `curl -X ${method.toUpperCase()} "https://api.example.com${examplePath}${queryString}"`;

  // Add headers
  if (security && security.length > 0) {
    const authType = security[0].type;
    if (authType === 'bearer' || authType === 'http') {
      curlSample += ` \\\n  -H "Authorization: Bearer <token>"`;
    } else if (authType === 'apiKey') {
      curlSample += ` \\\n  -H "${security[0].name}: <api-key>"`;
    }
  }

  headerParams.forEach(p => {
    curlSample += ` \\\n  -H "${p.name}: <${p.name}>"`;
  });

  // Add request body if applicable
  if (requestBody && requestBody.required) {
    curlSample += ` \\\n  -H "Content-Type: ${requestBody.contentType || 'application/json'}"`;
    curlSample += ` \\\n  -d '${JSON.stringify(requestBody.examples || {}, null, 2)}'`;
  }

  // JavaScript/Fetch sample
  let jsSample = `fetch('https://api.example.com${examplePath}${queryString}', {\n  method: '${method.toUpperCase()}'`;

  if (security || headerParams.length > 0 || requestBody) {
    jsSample += `,\n  headers: {`;
    if (security && security.length > 0) {
      jsSample += `\n    'Authorization': 'Bearer <token>',`;
    }
    headerParams.forEach(p => {
      jsSample += `\n    '${p.name}': '<${p.name}>',`;
    });
    if (requestBody) {
      jsSample += `\n    'Content-Type': '${requestBody.contentType || 'application/json'}'`;
    }
    jsSample += `\n  }`;
  }

  if (requestBody && requestBody.required) {
    jsSample += `,\n  body: JSON.stringify(${JSON.stringify(requestBody.examples || {}, null, 2)})`;
  }

  jsSample += `\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`;

  // TypeScript sample (similar to JS but with types)
  let tsSample = jsSample.replace('fetch(', 'const response = await fetch(');
  tsSample = tsSample.replace('.then(res => res.json())\n  .then(data => console.log(data));', '');
  tsSample += `\nconst data = await response.json();`;

  return {
    curl: curlSample,
    javascript: jsSample,
    typescript: tsSample,
  };
}

// Helper: Generate anchor for endpoint
function generateEndpointAnchor(method: string, path: string): string {
  return `${method.toLowerCase()}-${path.replace(/\//g, '-').replace(/[{}]/g, '')}`;
}

async function handleImportOpenAPI(args: z.infer<typeof importOpenAPISchema>) {
  const startTime = Date.now();

  try {
    // Validate inputs
    if (!args.specUrl && !args.specContent) {
      throw new Error('Either specUrl or specContent must be provided');
    }

    // Fetch or use provided spec content
    let specContent: string;
    if (args.specUrl) {
      const response = await axios.get(args.specUrl);
      specContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } else {
      specContent = args.specContent!;
    }

    // Generate SHA256 hash
    const sha256 = generateSHA256(specContent);

    // Parse OpenAPI spec
    let parsedSpec: any;
    try {
      parsedSpec = await SwaggerParser.validate(JSON.parse(specContent));
    } catch (jsonError) {
      // Try YAML
      try {
        parsedSpec = await SwaggerParser.validate(yaml.load(specContent) as any);
      } catch (yamlError) {
        throw new Error('Invalid OpenAPI spec format. Must be valid JSON or YAML.');
      }
    }

    const openApiVersion = parsedSpec.openapi || parsedSpec.swagger || '3.0.0';
    const specVersion = parsedSpec.info?.version || '1.0.0';

    // Upload spec to Cloud Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const storagePath = `ruby/r7/api-specs/${TENANT_ID}/${Date.now()}/spec.json`;
    const file = bucket.file(storagePath);

    await file.save(JSON.stringify(parsedSpec, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          tenantId: TENANT_ID,
          version: specVersion,
        },
      },
    });

    const storageUrl = `gs://${bucket.name}/${storagePath}`;

    // Create stea_api_specs document
    const specPayload = {
      tenantId: TENANT_ID,
      projectId: args.projectId || null,
      docId: args.docId || null,
      name: args.name,
      description: args.description || parsedSpec.info?.description || null,
      version: specVersion,
      openApiVersion,
      storageUrl,
      storageBucket: bucket.name,
      storagePath,
      fileSize: Buffer.byteLength(specContent),
      sha256,
      parseStatus: 'parsing' as const,
      parseError: null,
      parsedAt: null,
      webhookUrl: args.webhookUrl || null,
      webhookSecret: args.webhookSecret || null,
      sourceRepo: args.sourceRepo || null,
      sourceBranch: args.sourceBranch || null,
      sourcePath: args.sourcePath || null,
      endpointCount: 0,
      brokenLinkCount: 0,
      lastValidated: null,
      createdBy: CREATED_BY,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: CREATED_BY,
      updatedAt: FieldValue.serverTimestamp(),
      searchTokens: generateSearchTokens(args.name),
    };

    const specRef = await db.collection('stea_api_specs').add(specPayload);
    const specId = specRef.id;

    // Parse endpoints asynchronously
    const endpoints: any[] = [];
    const paths = parsedSpec.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          const op = operation as any;

          const parameters = (op.parameters || []).map((p: any) => ({
            name: p.name,
            in: p.in,
            required: p.required || false,
            schema: p.schema || {},
            description: p.description || null,
          }));

          const requestBody = op.requestBody ? {
            required: op.requestBody.required || false,
            contentType: Object.keys(op.requestBody.content || {})[0] || 'application/json',
            schema: op.requestBody.content?.[Object.keys(op.requestBody.content)[0]]?.schema || {},
            examples: op.requestBody.content?.[Object.keys(op.requestBody.content)[0]]?.examples || null,
          } : null;

          const responses = Object.entries(op.responses || {}).map(([statusCode, resp]: [string, any]) => ({
            statusCode,
            description: resp.description || '',
            contentType: Object.keys(resp.content || {})[0] || null,
            schema: resp.content?.[Object.keys(resp.content || {})[0]]?.schema || null,
            examples: resp.content?.[Object.keys(resp.content || {})[0]]?.examples || null,
          }));

          const security = (op.security || parsedSpec.security || []).flatMap((sec: any) =>
            Object.keys(sec).map(key => {
              const scheme = parsedSpec.components?.securitySchemes?.[key];
              return scheme ? {
                type: scheme.type,
                name: scheme.name || key,
                in: scheme.in,
              } : null;
            }).filter(Boolean)
          );

          const codeSamples = generateCodeSamples(path, method, parameters, requestBody, security);
          const anchor = generateEndpointAnchor(method, path);

          const endpointPayload = {
            specId,
            tenantId: TENANT_ID,
            path,
            method: method.toUpperCase(),
            operationId: op.operationId || null,
            summary: op.summary || '',
            description: op.description || null,
            tags: op.tags || [],
            parameters,
            requestBody,
            responses,
            security,
            codeSamples,
            anchor,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          await db.collection('stea_api_endpoints').add(endpointPayload);
          endpoints.push(endpointPayload);
        }
      }
    }

    // Update spec with endpoint count and parse status
    await specRef.update({
      endpointCount: endpoints.length,
      parseStatus: 'success',
      parsedAt: FieldValue.serverTimestamp(),
    });

    const elapsed = Date.now() - startTime;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            specId,
            name: args.name,
            version: specVersion,
            openApiVersion,
            endpointCount: endpoints.length,
            storageUrl,
            parseTime: `${elapsed}ms`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    throw new Error(`Failed to import OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'} (${elapsed}ms)`);
  }
}

async function handleSyncFigmaComponents(args: z.infer<typeof syncFigmaComponentsSchema>) {
  const startTime = Date.now();

  try {
    const { figmaFileId, figmaAccessToken, name, projectId, docId } = args;

    // Fetch Figma file metadata
    const fileResponse = await axios.get(`https://api.figma.com/v1/files/${figmaFileId}`, {
      headers: { 'X-Figma-Token': figmaAccessToken },
    });

    const fileData = fileResponse.data;
    const fileName = fileData.name;
    const fileVersion = fileData.version;
    const fileLastModified = new Date(fileData.lastModified);

    // Create or update stea_figma_files document
    const filePayload = {
      id: figmaFileId,
      tenantId: TENANT_ID,
      projectId: projectId || null,
      docId: docId || null,
      name: name || fileName,
      key: figmaFileId,
      url: `https://www.figma.com/file/${figmaFileId}`,
      version: fileVersion,
      lastModified: fileLastModified,
      accessToken: figmaAccessToken, // TODO: Encrypt this
      webhookId: null,
      syncStatus: 'syncing' as const,
      syncError: null,
      lastSyncedAt: null,
      nextSyncAt: null,
      componentCount: 0,
      styleCount: 0,
      createdBy: CREATED_BY,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: CREATED_BY,
      updatedAt: FieldValue.serverTimestamp(),
      searchTokens: generateSearchTokens(name || fileName),
    };

    await db.collection('stea_figma_files').doc(figmaFileId).set(filePayload, { merge: true });

    // Extract components from file
    const components: any[] = [];
    const extractComponents = (node: any) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push(node);
      }
      if (node.children) {
        node.children.forEach(extractComponents);
      }
    };

    fileData.document.children.forEach(extractComponents);

    // Fetch component details including thumbnails
    const componentIds = components.map(c => c.id).join(',');
    let thumbnailUrls: any = {};

    if (componentIds) {
      try {
        const imageResponse = await axios.get(
          `https://api.figma.com/v1/images/${figmaFileId}?ids=${componentIds}&format=png&scale=2`,
          { headers: { 'X-Figma-Token': figmaAccessToken } }
        );
        thumbnailUrls = imageResponse.data.images || {};
      } catch (err) {
        console.error('Failed to fetch component thumbnails:', err);
      }
    }

    // Save components to Firestore
    for (const component of components) {
      const variants = component.type === 'COMPONENT_SET' ?
        (component.children || []).map((child: any) => ({
          name: child.name,
          values: [], // Would need more parsing
        })) : undefined;

      // Extract design tokens (simplified - would need more sophisticated parsing)
      const tokens = {
        colors: [],
        typography: [],
        spacing: [],
      };

      const componentPayload = {
        fileId: figmaFileId,
        tenantId: TENANT_ID,
        nodeId: component.id,
        name: component.name,
        description: component.description || null,
        type: component.type,
        variants,
        tokens,
        thumbnailUrl: thumbnailUrls[component.id] || null,
        thumbnailStoragePath: null,
        previewUrl: thumbnailUrls[component.id] || null,
        figmaUrl: `https://www.figma.com/file/${figmaFileId}?node-id=${component.id}`,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await db.collection('stea_figma_components').add(componentPayload);
    }

    // Update file sync status
    await db.collection('stea_figma_files').doc(figmaFileId).update({
      syncStatus: 'success',
      lastSyncedAt: FieldValue.serverTimestamp(),
      componentCount: components.length,
    });

    const elapsed = Date.now() - startTime;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            fileId: figmaFileId,
            fileName,
            version: fileVersion,
            componentCount: components.length,
            syncTime: `${elapsed}ms`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    throw new Error(`Failed to sync Figma components: ${error instanceof Error ? error.message : 'Unknown error'} (${elapsed}ms)`);
  }
}

async function handleListAPIEndpoints(args: z.infer<typeof listAPIEndpointsSchema>) {
  const startTime = Date.now();

  let query = db.collection('stea_api_endpoints')
    .where('tenantId', '==', TENANT_ID)
    .where('specId', '==', args.specId);

  if (args.method) {
    query = query.where('method', '==', args.method.toUpperCase());
  }

  if (args.tags && args.tags.length > 0) {
    query = query.where('tags', 'array-contains-any', args.tags);
  }

  const snapshot = await query.limit(args.limit).get();
  const elapsed = Date.now() - startTime;

  const endpoints = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      path: data.path,
      method: data.method,
      operationId: data.operationId,
      summary: data.summary,
      description: data.description,
      tags: data.tags,
      anchor: data.anchor,
      parametersCount: (data.parameters || []).length,
      hasRequestBody: !!data.requestBody,
      responsesCount: (data.responses || []).length,
    };
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          specId: args.specId,
          count: endpoints.length,
          endpoints,
          queryTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleListFigmaComponents(args: z.infer<typeof listFigmaComponentsSchema>) {
  const startTime = Date.now();

  let query = db.collection('stea_figma_components')
    .where('tenantId', '==', TENANT_ID)
    .where('fileId', '==', args.fileId);

  if (args.type !== 'all') {
    query = query.where('type', '==', args.type);
  }

  const snapshot = await query.limit(args.limit).get();
  const elapsed = Date.now() - startTime;

  const components = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      nodeId: data.nodeId,
      name: data.name,
      description: data.description,
      type: data.type,
      variantsCount: (data.variants || []).length,
      thumbnailUrl: data.thumbnailUrl,
      figmaUrl: data.figmaUrl,
    };
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          fileId: args.fileId,
          count: components.length,
          components,
          queryTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleListAPISpecs(args: z.infer<typeof listAPISpecsSchema>) {
  const startTime = Date.now();

  let query = db.collection('stea_api_specs')
    .where('tenantId', '==', TENANT_ID);

  if (args.projectId) {
    query = query.where('projectId', '==', args.projectId);
  }

  const snapshot = await query.limit(args.limit).orderBy('createdAt', 'desc').get();
  const elapsed = Date.now() - startTime;

  const specs = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      version: data.version,
      openApiVersion: data.openApiVersion,
      endpointCount: data.endpointCount,
      parseStatus: data.parseStatus,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          count: specs.length,
          specs,
          queryTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleListFigmaFiles(args: z.infer<typeof listFigmaFilesSchema>) {
  const startTime = Date.now();

  let query = db.collection('stea_figma_files')
    .where('tenantId', '==', TENANT_ID);

  if (args.projectId) {
    query = query.where('projectId', '==', args.projectId);
  }

  const snapshot = await query.limit(args.limit).orderBy('createdAt', 'desc').get();
  const elapsed = Date.now() - startTime;

  const files = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      url: data.url,
      version: data.version,
      componentCount: data.componentCount,
      syncStatus: data.syncStatus,
      lastSyncedAt: data.lastSyncedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          count: files.length,
          files,
          queryTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

// ---------- R8: Template Management Handlers ----------

async function handleListTemplates(args: z.infer<typeof listTemplatesSchema>) {
  const startTime = Date.now();

  let query = db.collection('stea_doc_templates')
    .where('tenantId', '==', TENANT_ID);

  // Optionally filter by category
  if (args.category) {
    query = query.where('category', '==', args.category);
  }

  const tenantSnapshot = await query.limit(args.limit).orderBy('createdAt', 'desc').get();

  // Also get built-in templates if requested
  let builtInTemplates: any[] = [];
  if (args.includeBuiltIn) {
    let builtInQuery = db.collection('stea_doc_templates')
      .where('tenantId', '==', null)
      .where('isBuiltIn', '==', true);

    if (args.category) {
      builtInQuery = builtInQuery.where('category', '==', args.category);
    }

    const builtInSnapshot = await builtInQuery.orderBy('name', 'asc').get();
    builtInTemplates = builtInSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      source: 'built-in',
    }));
  }

  const customTemplates = tenantSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    source: 'custom',
  }));

  const allTemplates = [...builtInTemplates, ...customTemplates];
  const elapsed = Date.now() - startTime;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          count: allTemplates.length,
          builtInCount: builtInTemplates.length,
          customCount: customTemplates.length,
          templates: allTemplates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            type: t.type,
            isBuiltIn: t.isBuiltIn || false,
            source: t.source,
            variableCount: t.variables?.length || 0,
          })),
          queryTime: `${elapsed}ms`,
        }, null, 2),
      },
    ],
  };
}

async function handleGetTemplate(args: z.infer<typeof getTemplateSchema>) {
  const doc = await db.collection('stea_doc_templates').doc(args.templateId).get();

  if (!doc.exists) {
    throw new Error(`Template not found: ${args.templateId}`);
  }

  const data = doc.data()!;

  // Check access: user can access built-in templates or their own tenant's templates
  if (data.tenantId !== null && data.tenantId !== TENANT_ID) {
    throw new Error('Access denied: Template belongs to a different tenant');
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          id: doc.id,
          ...data,
        }, null, 2),
      },
    ],
  };
}

async function handleCreateTemplate(args: z.infer<typeof createTemplateSchema>) {
  const template = {
    tenantId: TENANT_ID,
    name: args.name,
    description: args.description,
    category: args.category,
    type: args.type,
    variables: args.variables,
    template: args.template,
    isBuiltIn: false,
    version: 1,
    createdBy: CREATED_BY,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('stea_doc_templates').add(template);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          templateId: docRef.id,
          message: `Template "${args.name}" created successfully`,
        }, null, 2),
      },
    ],
  };
}

async function handleUpdateTemplate(args: z.infer<typeof updateTemplateSchema>) {
  const docRef = db.collection('stea_doc_templates').doc(args.templateId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Template not found: ${args.templateId}`);
  }

  const data = doc.data()!;

  // Can't update built-in templates
  if (data.isBuiltIn) {
    throw new Error('Cannot update built-in templates');
  }

  // Can only update templates in your tenant
  if (data.tenantId !== TENANT_ID) {
    throw new Error('Access denied: Template belongs to a different tenant');
  }

  const updates: any = {
    updatedAt: FieldValue.serverTimestamp(),
    version: FieldValue.increment(1),
  };

  if (args.name) updates.name = args.name;
  if (args.description) updates.description = args.description;
  if (args.category) updates.category = args.category;
  if (args.variables) updates.variables = args.variables;
  if (args.template) updates.template = args.template;

  await docRef.update(updates);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          templateId: args.templateId,
          message: 'Template updated successfully',
        }, null, 2),
      },
    ],
  };
}

async function handleDeleteTemplate(args: z.infer<typeof deleteTemplateSchema>) {
  const docRef = db.collection('stea_doc_templates').doc(args.templateId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Template not found: ${args.templateId}`);
  }

  const data = doc.data()!;

  // Can't delete built-in templates
  if (data.isBuiltIn) {
    throw new Error('Cannot delete built-in templates');
  }

  // Can only delete templates in your tenant
  if (data.tenantId !== TENANT_ID) {
    throw new Error('Access denied: Template belongs to a different tenant');
  }

  await docRef.delete();

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          templateId: args.templateId,
          message: 'Template deleted successfully',
        }, null, 2),
      },
    ],
  };
}

async function handleSyncBuiltInTemplates(args: z.infer<typeof syncBuiltInTemplatesSchema>) {
  const fs = await import('fs/promises');
  const path = await import('path');
  const yaml = await import('js-yaml');

  const templatesDir = path.join(__dirname, '../servers/templates');
  const files = await fs.readdir(templatesDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml'));

  const results = [];

  for (const file of yamlFiles) {
    const filePath = path.join(templatesDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    const templateData: any = yaml.load(content);

    const category = file.replace('.yaml', '');
    const templateId = `built-in-${category}`;

    // Check if template already exists
    const existingDoc = await db.collection('stea_doc_templates').doc(templateId).get();

    if (existingDoc.exists && !args.force) {
      results.push({
        file,
        status: 'skipped',
        message: 'Already exists (use force=true to overwrite)',
      });
      continue;
    }

    const template = {
      tenantId: null,
      name: templateData.name,
      description: templateData.description,
      category,
      type: templateData.type || 'documentation',
      variables: templateData.variables || [],
      template: templateData.template,
      isBuiltIn: true,
      version: 1,
      createdBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('stea_doc_templates').doc(templateId).set(template);

    results.push({
      file,
      status: 'synced',
      templateId,
      name: templateData.name,
    });
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          templatesProcessed: results.length,
          results,
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
      {
        name: 'stea.generateReleaseNotes',
        description: 'Generate comprehensive release notes from Filo Done cards, Hans test results, and optionally GitHub PRs',
        inputSchema: {
          type: 'object',
          properties: {
            spaceId: { type: 'string', description: 'Target Ruby space ID' },
            version: { type: 'string', description: 'Release version (e.g., "v1.2.0")' },
            githubRepo: { type: 'string', description: 'GitHub repo (e.g., "owner/repo") - optional' },
            fromTag: { type: 'string', description: 'Start tag for GitHub PRs (e.g., "v1.1.0") - optional' },
            toTag: { type: 'string', description: 'End tag for GitHub PRs (e.g., "v1.2.0" or "HEAD") - optional' },
            startDate: { type: 'string', description: 'Start date for Filo/Hans query (ISO format) - optional' },
            endDate: { type: 'string', description: 'End date for Filo/Hans query (ISO format, defaults to now) - optional' },
            includeGithub: { type: 'boolean', description: 'Include GitHub PRs (default: true)' },
            includeFilo: { type: 'boolean', description: 'Include Filo Done cards (default: true)' },
            includeHans: { type: 'boolean', description: 'Include Hans test results (default: true)' },
          },
          required: ['spaceId', 'version'],
        },
      },
      {
        name: 'stea.reviewDoc',
        description: 'Start a review for a Ruby document using a predefined checklist',
        inputSchema: {
          type: 'object',
          properties: {
            docId: { type: 'string', description: 'Ruby document ID to review' },
            checklistType: {
              type: 'string',
              enum: ['accessibility', 'security', 'gdpr', 'design-parity', 'performance'],
              description: 'Type of review checklist to use',
            },
            reviewerId: { type: 'string', description: 'Reviewer user ID (optional)' },
            reviewerName: { type: 'string', description: 'Reviewer name (optional)' },
          },
          required: ['docId', 'checklistType'],
        },
      },
      {
        name: 'stea.updateReview',
        description: 'Update a review checklist item with status and notes',
        inputSchema: {
          type: 'object',
          properties: {
            reviewId: { type: 'string', description: 'Review ID' },
            itemId: { type: 'string', description: 'Checklist item ID to update' },
            status: {
              type: 'string',
              enum: ['pass', 'fail', 'n/a'],
              description: 'Review item status',
            },
            notes: { type: 'string', description: 'Reviewer notes (optional)' },
            suggestedFix: { type: 'string', description: 'Suggested fix for failed items (optional)' },
            owner: { type: 'string', description: 'Person assigned to fix (optional)' },
          },
          required: ['reviewId', 'itemId', 'status'],
        },
      },
      {
        name: 'stea.completeReview',
        description: 'Complete a review with final status and signature',
        inputSchema: {
          type: 'object',
          properties: {
            reviewId: { type: 'string', description: 'Review ID' },
            status: {
              type: 'string',
              enum: ['approved', 'changes-requested'],
              description: 'Final review status',
            },
            reviewerSignature: { type: 'string', description: 'Reviewer signature/name' },
            summary: { type: 'string', description: 'Review summary (optional)' },
          },
          required: ['reviewId', 'status', 'reviewerSignature'],
        },
      },
      {
        name: 'stea.listReviews',
        description: 'List all reviews for a Ruby document',
        inputSchema: {
          type: 'object',
          properties: {
            docId: { type: 'string', description: 'Ruby document ID' },
            checklistType: {
              type: 'string',
              enum: ['accessibility', 'security', 'gdpr', 'design-parity', 'performance', 'all'],
              description: 'Filter by checklist type (default: all)',
            },
          },
          required: ['docId'],
        },
      },
      {
        name: 'stea.importOpenAPI',
        description: 'Import an OpenAPI spec file (JSON/YAML) and parse it into navigable API documentation (R7)',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name for this API spec' },
            description: { type: 'string', description: 'Description (optional)' },
            specUrl: { type: 'string', description: 'URL to fetch OpenAPI spec from (optional)' },
            specContent: { type: 'string', description: 'Direct OpenAPI spec content as JSON or YAML string (optional)' },
            projectId: { type: 'string', description: 'Associated project ID (optional)' },
            docId: { type: 'string', description: 'Linked Ruby document ID (optional)' },
            webhookUrl: { type: 'string', description: 'Webhook URL for automatic updates (optional)' },
            webhookSecret: { type: 'string', description: 'Webhook secret for verification (optional)' },
            sourceRepo: { type: 'string', description: 'Source repository (e.g., "org/repo") (optional)' },
            sourceBranch: { type: 'string', description: 'Source branch (e.g., "main") (optional)' },
            sourcePath: { type: 'string', description: 'Path to spec in repository (optional)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'stea.syncFigmaComponents',
        description: 'Sync components from a Figma file, extracting component names, variants, design tokens, and thumbnails (R7)',
        inputSchema: {
          type: 'object',
          properties: {
            figmaFileId: { type: 'string', description: 'Figma file ID (from file URL)' },
            figmaAccessToken: { type: 'string', description: 'Figma personal access token' },
            name: { type: 'string', description: 'Name for this Figma file sync' },
            projectId: { type: 'string', description: 'Associated project ID (optional)' },
            docId: { type: 'string', description: 'Linked Ruby document ID (optional)' },
          },
          required: ['figmaFileId', 'figmaAccessToken', 'name'],
        },
      },
      {
        name: 'stea.listAPIEndpoints',
        description: 'List parsed API endpoints from an imported OpenAPI spec (R7)',
        inputSchema: {
          type: 'object',
          properties: {
            specId: { type: 'string', description: 'API spec ID' },
            method: { type: 'string', description: 'Filter by HTTP method (GET, POST, etc.) (optional)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by OpenAPI tags (optional)' },
            limit: { type: 'number', description: 'Max results (default: 50)' },
          },
          required: ['specId'],
        },
      },
      {
        name: 'stea.listFigmaComponents',
        description: 'List synced Figma components from a file (R7)',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: { type: 'string', description: 'Figma file ID' },
            type: { type: 'string', enum: ['COMPONENT', 'COMPONENT_SET', 'all'], description: 'Filter by component type (default: all)' },
            limit: { type: 'number', description: 'Max results (default: 50)' },
          },
          required: ['fileId'],
        },
      },
      {
        name: 'stea.listAPISpecs',
        description: 'List all imported OpenAPI specs (R7)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Filter by project ID (optional)' },
            limit: { type: 'number', description: 'Max results (default: 20)' },
          },
        },
      },
      {
        name: 'stea.listFigmaFiles',
        description: 'List all synced Figma files (R7)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Filter by project ID (optional)' },
            limit: { type: 'number', description: 'Max results (default: 20)' },
          },
        },
      },
      {
        name: 'stea.listTemplates',
        description: 'List available document templates (built-in and custom) (R8)',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by template category (prs, buildspec, releasenotes, etc.) (optional)' },
            includeBuiltIn: { type: 'boolean', description: 'Include built-in templates (default: true)' },
            limit: { type: 'number', description: 'Max results (default: 50)' },
          },
        },
      },
      {
        name: 'stea.getTemplate',
        description: 'Get a specific template by ID with full details (R8)',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string', description: 'Template ID' },
          },
          required: ['templateId'],
        },
      },
      {
        name: 'stea.createTemplate',
        description: 'Create a custom document template (R8)',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Template name' },
            description: { type: 'string', description: 'Template description' },
            category: { type: 'string', description: 'Template category (e.g., "techdesign", "adr", "testplan")' },
            type: { type: 'string', description: 'Template type (default: "documentation")' },
            variables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  required: { type: 'boolean' },
                },
              },
              description: 'Template variable definitions',
            },
            template: { type: 'string', description: 'Markdown template content with {{variable}} placeholders' },
          },
          required: ['name', 'description', 'category', 'variables', 'template'],
        },
      },
      {
        name: 'stea.updateTemplate',
        description: 'Update a custom template (cannot update built-in templates) (R8)',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string', description: 'Template ID to update' },
            name: { type: 'string', description: 'New name (optional)' },
            description: { type: 'string', description: 'New description (optional)' },
            category: { type: 'string', description: 'New category (optional)' },
            variables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  required: { type: 'boolean' },
                },
              },
              description: 'Updated variable definitions (optional)',
            },
            template: { type: 'string', description: 'Updated template content (optional)' },
          },
          required: ['templateId'],
        },
      },
      {
        name: 'stea.deleteTemplate',
        description: 'Delete a custom template (cannot delete built-in templates) (R8)',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string', description: 'Template ID to delete' },
          },
          required: ['templateId'],
        },
      },
      {
        name: 'stea.syncBuiltInTemplates',
        description: 'Sync built-in templates from YAML files to Firestore (R8)',
        inputSchema: {
          type: 'object',
          properties: {
            force: { type: 'boolean', description: 'Force overwrite existing templates (default: false)' },
          },
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

      case 'stea.generateReleaseNotes':
        return await handleGenerateReleaseNotes(generateReleaseNotesSchema.parse(args || {}));

      case 'stea.reviewDoc':
        return await handleReviewDoc(reviewDocSchema.parse(args || {}));

      case 'stea.updateReview':
        return await handleUpdateReview(updateReviewSchema.parse(args || {}));

      case 'stea.completeReview':
        return await handleCompleteReview(completeReviewSchema.parse(args || {}));

      case 'stea.listReviews':
        return await handleListReviews(listReviewsSchema.parse(args || {}));

      case 'stea.importOpenAPI':
        return await handleImportOpenAPI(importOpenAPISchema.parse(args || {}));

      case 'stea.syncFigmaComponents':
        return await handleSyncFigmaComponents(syncFigmaComponentsSchema.parse(args || {}));

      case 'stea.listAPIEndpoints':
        return await handleListAPIEndpoints(listAPIEndpointsSchema.parse(args || {}));

      case 'stea.listFigmaComponents':
        return await handleListFigmaComponents(listFigmaComponentsSchema.parse(args || {}));

      case 'stea.listAPISpecs':
        return await handleListAPISpecs(listAPISpecsSchema.parse(args || {}));

      case 'stea.listFigmaFiles':
        return await handleListFigmaFiles(listFigmaFilesSchema.parse(args || {}));

      case 'stea.listTemplates':
        return await handleListTemplates(listTemplatesSchema.parse(args || {}));

      case 'stea.getTemplate':
        return await handleGetTemplate(getTemplateSchema.parse(args || {}));

      case 'stea.createTemplate':
        return await handleCreateTemplate(createTemplateSchema.parse(args || {}));

      case 'stea.updateTemplate':
        return await handleUpdateTemplate(updateTemplateSchema.parse(args || {}));

      case 'stea.deleteTemplate':
        return await handleDeleteTemplate(deleteTemplateSchema.parse(args || {}));

      case 'stea.syncBuiltInTemplates':
        return await handleSyncBuiltInTemplates(syncBuiltInTemplatesSchema.parse(args || {}));

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
