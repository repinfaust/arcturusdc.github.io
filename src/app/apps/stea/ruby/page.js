'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';
import RubyEditor from '@/components/RubyEditor';
import { getAllTemplates, templateToTipTapJSON } from '@/lib/templates';
import { uploadAsset } from '@/lib/storage';

// ─── File → TipTap JSON converters ───────────────────────────────────────────

function wrapDoc(content) {
  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }] };
}

function markdownToTipTap(markdown) {
  const lines = markdown.split('\n');
  const content = [];
  let bulletItems = [];
  let orderedItems = [];
  let orderedStart = 1;
  let codeLines = [];
  let inCode = false;
  let codeLang = '';

  const flushBullets = () => {
    if (bulletItems.length > 0) {
      content.push({ type: 'bulletList', content: bulletItems.map((text) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })) });
      bulletItems = [];
    }
  };
  const flushOrdered = () => {
    if (orderedItems.length > 0) {
      content.push({ type: 'orderedList', attrs: { start: orderedStart }, content: orderedItems.map((text) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })) });
      orderedItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) { flushBullets(); flushOrdered(); inCode = true; codeLang = line.slice(3).trim() || 'plaintext'; codeLines = []; }
      else { content.push({ type: 'codeBlock', attrs: { language: codeLang }, content: [{ type: 'text', text: codeLines.join('\n') }] }); inCode = false; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    const hMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) { flushBullets(); flushOrdered(); content.push({ type: 'heading', attrs: { level: hMatch[1].length }, content: [{ type: 'text', text: hMatch[2] }] }); continue; }

    const oMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (oMatch) { if (orderedItems.length === 0) orderedStart = parseInt(oMatch[1], 10); orderedItems.push(oMatch[2]); flushBullets(); continue; }

    const bMatch = line.match(/^[-*]\s+(.+)/);
    if (bMatch) { bulletItems.push(bMatch[1]); flushOrdered(); continue; }

    flushBullets(); flushOrdered();
    if (line.trim() === '') continue;
    content.push({ type: 'paragraph', content: [{ type: 'text', text: line }] });
  }
  flushBullets(); flushOrdered();
  return wrapDoc(content);
}

function htmlToTipTap(html) {
  if (typeof window === 'undefined') return wrapDoc([]);
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const body = dom.body;

  function nodeToTipTap(el) {
    if (el.nodeType === Node.TEXT_NODE) {
      const text = el.textContent || '';
      return text ? [{ type: 'text', text }] : [];
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return [];
    const tag = el.tagName?.toLowerCase();
    const children = Array.from(el.childNodes).flatMap(nodeToTipTap);
    const textChildren = children.filter((n) => n.type === 'text');

    if (/^h[1-6]$/.test(tag)) return [{ type: 'heading', attrs: { level: parseInt(tag[1], 10) }, content: textChildren.length ? textChildren : [{ type: 'text', text: el.textContent }] }];
    if (tag === 'p') return children.length ? [{ type: 'paragraph', content: children }] : [];
    if (tag === 'ul') return [{ type: 'bulletList', content: Array.from(el.children).map((li) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: li.textContent }] }] })) }];
    if (tag === 'ol') return [{ type: 'orderedList', attrs: { start: 1 }, content: Array.from(el.children).map((li) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: li.textContent }] }] })) }];
    if (tag === 'pre') { const code = el.querySelector('code'); return [{ type: 'codeBlock', attrs: { language: (code?.className.match(/language-(\w+)/)?.[1]) || 'plaintext' }, content: [{ type: 'text', text: (code || el).textContent }] }]; }
    if (tag === 'code' && el.parentElement?.tagName?.toLowerCase() !== 'pre') return textChildren;
    if (tag === 'blockquote') return Array.from(el.childNodes).flatMap(nodeToTipTap);
    if (tag === 'hr') return [{ type: 'horizontalRule' }];
    if (tag === 'br') return [];
    if (tag === 'img') { const src = el.getAttribute('src'); return src ? [{ type: 'image', attrs: { src, alt: el.getAttribute('alt') || '', title: el.getAttribute('title') || '' } }] : []; }
    if (['strong', 'b', 'em', 'i', 'u', 's', 'code'].includes(tag)) return children;
    if (['div', 'section', 'article', 'main', 'header', 'footer', 'body'].includes(tag)) {
      const blocks = Array.from(el.childNodes).flatMap(nodeToTipTap).filter(Boolean);
      return blocks;
    }
    if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length === 0) return [];
      const tableContent = rows.map((row, ri) => ({
        type: 'tableRow',
        content: Array.from(row.querySelectorAll('th,td')).map((cell) => ({
          type: ri === 0 && row.closest('thead') ? 'tableHeader' : 'tableCell',
          attrs: {},
          content: [{ type: 'paragraph', content: [{ type: 'text', text: cell.textContent.trim() }] }],
        })),
      }));
      return [{ type: 'table', content: tableContent }];
    }
    // Fallback: if element has text content treat as paragraph
    const text = el.textContent?.trim();
    return text ? [{ type: 'paragraph', content: [{ type: 'text', text }] }] : [];
  }

  const tipTapContent = Array.from(body.childNodes).flatMap(nodeToTipTap).filter(Boolean);
  return wrapDoc(tipTapContent);
}

