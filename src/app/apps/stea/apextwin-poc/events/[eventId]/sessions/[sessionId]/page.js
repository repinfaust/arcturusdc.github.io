'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';

export default function EventSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { eventId, sessionId } = params;

  const [session, setSession] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [lapTimerActive, setLapTimerActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const [sessionDoc, eventDoc, riderDoc] = await Promise.all([
          getDoc(doc(db, 'apextwin_sessions', sessionId)),
          getDoc(doc(db, 'apextwin_events', eventId)),
          getDoc(doc(db, 'apextwin_riders', user.uid))
        ]);

        if (!sessionDoc.exists()) {
          router.replace(`/apps/stea/apextwin-poc/events/${eventId}`);
          return;
        }

        setSession({ id: sessionDoc.id, ...sessionDoc.data() });
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        }
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          const inferredLapTimerActive = typeof riderData.lapTimerActive === 'boolean'
            ? riderData.lapTimerActive
            : ['intermediate', 'pro'].includes(riderData.experienceLevel || 'novice');
          setLapTimerActive(inferredLapTimerActive);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, eventId, router]);

  const handleDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'apextwin_sessions', sessionId));
      // Decrement event session count
      await updateDoc(doc(db, 'apextwin_events', eventId), {
        sessionCount: increment(-1),
      });
      router.replace(`/apps/stea/apextwin-poc/events/${eventId}`);
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session');
      setDeleting(false);
    }
  };

  const formatLapTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  };

  if (loading) {
    return <div className="apex-panel p-8 text-center text-apex-soft">Loading session...</div>;
  }

  if (!session) {
    return (
      <div className="apex-panel p-8 text-center">
        <p className="text-apex-soft mb-4">Session not found</p>
        <Link href={`/apps/stea/apextwin-poc/events/${eventId}`} className="apex-btn apex-btn-secondary">
          Back to Event
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/apps/stea/apextwin-poc/events/${eventId}`} className="text-apex-soft hover:text-apex-white">
              ← {event?.trackName || 'Event'}
            </Link>
          </div>
          <h1 className="apex-h1">Session {session.sessionNumber || ''}</h1>
          <p className="text-apex-soft text-sm">
            {session.bikeName || 'Unknown Bike'}
            {session.sessionTime && <span className="ml-2 apex-data">@ {session.sessionTime}</span>}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-apex-heat/70 hover:text-apex-heat text-sm px-3 py-1 transition-colors"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Summary */}
      <div className="apex-panel p-6">
        <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Session Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="apex-label mb-1">Bike</div>
            <div className="text-apex-white">{session.bikeName || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Session #</div>
            <div className="apex-data">{session.sessionNumber || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Time</div>
            <div className="apex-data">{session.sessionTime || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Weather</div>
            <div className="text-apex-white capitalize">{session.weather || '--'}</div>
          </div>
          {lapTimerActive && (
            <div>
              <div className="apex-label mb-1">Laps</div>
              <div className="apex-data text-xl">{session.lapsCompleted || '--'}</div>
            </div>
          )}
          {lapTimerActive && (
            <div>
              <div className="apex-label mb-1">Fastest Lap</div>
              <div className="apex-data text-xl text-apex-mint">{formatLapTime(session.fastestLapSec)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tyre Setup */}
      <div className="apex-panel p-6">
        <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Tyre Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider mb-3">Front</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="apex-label mb-1">Brand / Compound</div>
                <div className="text-apex-white">
                  {session.tireBrandFront || '--'} {session.tireCompoundFront && `/ ${session.tireCompoundFront}`}
                </div>
              </div>
              <div>
                <div className="apex-label mb-1">Cold / Hot</div>
                <div className="apex-data text-lg">
                  {session.tirePressureFrontColdPsi || '--'} / {session.tirePressureFrontHotPsi || '--'}
                  <span className="text-apex-soft text-sm ml-1">PSI</span>
                </div>
              </div>
            </div>
            {session.tirePressureFrontColdPsi && session.tirePressureFrontHotPsi && (
              <div className="mt-2">
                <span className="apex-label">Delta: </span>
                <span className={`apex-data ${(session.tirePressureFrontHotPsi - session.tirePressureFrontColdPsi) > 4 ? 'text-apex-heat' : 'text-apex-mint'}`}>
                  +{(session.tirePressureFrontHotPsi - session.tirePressureFrontColdPsi).toFixed(1)} PSI
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider mb-3">Rear</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="apex-label mb-1">Brand / Compound</div>
                <div className="text-apex-white">
                  {session.tireBrandRear || '--'} {session.tireCompoundRear && `/ ${session.tireCompoundRear}`}
                </div>
              </div>
              <div>
                <div className="apex-label mb-1">Cold / Hot</div>
                <div className="apex-data text-lg">
                  {session.tirePressureRearColdPsi || '--'} / {session.tirePressureRearHotPsi || '--'}
                  <span className="text-apex-soft text-sm ml-1">PSI</span>
                </div>
              </div>
            </div>
            {session.tirePressureRearColdPsi && session.tirePressureRearHotPsi && (
              <div className="mt-2">
                <span className="apex-label">Delta: </span>
                <span className={`apex-data ${(session.tirePressureRearHotPsi - session.tirePressureRearColdPsi) > 3 ? 'text-apex-heat' : 'text-apex-mint'}`}>
                  +{(session.tirePressureRearHotPsi - session.tirePressureRearColdPsi).toFixed(1)} PSI
                </span>
              </div>
            )}
          </div>
        </div>
        {session.tireSetAgeSessions !== null && session.tireSetAgeSessions !== undefined && (
          <div className="mt-4 pt-4 border-t border-apex-stealth">
            <span className="apex-label">Tyre Set Age: </span>
            <span className="apex-data">{session.tireSetAgeSessions} sessions</span>
          </div>
        )}
      </div>

      {/* Setup & Electronics */}
      {(session.forkCompClicksOut || session.forkRebClicksOut || session.shockCompClicksOut || session.shockRebClicksOut || session.tractionControlLevel || session.engineMap) && (
        <div className="apex-panel p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Setup & Electronics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {session.forkCompClicksOut && (
              <div>
                <div className="apex-label mb-1">Fork Comp</div>
                <div className="apex-data">{session.forkCompClicksOut} clicks out</div>
              </div>
            )}
            {session.forkRebClicksOut && (
              <div>
                <div className="apex-label mb-1">Fork Reb</div>
                <div className="apex-data">{session.forkRebClicksOut} clicks out</div>
              </div>
            )}
            {session.shockCompClicksOut && (
              <div>
                <div className="apex-label mb-1">Shock Comp</div>
                <div className="apex-data">{session.shockCompClicksOut} clicks out</div>
              </div>
            )}
            {session.shockRebClicksOut && (
              <div>
                <div className="apex-label mb-1">Shock Reb</div>
                <div className="apex-data">{session.shockRebClicksOut} clicks out</div>
              </div>
            )}
            {session.tractionControlLevel && (
              <div>
                <div className="apex-label mb-1">Traction Control</div>
                <div className="apex-data">{session.tractionControlLevel}</div>
              </div>
            )}
            {session.engineMap && (
              <div>
                <div className="apex-label mb-1">Engine Map</div>
                <div className="apex-data">{session.engineMap}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notesHandling && (
        <div className="apex-panel p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Notes & Handling</h2>
          <p className="text-apex-white whitespace-pre-wrap">{session.notesHandling}</p>
        </div>
      )}
    </div>
  );
}
