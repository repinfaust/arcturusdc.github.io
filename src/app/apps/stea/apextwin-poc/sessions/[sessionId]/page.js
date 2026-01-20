'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = useState(null);
  const [previousSessions, setPreviousSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [lapTimerActive, setLapTimerActive] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const sessionDoc = await getDoc(doc(db, 'apextwin_sessions', sessionId));
        if (!sessionDoc.exists()) {
          router.replace('/apps/stea/apextwin-poc/sessions');
          return;
        }

        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() };
        setSession(sessionData);

        const riderDoc = await getDoc(doc(db, 'apextwin_riders', user.uid));
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          const inferredLapTimerActive = typeof riderData.lapTimerActive === 'boolean'
            ? riderData.lapTimerActive
            : ['intermediate', 'pro'].includes(riderData.experienceLevel || 'novice');
          setLapTimerActive(inferredLapTimerActive);
        }

        // Fetch previous sessions at this track with same bike
        if (sessionData.trackId && sessionData.bikeId && sessionData.date) {
          const prevQuery = query(
            collection(db, 'apextwin_sessions'),
            where('riderId', '==', user.uid),
            where('trackId', '==', sessionData.trackId),
            where('bikeId', '==', sessionData.bikeId),
            where('date', '<', sessionData.date),
            orderBy('date', 'desc'),
            limit(3)
          );
          const prevSnap = await getDocs(prevQuery);
          setPreviousSessions(prevSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, router]);

  const handleDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'apextwin_sessions', sessionId));
      router.replace('/apps/stea/apextwin-poc/sessions');
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

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatShortDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="apex-panel p-8 text-center text-apex-soft">Loading session...</div>
    );
  }

  if (!session) {
    return (
      <div className="apex-panel p-8 text-center">
        <p className="text-apex-soft mb-4">Session not found</p>
        <Link href="/apps/stea/apextwin-poc/sessions" className="apex-btn apex-btn-secondary">
          Back to Sessions
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
            <Link href="/apps/stea/apextwin-poc/sessions" className="text-apex-soft hover:text-apex-white">
              ← Sessions
            </Link>
          </div>
          <h1 className="apex-h1">{session.trackName || 'Unknown Track'}</h1>
          <p className="text-apex-soft">
            {formatDate(session.date)}
            {session.sessionTime && <span className="ml-2 apex-data">@ {session.sessionTime}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-apex-heat/70 hover:text-apex-heat text-sm px-3 py-1 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Session Summary */}
      <div className="apex-panel p-6">
        <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Session Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="apex-label mb-1">Track</div>
            <div className="text-apex-white">{session.trackName || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Bike</div>
            <div className="text-apex-white">{session.bikeName || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Event</div>
            <div className="text-apex-white">{session.eventName || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Session #</div>
            <div className="apex-data">{session.sessionNumber || '--'}</div>
          </div>
          <div>
            <div className="apex-label mb-1">Time</div>
            <div className="apex-data">{session.sessionTime || '--'}</div>
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
          <div>
            <div className="apex-label mb-1">Weather</div>
            <div className="text-apex-white capitalize">{session.weather || '--'}</div>
          </div>
        </div>
      </div>

      {/* Tyre Setup */}
      <div className="apex-panel p-6">
        <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Tyre Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front */}
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
          {/* Rear */}
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
        {session.tireSetAgeSessions !== null && (
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

      {/* Previous Sessions at This Track */}
      {previousSessions.length > 0 && (
        <div className="apex-panel">
          <div className="p-4 border-b border-apex-stealth">
            <h2 className="apex-h2">Previous at {session.trackName}</h2>
            <p className="text-apex-soft text-sm">Same bike, ordered by date</p>
          </div>
          <div className="divide-y divide-apex-stealth">
            {previousSessions.map((prev) => (
              <Link
                key={prev.id}
                href={`/apps/stea/apextwin-poc/sessions/${prev.id}`}
                className="flex items-center justify-between p-4 hover:bg-apex-graphite/30 transition-colors"
              >
                <div className="text-apex-soft text-sm">{formatShortDate(prev.date)}</div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="apex-label text-[10px]">Front / Rear</div>
                    <div className="apex-data">
                      {prev.tirePressureFrontColdPsi || '--'} / {prev.tirePressureRearColdPsi || '--'}
                    </div>
                  </div>
                  {lapTimerActive && (
                    <div className="text-right">
                      <div className="apex-label text-[10px]">Fastest</div>
                      <div className="apex-data text-apex-mint">{formatLapTime(prev.fastestLapSec)}</div>
                    </div>
                  )}
                  <span className="text-apex-soft">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