function csvToTipTap(csv) {
  const lines = csv.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return wrapDoc([]);
  const rows = lines.map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
  const [header, ...body] = rows;

  const tableContent = [];
  if (header) {
    tableContent.push({ type: 'tableRow', content: header.map((cell) => ({ type: 'tableHeader', attrs: {}, content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }] })) });
  }
  body.forEach((row) => {
    tableContent.push({ type: 'tableRow', content: row.map((cell) => ({ type: 'tableCell', attrs: {}, content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }] })) });
  });
  return wrapDoc([{ type: 'table', content: tableContent }]);
}

const CODE_LANG_MAP = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin', swift: 'swift', css: 'css', scss: 'css', yaml: 'yaml', yml: 'yaml', sh: 'bash', bash: 'bash', sql: 'sql', xml: 'xml', graphql: 'graphql', gql: 'graphql', php: 'php', c: 'c', cpp: 'cpp', cs: 'csharp', json: 'json', toml: 'toml', env: 'bash' };

function codeToTipTap(text, ext) {
  const lang = CODE_LANG_MAP[ext.toLowerCase()] || ext || 'plaintext';
  return wrapDoc([{ type: 'codeBlock', attrs: { language: lang }, content: [{ type: 'text', text }] }]);
}

function jsonToTipTap(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.type === 'doc' && Array.isArray(parsed.content)) return parsed;
    return codeToTipTap(JSON.stringify(parsed, null, 2), 'json');
  } catch {
    return codeToTipTap(text, 'json');
  }
}

async function docxToTipTap(arrayBuffer) {
  const mammoth = (await import('mammoth')).default;
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  return htmlToTipTap(html);
}

async function xlsxToTipTap(arrayBuffer) {
  const XLSX = (await import('xlsx')).default;
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const content = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length === 0) continue;

    if (workbook.SheetNames.length > 1) {
      content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: sheetName }] });
    }

    const [headerRow, ...dataRows] = rows;
    const tableContent = [];

    if (headerRow?.length > 0) {
      tableContent.push({
        type: 'tableRow',
        content: headerRow.map((cell) => ({
          type: 'tableHeader',
          attrs: {},
          content: [{ type: 'paragraph', content: [{ type: 'text', text: String(cell ?? '') }] }],
        })),
      });
    }

    for (const row of dataRows) {
      if (row.every((c) => c === '' || c == null)) continue;
      tableContent.push({
        type: 'tableRow',
        content: row.map((cell) => ({
          type: 'tableCell',
          attrs: {},
          content: [{ type: 'paragraph', content: [{ type: 'text', text: String(cell ?? '') }] }],
        })),
      });
    }

    if (tableContent.length > 0) {
      content.push({ type: 'table', content: tableContent });
    }

    if (workbook.SheetNames.indexOf(sheetName) < workbook.SheetNames.length - 1) {
      content.push({ type: 'horizontalRule' });
    }
  }

  return wrapDoc(content);
}

