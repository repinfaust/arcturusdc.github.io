// Dialled MTB changelog — release loader.
// One MDX file per release under content/dialled-releases/ (see README there).
// Build-time validation: a malformed file fails the build with a message that
// names the file and the exact problem.
import 'server-only';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { FEATURES_BY_ID } from './features';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'dialled-releases');

const REQUIRED_FIELDS = ['id', 'date', 'featureIds', 'type', 'title'];
const RELEASE_TYPES = ['feature', 'improvement', 'fix'];
const PLATFORMS = ['ios', 'android', 'backend', 'web'];
const VISIBILITIES = ['public', 'internal'];

function fail(file, message) {
  throw new Error(
    `[dialled-changelog] Invalid release file "${file}": ${message}. ` +
      `Required frontmatter fields: ${REQUIRED_FIELDS.join(', ')}. See content/dialled-releases/README.md.`
  );
}

function validateRelease(file, data) {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      fail(file, `missing required field "${field}"`);
    }
  }
  if (!/^[a-z0-9-]+$/.test(String(data.id))) {
    fail(file, `id "${data.id}" must be a kebab-case slug (a-z, 0-9, hyphens) — it becomes the permalink`);
  }
  const date = String(data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail(file, `date "${data.date}" must be ISO 8601 (YYYY-MM-DD)`);
  }
  if (!Array.isArray(data.featureIds) || data.featureIds.length === 0) {
    fail(file, `"featureIds" must be a non-empty list of feature ids`);
  }
  for (const fid of data.featureIds) {
    if (!FEATURES_BY_ID[fid]) {
      fail(file, `featureIds contains "${fid}" which is not a known feature id (known: ${Object.keys(FEATURES_BY_ID).join(', ')})`);
    }
  }
  if (!RELEASE_TYPES.includes(data.type)) {
    fail(file, `type "${data.type}" must be one of: ${RELEASE_TYPES.join(', ')}`);
  }
  if (data.platform !== undefined) {
    if (!Array.isArray(data.platform) || data.platform.some((p) => !PLATFORMS.includes(p))) {
      fail(file, `platform must be a list drawn from: ${PLATFORMS.join(', ')}`);
    }
  }
  if (data.visibility !== undefined && !VISIBILITIES.includes(data.visibility)) {
    fail(file, `visibility "${data.visibility}" must be one of: ${VISIBILITIES.join(', ')}`);
  }
  if (data.media !== undefined) {
    if (!Array.isArray(data.media)) fail(file, `media must be a list of { src, alt, caption? }`);
    for (const m of data.media) {
      if (!m || typeof m.src !== 'string' || typeof m.alt !== 'string') {
        fail(file, `each media entry needs at least "src" and "alt"`);
      }
    }
  }
  return date;
}

let cache = null;

export function loadReleases() {
  if (cache) return cache;
  if (!fs.existsSync(CONTENT_DIR)) {
    cache = [];
    return cache;
  }
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => (f.endsWith('.mdx') || f.endsWith('.md')) && !/^readme\.md$/i.test(f));
  const releases = [];
  const seen = new Set();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch (e) {
      fail(file, `frontmatter does not parse as YAML (${e.message})`);
    }
    const { data, content } = parsed;
    const date = validateRelease(file, data);
    if (seen.has(data.id)) fail(file, `duplicate release id "${data.id}"`);
    seen.add(data.id);
    releases.push({
      id: data.id,
      date,
      featureIds: data.featureIds,
      type: data.type,
      title: data.title,
      version: data.version !== undefined ? String(data.version) : undefined,
      platform: data.platform || [],
      notes: content.trim() || undefined,
      media: data.media || [],
      visibility: data.visibility || 'public',
    });
  }
  releases.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id)));
  cache = releases;
  return cache;
}

export function publicReleases() {
  return loadReleases().filter((r) => r.visibility === 'public');
}

// §3.1 — status is derived, not authored: >=1 public release => shipped (Live),
// else fall back to the authored lifecycle.
export function deriveStatus(feature, releasesForFeature) {
  const pub = releasesForFeature.filter((r) => r.visibility === 'public');
  if (pub.length > 0) {
    return { status: 'shipped', lastShipped: pub[0].date };
  }
  return { status: feature.lifecycle || 'open', lastShipped: null };
}

export function releasesForFeature(featureId, releases) {
  return releases.filter((r) => r.featureIds.includes(featureId));
}
