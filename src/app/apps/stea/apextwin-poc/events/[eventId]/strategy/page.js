'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadString, getBlob } from 'firebase/storage';
import { Tldraw, getSnapshot as getTlSnapshot, loadSnapshot as loadTlSnapshot, createShapeId } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function TrackStrategyPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const templateInsertedRef = useRef(false);

  // TLDraw state
  const editorRef = useRef(null);
  const initialSnapshotRef = useRef(null);
  const lastWriteTokenRef = useRef(null);
  const suppressSaveRef = useRef(false);
  const saveTimer = useRef(null);
  const [tlLoaded, setTlLoaded] = useState(false);

  const clientIdRef = useRef(null);
  if (!clientIdRef.current) {
    clientIdRef.current = typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Firestore doc for this event's strategy whiteboard
  const strategyDocRef = useMemo(
    () => doc(db, 'apextwin_events', eventId, 'strategy', 'whiteboard'),
    [eventId]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const eventDoc = await getDoc(doc(db, 'apextwin_events', eventId));
        if (!eventDoc.exists()) {
          router.replace('/apps/stea/apextwin-poc/events');
          return;
        }

        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        setEvent(eventData);

      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, router]);

  // Debounce helper
  const debounceSave = (fn, ms = 1500) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(fn, ms);
  };

  const applySnapshot = useCallback((snapshot) => {
    if (!editorRef.current || !snapshot) return;
    suppressSaveRef.current = true;
    try {
      loadTlSnapshot(editorRef.current.store, snapshot);
    } catch (err) {
      console.error('[TLDraw apply snapshot]', err);
    } finally {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          suppressSaveRef.current = false;
        });
      } else {
        suppressSaveRef.current = false;
      }
    }
  }, []);

  const whenStoreReady = (editor, fn, tries = 40) => {
    if (editor && editor.store && typeof editor.store.listen === 'function') {
      try { fn(); } catch (e) { console.error('[TLDraw setup error]', e); }
      return;
    }
    if (tries <= 0) {
      console.error('[TLDraw] store not ready after retries');
      return;
    }
    setTimeout(() => whenStoreReady(editor, fn, tries - 1), 50);
  };

  // Load initial snapshot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(strategyDocRef);
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : null;

        if (data?.tldrawStoragePath) {
          try {
            const snapshotRef = storageRef(storage, data.tldrawStoragePath);
            const blob = await getBlob(snapshotRef);
            const text = await blob.text();
            const snapshot = JSON.parse(text);
            initialSnapshotRef.current = snapshot;
            lastWriteTokenRef.current = data?.tldrawWriteToken || null;
          } catch (storageError) {
            console.error('[TLDraw] Error loading from Cloud Storage:', storageError);
            initialSnapshotRef.current = data?.tldrawSnapshot || null;
            lastWriteTokenRef.current = data?.tldrawWriteToken || null;
          }
        } else {
          initialSnapshotRef.current = data?.tldrawSnapshot || null;
          lastWriteTokenRef.current = data?.tldrawWriteToken || null;
        }

        setTlLoaded(true);
        if (editorRef.current && initialSnapshotRef.current) {
          applySnapshot(initialSnapshotRef.current);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[TLDraw load error]', e);
          setTlLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [applySnapshot, strategyDocRef]);

  // Live sync
  useEffect(() => {
    const unsub = onSnapshot(
      strategyDocRef,
      async (snap) => {
        if (!editorRef.current || !snap.exists()) return;
        const remote = snap.data();

        if (remote?.tldrawWriteToken) {
          const remoteClientId = remote.tldrawWriteToken.split(':')[0];
          const myClientId = clientIdRef.current;
          if (remoteClientId === myClientId) return;
          if (remote.tldrawWriteToken === lastWriteTokenRef.current) return;
        }

        try {
          let snapshot = null;
          if (remote?.tldrawStoragePath) {
            try {
              const snapshotRef = storageRef(storage, remote.tldrawStoragePath);
              const blob = await getBlob(snapshotRef);
              const text = await blob.text();
              snapshot = JSON.parse(text);
            } catch (storageError) {
              snapshot = remote.tldrawSnapshot;
            }
          } else if (remote?.tldrawSnapshot) {
            snapshot = remote.tldrawSnapshot;
          }

          if (!snapshot) return;
          lastWriteTokenRef.current = remote?.tldrawWriteToken || null;
          initialSnapshotRef.current = snapshot;
          applySnapshot(snapshot);
        } catch (e) {
          console.error('[TLDraw onSnapshot apply]', e);
        }
      }
    );
    return () => unsub();
  }, [applySnapshot, strategyDocRef]);

  const addCircuitTemplate = (editor) => {
    if (!editor || !event) return;
    try {
      const shapeId = createShapeId();
      editor.createShape({
        id: shapeId,
        type: 'geo',
        x: 100,
        y: 100,
        props: {
          geo: 'rectangle',
          w: 640,
          h: 420,
          color: 'light-blue',
          fill: 'solid',
          labelColor: 'black',
          text: `${event.trackName || 'Track'}\n\nTrack map placeholder\nAdd your braking markers + lines`,
        },
      });
      editor.zoomToFit();
    } catch (err) {
      console.error('Error adding circuit placeholder:', err);
    }
  };

  useEffect(() => {
    if (!event || !editorRef.current || !tlLoaded) return;
    if (templateInsertedRef.current) return;
    if (initialSnapshotRef.current) return;
    addCircuitTemplate(editorRef.current);
    templateInsertedRef.current = true;
  }, [event, tlLoaded]);

  if (loading) {
    return <div className="apex-panel p-8 text-center text-apex-soft">Loading...</div>;
  }

  if (!event) {
    return (
      <div className="apex-panel p-8 text-center">
        <p className="text-apex-soft mb-4">Event not found</p>
        <Link href="/apps/stea/apextwin-poc/events" className="apex-btn apex-btn-secondary">
          Back to Events
        </Link>
      </div>
    );
  }

  const user = auth.currentUser;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/apps/stea/apextwin-poc/events/${eventId}`} className="text-apex-soft hover:text-apex-white">
              ← {event.trackName}
            </Link>
          </div>
          <h1 className="apex-h1">Track Strategy</h1>
          <p className="text-apex-soft text-sm">Plan your lines, braking points, and reference markers</p>
        </div>
        <button
          onClick={() => addCircuitTemplate(editorRef.current)}
          className="apex-btn apex-btn-secondary text-sm"
        >
          + Add Track Placeholder
        </button>
      </div>

      {/* TLDraw Whiteboard */}
      <div className="apex-panel p-2 sm:p-4">
        <div className="h-[calc(100vh-220px)] min-h-[500px] w-full rounded-lg overflow-hidden bg-apex-graphite">
          {tlLoaded && (
            <Tldraw
              onMount={(editor) => {
                editorRef.current = editor;

                if (initialSnapshotRef.current) {
                  applySnapshot(initialSnapshotRef.current);
                } else {
                  try {
                    initialSnapshotRef.current = getTlSnapshot(editor.store);
                  } catch {}
                }

                whenStoreReady(editor, () => {
                  const unlisten = editor.store.listen(
                    () => {
                      if (suppressSaveRef.current) return;
                      let snapshot;
                      try {
                        snapshot = getTlSnapshot(editor.store);
                      } catch (err) {
                        console.error('[TLDraw snapshot capture]', err);
                        return;
                      }
                      if (!snapshot) return;
                      const writeToken = `${clientIdRef.current}:${Date.now()}`;
                      lastWriteTokenRef.current = writeToken;
                      initialSnapshotRef.current = snapshot;
                      debounceSave(async () => {
                        try {
                          const storagePath = `tldraw/apextwin/${eventId}/strategy.json`;
                          const snapshotRefStorage = storageRef(storage, storagePath);
                          const snapshotJson = JSON.stringify(snapshot);

                          await uploadString(snapshotRefStorage, snapshotJson, 'raw', {
                            contentType: 'application/json',
                          });

                          await setDoc(
                            strategyDocRef,
                            {
                              tldrawStoragePath: storagePath,
                              tldrawUpdatedAt: serverTimestamp(),
                              tldrawUpdatedBy: user?.uid || null,
                              tldrawWriteToken: writeToken,
                            },
                            { merge: true }
                          );
                        } catch (err) {
                          console.error('[TLDraw persist error]', err);
                        }
                      });
                    },
                    { scope: 'document' }
                  );
                  editor._unmountDoc = unlisten;
                });
              }}
              onUnmount={() => {
                try { editorRef.current?._unmountDoc?.(); } catch {}
                editorRef.current = null;
              }}
            />
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="apex-panel p-4">
        <h3 className="text-apex-white font-semibold mb-2">Tips</h3>
        <ul className="text-apex-soft text-sm space-y-1">
          <li>• Use the draw tool to mark your racing line</li>
          <li>• Add text labels for braking points and turn-in markers</li>
          <li>• Use arrows to show direction and flow</li>
          <li>• Export/screenshot your strategy to share with coaches</li>
        </ul>
      </div>
    </div>
  );
}