async function pdfToTipTap(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const content = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    if (pdf.numPages > 1) {
      content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `Page ${pageNum}` }] });
    }

    // Group items into lines by their y-position
    const lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
        currentLine = [];
      }
      if (item.str.trim()) currentLine.push(item.str);
      lastY = y;
    }
    if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());

    for (const line of lines) {
      if (line) content.push({ type: 'paragraph', content: [{ type: 'text', text: line }] });
    }

    if (pageNum < pdf.numPages) content.push({ type: 'horizontalRule' });
  }

  return wrapDoc(content);
}

const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB — uploadAsset limit

const DOC_TYPES = [
  { value: 'documentation', label: 'Documentation', emoji: '📄', color: 'blue' },
  { value: 'note', label: 'Note', emoji: '📝', color: 'yellow' },
  { value: 'architecture', label: 'Architecture', emoji: '🏗️', color: 'purple' },
  { value: 'meeting', label: 'Meeting Notes', emoji: '🗓️', color: 'green' },
];

export default function RubyPage() {
  const router = useRouter();
  const { currentTenant, availableTenants, loading: tenantLoading } = useTenant();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data
  const [spaces, setSpaces] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // UI State
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New space form
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceIcon, setNewSpaceIcon] = useState('📚');

  // New doc form
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('documentation');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);

  // File import
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        router.replace('/apps/stea?next=/apps/stea/ruby');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Authorization check
  useEffect(() => {
    if (!tenantLoading && !authLoading && availableTenants.length === 0) {
      router.replace('/apps/stea?error=no_workspace');
    }
  }, [availableTenants, tenantLoading, authLoading, router]);

  // Load spaces
  useEffect(() => {
    if (!currentTenant?.id) return;

    const spacesRef = collection(db, 'stea_doc_spaces');
    const q = query(
      spacesRef,
      where('tenantId', '==', currentTenant.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedSpaces = [];
        snapshot.forEach((doc) => {
          loadedSpaces.push({ id: doc.id, ...doc.data() });
        });
        setSpaces(loadedSpaces);

        // Auto-select first space if none selected
        setSelectedSpace((current) => {
          if (!current && loadedSpaces.length > 0) {
            return loadedSpaces[0];
          }
          return current;
        });
      },
      (error) => {
        console.error('[Ruby] Error loading spaces:', error);
      }
    );

    return () => unsubscribe();
  }, [currentTenant]);

  // Load documents
  useEffect(() => {
    if (!currentTenant?.id) return;

    const docsRef = collection(db, 'stea_docs');
    let q;

    if (selectedSpace) {
      q = query(
        docsRef,
        where('tenantId', '==', currentTenant.id),
        where('spaceId', '==', selectedSpace.id),
        orderBy('updatedAt', 'desc')
      );
    } else {
      q = query(
        docsRef,
        where('tenantId', '==', currentTenant.id),
        orderBy('updatedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedDocs = [];
        snapshot.forEach((doc) => {
          loadedDocs.push({ id: doc.id, ...doc.data() });
        });
        setDocuments(loadedDocs);
      },
      (error) => {
        console.error('[Ruby] Error loading documents:', error);
        // Don't clear documents on error, keep showing what we have
      }
    );

    return () => unsubscribe();
  }, [currentTenant, selectedSpace]);

  // Create space
  const handleCreateSpace = async () => {
    if (!newSpaceName.trim() || !currentTenant?.id || !user?.email) return;

    try {
      const spacesRef = collection(db, 'stea_doc_spaces');
      await addDoc(spacesRef, {
        tenantId: currentTenant.id,
        name: newSpaceName.trim(),
        icon: newSpaceIcon,
        description: '',
        createdBy: user.email,
        createdAt: serverTimestamp(),
      });

      setNewSpaceName('');
      setNewSpaceIcon('📚');
      setShowNewSpaceModal(false);
    } catch (error) {
      console.error('Error creating space:', error);
      alert('Failed to create space. Please try again.');
    }
  };

  // Create document
  const handleCreateDocument = async () => {
    if (!newDocTitle.trim() || !currentTenant?.id || !user?.email) return;

    try {
      const docsRef = collection(db, 'stea_docs');

      // Generate content from template
      const templateContent = selectedTemplate
        ? templateToTipTapJSON(selectedTemplate)
        : { type: 'doc', content: [] };

      const newDoc = await addDoc(docsRef, {
        tenantId: currentTenant.id,
        title: newDocTitle.trim(),
        type: selectedTemplate?.docType || newDocType,
        templateId: selectedTemplate?.id || null,
        content: templateContent,
        spaceId: selectedSpace?.id || null,
        parentDocId: null,
        linkedEntities: [],
        tags: [],
        createdBy: user.email,
        createdAt: serverTimestamp(),
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        version: 1,
        isPublic: false,
        collaborators: [user.email],
      });

      // Reset form
      setNewDocTitle('');
      setNewDocType('documentation');
      setSelectedTemplate(null);
      setShowTemplateSelector(true);
      setShowNewDocModal(false);

      // Open the new document in editor
      setSelectedDoc({ id: newDoc.id, title: newDocTitle, type: newDocType });
      setView('editor');
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDoc(doc(db, 'stea_docs', docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setView('list');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  // Import file as new document
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null); // { done, total }

  const importOneFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const isImage = /^(png|jpg|jpeg|gif|webp|svg)$/.test(ext);
    const isCode = ext in CODE_LANG_MAP;
    const supported = /^(md|markdown|txt|html|htm|json|csv|docx|xlsx|xls|pdf|png|jpg|jpeg|gif|webp|svg)$/.test(ext) || isCode;

    if (!supported) return { ok: false, name: file.name, reason: `unsupported type .${ext}` };
    if (isImage && file.size > IMAGE_SIZE_LIMIT) return { ok: false, name: file.name, reason: `too large (max ${IMAGE_SIZE_LIMIT / 1024 / 1024} MB)` };

    const docType = isImage ? 'note' : 'documentation';
    const title = nameWithoutExt || file.name;
    const baseDoc = {
      tenantId: currentTenant.id,
      title,
      type: docType,
      templateId: null,
      spaceId: selectedSpace?.id || null,
      parentDocId: null,
      linkedEntities: [],
      tags: [],
      createdBy: user.email,
      createdAt: serverTimestamp(),
      updatedBy: user.email,
      updatedAt: serverTimestamp(),
      version: 1,
      isPublic: false,
      collaborators: [user.email],
    };

    if (isImage) {
      // Create doc first to get the ID for the storage path, then upload & patch content
      const docRef = await addDoc(collection(db, 'stea_docs'), { ...baseDoc, content: wrapDoc([]) });
      const asset = await uploadAsset(file, docRef.id, currentTenant.id, user.email, null);
      const content = wrapDoc([{ type: 'image', attrs: { src: asset.url, alt: title, title: '' } }]);
      await updateDoc(doc(db, 'stea_docs', docRef.id), { content, updatedAt: serverTimestamp() });
      return { ok: true, id: docRef.id, name: title, type: docType };
    }

    let content;
    if (/^(md|markdown|txt)$/.test(ext)) content = markdownToTipTap(await file.text());
    else if (/^(html|htm)$/.test(ext)) content = htmlToTipTap(await file.text());
    else if (ext === 'json') content = jsonToTipTap(await file.text());
    else if (ext === 'csv') content = csvToTipTap(await file.text());
    else if (ext === 'docx') content = await docxToTipTap(await file.arrayBuffer());
    else if (/^xlsx?$/.test(ext)) content = await xlsxToTipTap(await file.arrayBuffer());
    else if (ext === 'pdf') content = await pdfToTipTap(await file.arrayBuffer());
    else content = codeToTipTap(await file.text(), ext);

    const ref = await addDoc(collection(db, 'stea_docs'), { ...baseDoc, content });
    return { ok: true, id: ref.id, name: title, type: docType };
  }, [currentTenant, user, selectedSpace]);

  const importFiles = useCallback(async (files) => {
    if (!currentTenant?.id || !user?.email || files.length === 0) return;
    setImporting(true);
    setImportProgress({ done: 0, total: files.length });
    const results = [];
    let lastSuccessful = null;
    for (const file of files) {
      try {
        const result = await importOneFile(file);
        results.push(result);
        if (result.ok) lastSuccessful = result;
      } catch (err) {
        results.push({ ok: false, name: file.name, reason: err?.message || 'unknown error' });
      }
      setImportProgress((p) => ({ ...p, done: (p?.done ?? 0) + 1 }));
    }
    setImporting(false);
    setImportProgress(null);

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      alert(`${failed.length} file(s) could not be imported:\n${failed.map((f) => `• ${f.name}: ${f.reason}`).join('\n')}`);
    }

    // If exactly one file, open it in the editor. If multiple, stay on list.
    if (files.length === 1 && lastSuccessful) {
      setSelectedDoc({ id: lastSuccessful.id, title: lastSuccessful.name, type: lastSuccessful.type });
      setView('editor');
    }
  }, [currentTenant, user, importOneFile]);

  const handleImportFile = useCallback((file) => importFiles([file]), [importFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) importFiles(files);
  }, [importFiles]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  // Filter documents by search
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Get doc type info
  const getDocTypeInfo = (type) => {
    return DOC_TYPES.find(t => t.value === type) || DOC_TYPES[0];
  };

  // Loading state
  if (authLoading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">Loading Ruby...</div>
      </div>
    );
  }

  // No tenant access
  if (availableTenants.length === 0) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-starburst">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/img/acturusdc_stea_logo.png"
              alt="STEa Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <Link href="/apps/stea" className="text-2xl font-bold text-rose-600">
              Ruby
            </Link>
            <span className="text-sm text-neutral-500">Documentation</span>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link
                href="/apps/stea/ruby/graph"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Knowledge Graph
              </Link>
            </div>

            {/* STEa Apps Dropdown */}
            <SteaAppsDropdown />
          </div>

          <div className="flex items-center gap-3">
            {currentTenant && (
              <div className="text-sm text-neutral-600">
                <span className="font-medium">{currentTenant.name}</span>
              </div>
            )}
            <TenantSwitcher />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Spaces */}
        <aside className="w-64 border-r border-neutral-200 bg-white/80 backdrop-blur-sm overflow-y-auto">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Spaces</h2>
              <button
                onClick={() => setShowNewSpaceModal(true)}
                className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                title="New space"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setSelectedSpace(null)}
              className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                !selectedSpace
                  ? 'bg-rose-50 text-rose-900 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="mr-2">📚</span>
              All Documents
            </button>

            <div className="space-y-1">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => setSelectedSpace(space)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedSpace?.id === space.id
                      ? 'bg-rose-50 text-rose-900 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span className="mr-2">{space.icon}</span>
                  {space.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {view === 'list' ? (
            <div
              className={`relative h-full overflow-y-auto p-6 transition-colors ${isDragOver ? 'bg-rose-50' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {isDragOver && (
                <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-rose-400 bg-rose-50/80">
                  <div className="text-center">
                    <svg className="mx-auto mb-2 h-10 w-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm font-semibold text-rose-700">Drop to import</p>
                    <p className="mt-1 text-xs text-rose-500">md · txt · html · docx · xlsx · pdf · json · csv · png · jpg · code files</p>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.markdown,.txt,.html,.htm,.docx,.xlsx,.xls,.pdf,.json,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.kt,.swift,.css,.scss,.yaml,.yml,.sh,.bash,.sql,.xml,.graphql,.gql,.php,.c,.cpp,.cs,.toml"
                className="hidden"
                onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) importFiles(files); e.target.value = ''; }}
              />

              {/* Search and Actions */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 pl-10 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  title="Import: .md .txt .html .docx .json .csv .png .jpg .gif .webp and code files (images up to 10 MB)"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-rose-400 hover:text-rose-700 disabled:opacity-60"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {importing && importProgress ? `${importProgress.done}/${importProgress.total}…` : importing ? 'Importing…' : 'Import'}
                </button>

                <button
                  onClick={() => setShowNewDocModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Document
                </button>
              </div>

              {/* Document List */}
              {filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 text-6xl">📄</div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                    {documents.length === 0 ? 'No documents yet' : 'No documents found'}
                  </h3>
                  <p className="mb-6 text-sm text-neutral-600">
                    {documents.length === 0
                      ? 'Create your first document to get started'
                      : 'Try adjusting your search query'}
                  </p>
                  {documents.length === 0 && (
                    <button
                      onClick={() => setShowNewDocModal(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                    >
                      Create Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((doc) => {
                    const typeInfo = getDocTypeInfo(doc.type);
                    return (
                      <div
                        key={doc.id}
                        className="group relative rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setView('editor');
                          }}
                          className="w-full text-left"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <span className="text-2xl">{typeInfo.emoji}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                              {typeInfo.label}
                            </span>
                          </div>
                          <h3 className="mb-1 font-semibold text-neutral-900 line-clamp-2">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Updated {doc.updatedAt?.toDate?.()?.toLocaleDateString() || 'recently'}
                          </p>
                        </button>

                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Delete document"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <RubyEditor
              document={selectedDoc}
              onClose={() => {
                setSelectedDoc(null);
                setView('list');
              }}
              tenantId={currentTenant?.id}
              userEmail={user?.email}
            />
          )}
        </main>
      </div>

      {/* New Space Modal */}
      {showNewSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Create New Space</h3>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Space Name
              </label>
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="e.g., Product Documentation"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Icon
              </label>
              <input
                type="text"
                value={newSpaceIcon}
                onChange={(e) => setNewSpaceIcon(e.target.value)}
                placeholder="📚"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewSpaceModal(false);
                  setNewSpaceName('');
                  setNewSpaceIcon('📚');
                }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                Create Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {showTemplateSelector ? (
              <>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">Choose a Template</h3>
                <p className="mb-6 text-sm text-neutral-600">
                  Select a template to start with, or create a blank document
                </p>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {getAllTemplates().map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateSelector(false);
                      }}
                      className="group rounded-lg border border-neutral-200 p-4 text-left transition hover:border-rose-400 hover:bg-rose-50"
                    >
                      <div className="mb-2 text-3xl">{template.emoji}</div>
                      <h4 className="mb-1 font-semibold text-neutral-900 group-hover:text-rose-900">
                        {template.name}
                      </h4>
                      <p className="text-xs text-neutral-600">{template.description}</p>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowNewDocModal(false);
                      setShowTemplateSelector(true);
                      setSelectedTemplate(null);
                      setNewDocTitle('');
                      setNewDocType('documentation');
                    }}
                    className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowTemplateSelector(true);
                      setSelectedTemplate(null);
                    }}
                    className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                    title="Back to templates"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedTemplate?.emoji}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {selectedTemplate?.name}
                      </h3>
                      <p className="text-sm text-neutral-600">{selectedTemplate?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder={`e.g., ${selectedTemplate?.name} for Feature X`}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDocTitle.trim()) {
                        handleCreateDocument();
                      }
                    }}
                  />
                </div>

                {selectedTemplate?.sections && selectedTemplate.sections.length > 0 && (
                  <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-neutral-900">
                      Template Sections
                    </h4>
                    <ul className="space-y-1 text-sm text-neutral-600">
                      {selectedTemplate.sections.map((section, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-600">•</span>
                          <span>{section.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowNewDocModal(false);
                      setShowTemplateSelector(true);
                      setSelectedTemplate(null);
                      setNewDocTitle('');
                      setNewDocType('documentation');
                    }}
                    className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDocument}
                    disabled={!newDocTitle.trim()}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    Create Document
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
