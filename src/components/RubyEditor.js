'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { doc, getDoc, getDocs, updateDoc, addDoc, deleteDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import DiffViewer from '@/components/ruby/DiffViewer';
import { db } from '@/lib/firebase';
import { common, createLowlight } from 'lowlight';
import { Callout } from '@/lib/tiptap-extensions/Callout';
import { SlashCommand } from '@/lib/tiptap-extensions/SlashCommand';
import { uploadAsset, deleteAsset, getFileIcon, formatFileSize } from '@/lib/storage';
import { exportAsHTML, exportAsMarkdown, exportAsPDF } from '@/lib/ruby-exports';

const lowlight = createLowlight(common);

export default function RubyEditor({ document, onClose, tenantId, userEmail }) {
  const [docData, setDocData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('assets'); // 'assets' or 'links'
  const [assets, setAssets] = useState([]);
  const [links, setLinks] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    toType: 'epic', // epic, feature, card, test
    toId: '',
    relation: '',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);

  // Load document data
  useEffect(() => {
    if (!document?.id) return;

    const loadDocument = async () => {
      try {
        const docRef = doc(db, 'stea_docs', document.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDocData({ id: docSnap.id, ...data });
        }
      } catch (error) {
        console.error('Error loading document:', error);
        alert('Failed to load document. Please try again.');
      }
    };

    loadDocument();
  }, [document?.id]);

  // Load assets for this document
  useEffect(() => {
    if (!document?.id) return;

    const assetsRef = collection(db, 'stea_doc_assets');
    const q = query(
      assetsRef,
      where('docId', '==', document.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAssets = [];
      snapshot.forEach((doc) => {
        loadedAssets.push({ id: doc.id, ...doc.data() });
      });
      setAssets(loadedAssets);
    });

    return () => unsubscribe();
  }, [document?.id]);

  // Load links for this document (both outgoing and incoming)
  useEffect(() => {
    if (!document?.id) return;

    const linksRef = collection(db, 'stea_doc_links');

    // Query for outgoing links (this doc links to others)
    const outgoingQuery = query(
      linksRef,
      where('fromType', '==', 'document'),
      where('fromId', '==', document.id)
    );

    // Query for incoming links (others link to this doc)
    const incomingQuery = query(
      linksRef,
      where('toType', '==', 'document'),
      where('toId', '==', document.id)
    );

    const loadedLinks = { outgoing: [], incoming: [] };

    const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      loadedLinks.outgoing = [];
      snapshot.forEach((doc) => {
        loadedLinks.outgoing.push({ id: doc.id, direction: 'outgoing', ...doc.data() });
      });
      setLinks([...loadedLinks.outgoing, ...loadedLinks.incoming]);
    });

    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      loadedLinks.incoming = [];
      snapshot.forEach((doc) => {
        loadedLinks.incoming.push({ id: doc.id, direction: 'incoming', ...doc.data() });
      });
      setLinks([...loadedLinks.outgoing, ...loadedLinks.incoming]);
    });

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }, [document?.id]);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block (using lowlight version)
        link: false, // Disable default link (using custom configured version)
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-rose-600 underline hover:text-rose-700',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-neutral-300 bg-neutral-50 px-3 py-2 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-neutral-300 px-3 py-2',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-neutral-900 text-neutral-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing... (Type "/" for commands)',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200',
        },
      }),
      Callout,
      SlashCommand,
    ],
    content: docData?.content || { type: 'doc', content: [] },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];

          // Only handle images for now
          if (file.type.startsWith('image/')) {
            event.preventDefault();

            // Upload to Cloud Storage
            handleFileUpload(file).then((asset) => {
              if (asset && asset.url) {
                const node = view.state.schema.nodes.image.create({
                  src: asset.url,
                  alt: asset.name,
                  title: asset.name,
                });
                const transaction = view.state.tr.insert(view.state.selection.from, node);
                view.dispatch(transaction);
              }
            });

            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              // Upload to Cloud Storage
              handleFileUpload(file).then((asset) => {
                if (asset && asset.url) {
                  const node = view.state.schema.nodes.image.create({
                    src: asset.url,
                    alt: asset.name,
                    title: asset.name,
                  });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              });
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save logic will be triggered by save button for now
    },
  });

  // Update editor content when document loads
  useEffect(() => {
    if (editor && docData?.content) {
      editor.commands.setContent(docData.content);
    }
  }, [editor, docData]);

  // Save document
  const handleSave = useCallback(async () => {
    if (!editor || !document?.id || !tenantId || !userEmail) return;

    setIsSaving(true);
    try {
      const content = editor.getJSON();
      const docRef = doc(db, 'stea_docs', document.id);

      // Get current document to compare
      const currentDocSnap = await getDoc(docRef);
      const currentContent = currentDocSnap.exists() ? currentDocSnap.data().content : null;

      // Update document
      await updateDoc(docRef, {
        content,
        updatedBy: userEmail,
        updatedAt: serverTimestamp(),
      });

      // Create version snapshot if content changed
      if (currentContent && JSON.stringify(currentContent) !== JSON.stringify(content)) {
        try {
          // Get version count
          const versionsRef = collection(db, 'stea_doc_versions');
          const versionsQuery = query(
            versionsRef,
            where('docId', '==', document.id),
            where('tenantId', '==', tenantId)
          );
          const versionsSnapshot = await getDocs(versionsQuery);
          const versionNumber = versionsSnapshot.size + 1;

          // Create version
          await addDoc(collection(db, 'stea_doc_versions'), {
            docId: document.id,
            tenantId,
            title: docData?.title || 'Untitled',
            content: currentContent, // Save old content as version
            version: versionNumber,
            createdBy: currentDocSnap.data().updatedBy || currentDocSnap.data().createdBy,
            createdAt: currentDocSnap.data().updatedAt || currentDocSnap.data().createdAt || serverTimestamp(),
          });
        } catch (versionError) {
          console.error('Error creating version:', versionError);
          // Don't fail save if version creation fails
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [editor, document?.id, tenantId, userEmail, docData]);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      if (editor.isEditable && !editor.isEmpty) {
        handleSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [editor, handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Save with Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Add link
  const handleAddLink = useCallback(() => {
    if (!linkUrl) return;

    if (editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }

    setLinkUrl('');
    setShowLinkModal(false);
  }, [editor, linkUrl]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    if (!file || !document?.id || !tenantId || !userEmail) return null;

    try {
      setUploadingFile(file.name);
      setUploadProgress(0);

      const asset = await uploadAsset(
        file,
        document.id,
        tenantId,
        userEmail,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setUploadingFile(null);
      setUploadProgress(null);

      return asset;
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
      setUploadingFile(null);
      setUploadProgress(null);
      return null;
    }
  }, [document?.id, tenantId, userEmail]);

  // Delete asset
  const handleDeleteAsset = useCallback(async (assetId, storagePath) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await deleteAsset(assetId, storagePath);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete asset: ${error.message}`);
    }
  }, []);

  // Search for artifacts to link to
  const searchArtifacts = useCallback(async (searchTerm) => {
    if (!searchTerm || !tenantId) {
      setSearchResults([]);
      return;
    }

    try {
      const collectionMap = {
        epic: 'stea_epics',
        feature: 'stea_features',
        card: 'stea_cards',
        test: 'hans_cases',
      };

      const collectionName = collectionMap[linkForm.toType];
      const artifactsRef = collection(db, collectionName);
      const q = query(
        artifactsRef,
        where('tenantId', '==', tenantId)
      );

      const snapshot = await getDocs(q);
      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const searchLower = searchTerm.toLowerCase();
        const titleField = linkForm.toType === 'test' ? 'title' : 'name';
        const title = data[titleField] || '';

        if (title.toLowerCase().includes(searchLower)) {
          results.push({
            id: doc.id,
            title: title,
            type: linkForm.toType,
          });
        }
      });

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [linkForm.toType, tenantId]);

  // Create a new link
  const handleCreateLink = useCallback(async () => {
    if (!document?.id || !linkForm.toId || !tenantId || !userEmail) return;

    try {
      const linksRef = collection(db, 'stea_doc_links');
      await addDoc(linksRef, {
        fromType: 'document',
        fromId: document.id,
        toType: linkForm.toType,
        toId: linkForm.toId,
        relation: linkForm.relation || null,
        tenantId: tenantId,
        createdBy: userEmail,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setLinkForm({
        toType: 'epic',
        toId: '',
        relation: '',
      });
      setSearchResults([]);
      setShowCreateLinkModal(false);
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create link. Please try again.');
    }
  }, [document?.id, linkForm, tenantId, userEmail]);

  // Delete a link
  const handleDeleteLink = useCallback(async (linkId) => {
    if (!confirm('Delete this link?')) return;

    try {
      const linkRef = doc(db, 'stea_doc_links', linkId);
      await deleteDoc(linkRef);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link. Please try again.');
    }
  }, []);

  // Export functions
  const handleExportHTML = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    const filename = `${docData.title || 'document'}.html`;
    exportAsHTML(content, filename);
    setShowExportMenu(false);
  }, [editor, docData]);

  const handleExportMarkdown = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    const filename = `${docData.title || 'document'}.md`;
    exportAsMarkdown(content, filename);
    setShowExportMenu(false);
  }, [editor, docData]);

  const handleExportPDF = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    const filename = `${docData.title || 'document'}.pdf`;
    exportAsPDF(content, filename);
    setShowExportMenu(false);
  }, [editor, docData]);

  const handleExportPDFWithWatermark = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    const filename = `${docData.title || 'document'}.pdf`;
    exportAsPDF(content, filename, { includeWatermark: true, watermarkText: 'CONFIDENTIAL' });
    setShowExportMenu(false);
  }, [editor, docData]);

  // Create share link
  const handleCreateShareLink = useCallback(async () => {
    if (!document?.id) return;

    setCreatingShareLink(true);
    try {
      const response = await fetch('/api/ruby/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: document.id,
          expiresInDays: 30,
          requireAuth: false,
          watermark: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      setShareLink(data);
      setShowShareLinkModal(true);
    } catch (error) {
      console.error('Error creating share link:', error);
      alert(`Failed to create share link: ${error.message}`);
    } finally {
      setCreatingShareLink(false);
    }
  }, [document?.id]);

  if (!editor || !docData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-neutral-600">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Editor Header */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">{docData.title}</h1>
              {lastSaved && (
                <p className="text-xs text-neutral-500">
                  Last saved {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sidebar Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              <button
                onClick={() => {
                  setSidebarTab('assets');
                  setShowSidebar(true);
                }}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  showSidebar && sidebarTab === 'assets'
                    ? 'bg-rose-100 text-rose-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
                title="Assets"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Assets ({assets.length})
              </button>
              <button
                onClick={() => {
                  setSidebarTab('links');
                  setShowSidebar(true);
                }}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  showSidebar && sidebarTab === 'links'
                    ? 'bg-rose-100 text-rose-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
                title="Links"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Links ({links.length})
              </button>
            </div>
            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg">
                    <div className="py-1">
                      <button
                        onClick={handleExportHTML}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Export as HTML
                      </button>
                      <button
                        onClick={handleExportMarkdown}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as Markdown
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export as PDF
                      </button>
                      <button
                        onClick={handleExportPDFWithWatermark}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Export PDF (Watermarked)
                      </button>
                      <div className="my-1 border-t border-neutral-200" />
                      <button
                        onClick={handleCreateShareLink}
                        disabled={creatingShareLink}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {creatingShareLink ? 'Creating...' : 'Create Share Link'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Text formatting */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('bold')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Bold (Cmd+B)"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('italic')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Italic (Cmd+I)"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('strike')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('highlight')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Highlight"
            >
              <span className="bg-yellow-200 px-1">H</span>
            </button>

            <div className="mx-2 h-6 w-px bg-neutral-300" />

            {/* Headings */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`rounded px-2 py-1 text-sm transition ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`rounded px-2 py-1 text-sm transition ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`rounded px-2 py-1 text-sm transition ${
                editor.isActive('heading', { level: 3 })
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Heading 3"
            >
              H3
            </button>

            <div className="mx-2 h-6 w-px bg-neutral-300" />

            {/* Lists */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('bulletList')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Bullet List"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('orderedList')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Numbered List"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('taskList')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Task List"
            >
              ☑
            </button>

            <div className="mx-2 h-6 w-px bg-neutral-300" />

            {/* Other */}
            <button
              onClick={() => setShowLinkModal(true)}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('link')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Add Link"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('codeBlock')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Code Block"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`rounded p-2 text-sm transition ${
                editor.isActive('blockquote')
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Quote"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>

            {/* Callout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCalloutMenu(!showCalloutMenu)}
                className={`rounded p-2 text-sm transition ${
                  editor.isActive('callout')
                    ? 'bg-neutral-200 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                title="Callout"
              >
                💡
              </button>
              {showCalloutMenu && (
                <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg">
                  <button
                    onClick={() => {
                      editor.chain().focus().setCallout({ type: 'info' }).run();
                      setShowCalloutMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    <span>ℹ️</span>
                    <span>Info</span>
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().setCallout({ type: 'warning' }).run();
                      setShowCalloutMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-yellow-50"
                  >
                    <span>⚠️</span>
                    <span>Warning</span>
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().setCallout({ type: 'success' }).run();
                      setShowCalloutMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-green-50"
                  >
                    <span>✅</span>
                    <span>Success</span>
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().setCallout({ type: 'error' }).run();
                      setShowCalloutMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-red-50"
                  >
                    <span>❌</span>
                    <span>Error</span>
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().setCallout({ type: 'tip' }).run();
                      setShowCalloutMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-purple-50"
                  >
                    <span>💡</span>
                    <span>Tip</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mx-2 h-6 w-px bg-neutral-300" />

            {/* Table */}
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="rounded p-2 text-sm text-neutral-600 transition hover:bg-neutral-100"
              title="Insert Table"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            <div className="mx-2 h-6 w-px bg-neutral-300" />

            {/* Undo/Redo */}
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="rounded p-2 text-sm text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
              title="Undo (Cmd+Z)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="rounded p-2 text-sm text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
              title="Redo (Cmd+Shift+Z)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFile && (
        <div className="border-b border-neutral-200 bg-blue-50 px-6 py-3">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">Uploading {uploadingFile}...</div>
              <div className="mt-1 h-2 w-full rounded-full bg-blue-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${uploadProgress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <EditorContent editor={editor} />
        </div>

        {/* Sidebar Panel */}
        {showSidebar && (
          <aside className="w-80 border-l border-neutral-200 bg-neutral-50 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">
                  {sidebarTab === 'assets' ? 'Assets' : 'Links'}
                </h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="rounded p-1 text-neutral-600 hover:bg-neutral-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Assets Tab Content */}
              {sidebarTab === 'assets' && (
                <>
                  {/* Upload Button */}
                  <label className="mb-4 block cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 bg-white p-4 text-center transition hover:border-rose-400 hover:bg-rose-50">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,text/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                      e.target.value = ''; // Reset input
                    }
                  }}
                />
                <svg className="mx-auto h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm font-medium text-neutral-700">Upload File</p>
                <p className="text-xs text-neutral-500">Click or drag files here</p>
              </label>

              {/* Asset List */}
              {assets.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center">
                  <p className="text-sm text-neutral-600">No assets yet</p>
                  <p className="mt-1 text-xs text-neutral-500">Upload images or files to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group rounded-lg bg-white p-3 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail or Icon */}
                        <div className="flex-shrink-0">
                          {asset.mime.startsWith('image/') && asset.thumbnailUrl ? (
                            <img
                              src={asset.thumbnailUrl}
                              alt={asset.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-neutral-100 text-2xl">
                              {getFileIcon(asset.mime)}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900" title={asset.name}>
                            {asset.name}
                          </p>
                          <p className="text-xs text-neutral-500">{formatFileSize(asset.size)}</p>

                          {/* Actions */}
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => {
                                if (asset.mime.startsWith('image/') && editor) {
                                  editor.chain().focus().setImage({ src: asset.url }).run();
                                }
                              }}
                              disabled={!asset.mime.startsWith('image/')}
                              className="text-xs text-rose-600 hover:text-rose-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
                            >
                              Insert
                            </button>
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-neutral-600 hover:text-neutral-900"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDeleteAsset(asset.id, asset.storagePath)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </>
              )}

              {/* Links Tab Content */}
              {sidebarTab === 'links' && (
                <>
                  {/* Create Link Button */}
                  <button
                    onClick={() => setShowCreateLinkModal(true)}
                    className="mb-4 w-full rounded-lg border-2 border-dashed border-neutral-300 bg-white p-4 text-center transition hover:border-rose-400 hover:bg-rose-50"
                  >
                    <svg className="mx-auto h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-neutral-700">Create Link</p>
                    <p className="text-xs text-neutral-500">Link to Epic, Feature, Card, or Test</p>
                  </button>

                  {/* Links List */}
                  {links.length === 0 ? (
                    <div className="rounded-lg bg-white p-6 text-center">
                      <p className="text-sm text-neutral-600">No links yet</p>
                      <p className="mt-1 text-xs text-neutral-500">Create links to track traceability</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Outgoing Links */}
                      {links.filter(link => link.direction === 'outgoing').length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Links From This Doc
                          </h4>
                          <div className="space-y-2">
                            {links
                              .filter(link => link.direction === 'outgoing')
                              .map((link) => (
                                <div
                                  key={link.id}
                                  className="group rounded-lg bg-white p-3 shadow-sm transition hover:shadow-md"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                                          {link.toType}
                                        </span>
                                        {link.relation && (
                                          <span className="text-xs text-neutral-500">
                                            {link.relation}
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 text-sm font-medium text-neutral-900">
                                        {link.toId}
                                      </p>
                                      {link.createdAt && (
                                        <p className="mt-1 text-xs text-neutral-500">
                                          Created {new Date(link.createdAt?.toDate()).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteLink(link.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-600 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Incoming Links */}
                      {links.filter(link => link.direction === 'incoming').length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Links To This Doc
                          </h4>
                          <div className="space-y-2">
                            {links
                              .filter(link => link.direction === 'incoming')
                              .map((link) => (
                                <div
                                  key={link.id}
                                  className="rounded-lg bg-white p-3 shadow-sm"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                                          {link.fromType}
                                        </span>
                                        {link.relation && (
                                          <span className="text-xs text-neutral-500">
                                            {link.relation}
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 text-sm font-medium text-neutral-900">
                                        {link.fromId}
                                      </p>
                                      {link.createdAt && (
                                        <p className="mt-1 text-xs text-neutral-500">
                                          Created {new Date(link.createdAt?.toDate()).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Add Link</h3>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                URL
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLink();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                disabled={!linkUrl.trim()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Create DocLink</h3>

            {/* Artifact Type Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Link to
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'epic', label: 'Epic', icon: '🎯' },
                  { value: 'feature', label: 'Feature', icon: '✨' },
                  { value: 'card', label: 'Card', icon: '📋' },
                  { value: 'test', label: 'Test', icon: '🧪' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setLinkForm({ ...linkForm, toType: type.value, toId: '' });
                      setSearchResults([]);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition ${
                      linkForm.toType === type.value
                        ? 'border-rose-400 bg-rose-50 text-rose-700'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search for Artifact */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Search {linkForm.toType}
              </label>
              <input
                type="text"
                placeholder={`Search for a ${linkForm.toType}...`}
                onChange={(e) => searchArtifacts(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        setLinkForm({ ...linkForm, toId: result.id });
                        setSearchResults([]);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        linkForm.toId === result.id
                          ? 'bg-rose-100 text-rose-900'
                          : 'hover:bg-neutral-50 text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          {result.type}
                        </span>
                        <span className="truncate">{result.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Item */}
              {linkForm.toId && (
                <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2">
                  <p className="text-xs font-medium text-rose-700">Selected:</p>
                  <p className="text-sm text-rose-900">{linkForm.toId}</p>
                </div>
              )}
            </div>

            {/* Relation (Optional) */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Relation <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={linkForm.relation}
                onChange={(e) => setLinkForm({ ...linkForm, relation: e.target.value })}
                placeholder="e.g., implements, tests, references"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateLinkModal(false);
                  setLinkForm({ toType: 'epic', toId: '', relation: '' });
                  setSearchResults([]);
                }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLink}
                disabled={!linkForm.toId}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #e11d48;
          padding-left: 1rem;
          margin-left: 0;
          color: #64748b;
        }

        .ProseMirror code {
          background-color: #f1f5f9;
          color: #e11d48;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }

        .ProseMirror pre {
          background: #1e293b;
          color: #f1f5f9;
          font-family: 'JetBrainsMono', 'Courier New', monospace;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
        }

        .ProseMirror pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.875rem;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
        }

        .ProseMirror table td,
        .ProseMirror table th {
          min-width: 1em;
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }

        .ProseMirror table th {
          font-weight: bold;
          text-align: left;
          background-color: #f9fafb;
        }

        .ProseMirror table .selectedCell {
          background-color: #fef2f2;
        }

        /* Task Lists */
        .ProseMirror ul[data-type='taskList'] {
          list-style: none;
          padding: 0;
        }

        .ProseMirror ul[data-type='taskList'] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .ProseMirror ul[data-type='taskList'] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }

        .ProseMirror ul[data-type='taskList'] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror ul[data-type='taskList'] input[type='checkbox'] {
          cursor: pointer;
        }

        /* Callouts */
        .ProseMirror .callout {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          margin: 1rem 0;
          border-left: 4px solid;
          border-radius: 0.5rem;
        }

        .ProseMirror .callout .callout-icon {
          font-size: 1.5rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .ProseMirror .callout .callout-content {
          flex: 1;
        }

        .ProseMirror .callout.bg-blue-50 {
          background-color: #eff6ff;
        }

        .ProseMirror .callout.border-blue-500 {
          border-color: #3b82f6;
        }

        .ProseMirror .callout.text-blue-900 {
          color: #1e3a8a;
        }

        .ProseMirror .callout.bg-yellow-50 {
          background-color: #fefce8;
        }

        .ProseMirror .callout.border-yellow-500 {
          border-color: #eab308;
        }

        .ProseMirror .callout.text-yellow-900 {
          color: #713f12;
        }

        .ProseMirror .callout.bg-green-50 {
          background-color: #f0fdf4;
        }

        .ProseMirror .callout.border-green-500 {
          border-color: #22c55e;
        }

        .ProseMirror .callout.text-green-900 {
          color: #14532d;
        }

        .ProseMirror .callout.bg-red-50 {
          background-color: #fef2f2;
        }

        .ProseMirror .callout.border-red-500 {
          border-color: #ef4444;
        }

        .ProseMirror .callout.text-red-900 {
          color: #7f1d1d;
        }

        .ProseMirror .callout.bg-purple-50 {
          background-color: #faf5ff;
        }

        .ProseMirror .callout.border-purple-500 {
          border-color: #a855f7;
        }

        .ProseMirror .callout.text-purple-900 {
          color: #581c87;
        }

        /* Slash Command Menu */
        .slash-command-menu {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          max-height: 20rem;
          overflow-y: auto;
          min-width: 16rem;
        }

        .slash-command-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.375rem;
          width: 100%;
          text-align: left;
          transition: background-color 0.15s;
          border: none;
          background: none;
          cursor: pointer;
        }

        .slash-command-item:hover,
        .slash-command-item.is-selected {
          background-color: #f3f4f6;
        }

        .slash-command-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .slash-command-content {
          flex: 1;
        }

        .slash-command-title {
          font-weight: 500;
          color: #111827;
        }

        .slash-command-description {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .slash-command-empty {
          padding: 0.5rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }
      `}</style>

      {/* Share Link Modal */}
      {showShareLinkModal && shareLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Share Link Created</h2>
            <p className="mb-4 text-sm text-neutral-600">
              Share this link with others to give them access to this document:
            </p>
            <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <input
                type="text"
                value={shareLink.shareUrl}
                readOnly
                className="w-full bg-transparent text-sm text-neutral-900"
                onClick={(e) => e.target.select()}
              />
            </div>
            <div className="mb-4 text-xs text-neutral-500">
              Expires: {new Date(shareLink.expiresAt).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink.shareUrl);
                  alert('Link copied to clipboard!');
                }}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  setShowShareLinkModal(false);
                  setShareLink(null);
                }}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diff Viewer Modal */}
      {showDiffViewer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <DiffViewer
            docId={document?.id}
            tenantId={tenantId}
            onClose={() => setShowDiffViewer(false)}
          />
        </div>
      )}
    </div>
  );
}
