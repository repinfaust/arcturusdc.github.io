'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { common, createLowlight } from 'lowlight';
import { Callout } from '@/lib/tiptap-extensions/Callout';

const lowlight = createLowlight(common);

export default function ShareLinkPage() {
  const params = useParams();
  const token = params?.token;
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watermark, setWatermark] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadSharedDoc = async () => {
      try {
        const response = await fetch(`/api/ruby/share-link?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load document');
        }

        setDocData(data);
        setWatermark(data.watermark || false);
      } catch (err) {
        console.error('Error loading shared document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSharedDoc();
  }, [token]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem,
      Highlight,
      Callout,
    ],
    content: docData?.content || { type: 'doc', content: [] },
    editable: false, // Read-only for shared links
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  useEffect(() => {
    if (editor && docData?.content) {
      editor.commands.setContent(docData.content);
    }
  }, [editor, docData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-red-900">Error</h1>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {watermark && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center opacity-10">
          <div className="text-6xl font-bold text-black" style={{ transform: 'rotate(-45deg)' }}>
            CONFIDENTIAL
          </div>
        </div>
      )}
      
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">{docData?.title || 'Shared Document'}</h1>
          <p className="mt-1 text-sm text-neutral-500">Shared via Ruby</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        {editor && <EditorContent editor={editor} />}
      </div>

      <style jsx>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
        }
        .ProseMirror th {
          background: #f9fafb;
          font-weight: 600;
        }
        .ProseMirror pre {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
        }
        .ProseMirror code {
          background: #f5f5f5;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

