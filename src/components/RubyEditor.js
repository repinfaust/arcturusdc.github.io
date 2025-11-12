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
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { common, createLowlight } from 'lowlight';
import { Callout } from '@/lib/tiptap-extensions/Callout';
import { SlashCommand } from '@/lib/tiptap-extensions/SlashCommand';
import { uploadAsset, deleteAsset, getFileIcon, formatFileSize } from '@/lib/storage';

const lowlight = createLowlight(common);

export default function RubyEditor({ document, onClose, tenantId, userEmail }) {
  const [docData, setDocData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [assets, setAssets] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);

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

      await updateDoc(docRef, {
        content,
        updatedBy: userEmail,
        updatedAt: serverTimestamp(),
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [editor, document?.id, tenantId, userEmail]);

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
            <button
              onClick={() => setShowAssetPanel(!showAssetPanel)}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              title="Assets"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Assets ({assets.length})
            </button>
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

        {/* Asset Panel */}
        {showAssetPanel && (
          <aside className="w-80 border-l border-neutral-200 bg-neutral-50 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Assets</h3>
                <button
                  onClick={() => setShowAssetPanel(false)}
                  className="rounded p-1 text-neutral-600 hover:bg-neutral-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

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
    </div>
  );
}
