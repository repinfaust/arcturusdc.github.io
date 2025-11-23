'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const CircuitMap = dynamic(() => import('@/components/apextwin/CircuitMap'), {
  ssr: false,
  loading: () => (
    <div className="h-48 sm:h-64 bg-apex-graphite rounded-lg flex items-center justify-center">
      <span className="text-apex-soft text-sm">Loading map...</span>
    </div>
  ),
});

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch event
        const eventDoc = await getDoc(doc(db, 'apextwin_events', eventId));
        if (!eventDoc.exists()) {
          router.replace('/apps/stea/apextwin-poc/events');
          return;
        }

        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        setEvent(eventData);

        // Fetch sessions for this event
        const sessionsQuery = query(
          collection(db, 'apextwin_sessions'),
          where('eventId', '==', eventId),
          orderBy('date', 'desc')
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        setSessions(sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, router]);

  const handleDelete = async () => {
    if (!confirm('Delete this event and all its sessions? This cannot be undone.')) return;

    setDeleting(true);
    try {
      // Delete all sessions in this event
      for (const session of sessions) {
        await deleteDoc(doc(db, 'apextwin_sessions', session.id));
      }
      // Delete the event
      await deleteDoc(doc(db, 'apextwin_events', eventId));
      router.replace('/apps/stea/apextwin-poc/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
      setDeleting(false);
    }
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

  const formatLapTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  };

  const eventTypeLabel = (type) => {
    const labels = {
      'track_day': 'Track Day',
      'track_weekend': 'Track Weekend',
      'race_event': 'Race Event',
      'test_session': 'Test Session',
    };
    return labels[type] || type;
  };

  const riderGroupLabel = (group) => {
    const groups = {
      'orange': { label: 'Orange', color: 'bg-orange-500' },
      'red': { label: 'Red', color: 'bg-red-500' },
      'gold': { label: 'Gold', color: 'bg-yellow-500' },
    };
    return groups[group] || null;
  };

  if (loading) {
    return (
      <div className="apex-panel p-8 text-center text-apex-soft">Loading event...</div>
    );
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

  // Get best lap from sessions
  const bestLap = sessions.reduce((best, s) => {
    if (s.fastestLapSec && (!best || s.fastestLapSec < best)) return s.fastestLapSec;
    return best;
  }, null);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/apps/stea/apextwin-poc/events" className="text-apex-soft hover:text-apex-white">
              ← Events
            </Link>
          </div>
          <h1 className="apex-h1">{event.trackName || 'Unknown Track'}</h1>
          <p className="text-apex-soft text-sm">
            {formatDate(event.startDate)}
            {event.eventType && (
              <span className="ml-2 text-apex-mint/70">• {eventTypeLabel(event.eventType)}</span>
            )}
            {event.riderGroup && riderGroupLabel(event.riderGroup) && (
              <span className={`ml-2 inline-flex items-center gap-1`}>
                <span className={`w-2 h-2 rounded-full ${riderGroupLabel(event.riderGroup).color}`}></span>
                <span className="text-apex-white/70">{riderGroupLabel(event.riderGroup).label}</span>
              </span>
            )}
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

      {/* Map */}
      <div className="apex-panel overflow-hidden relative">
        <CircuitMap
          lat={event.trackLat}
          lng={event.trackLng}
          trackName={event.trackName}
          className="h-48 sm:h-64"
        />
        {/* Map Actions */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-2">
          <Link
            href={`/apps/stea/apextwin-poc/events/${eventId}/strategy`}
            className="px-3 py-1.5 bg-apex-mint text-apex-carbon text-xs font-semibold rounded-lg shadow-lg hover:bg-apex-mint-tint transition-colors"
          >
            Track Strategy
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="apex-panel p-3 sm:p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Sessions</div>
          <div className="apex-data text-xl sm:text-2xl">{sessions.length}</div>
        </div>
        <div className="apex-panel p-3 sm:p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Best Lap</div>
          <div className="apex-data text-xl sm:text-2xl text-apex-mint">{formatLapTime(bestLap)}</div>
        </div>
        <div className="apex-panel p-3 sm:p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Bikes</div>
          <div className="apex-data text-xl sm:text-2xl">{event.bikes?.length || 0}</div>
        </div>
      </div>

      {/* Bikes List */}
      {event.bikes && event.bikes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {event.bikes.map(bike => (
            <span key={bike.id} className="px-3 py-1 bg-apex-stealth rounded-full text-xs text-apex-white">
              {bike.name}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-apex-stealth">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'sessions'
              ? 'text-apex-mint border-b-2 border-apex-mint'
              : 'text-apex-soft hover:text-apex-white'
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('paddock')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'paddock'
              ? 'text-apex-mint border-b-2 border-apex-mint'
              : 'text-apex-soft hover:text-apex-white'
          }`}
        >
          Paddock
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* New Session Button */}
          <Link
            href={`/apps/stea/apextwin-poc/events/${eventId}/sessions/new`}
            className="apex-panel p-4 hover:border-apex-mint/50 transition-colors group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl text-apex-mint">+</span>
              <div>
                <span className="text-apex-white font-semibold">Log New Session</span>
                <p className="text-apex-soft text-xs">Record setup and performance</p>
              </div>
            </div>
            <span className="text-apex-soft group-hover:text-apex-mint transition-colors">→</span>
          </Link>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="apex-panel p-6 text-center">
              <p className="text-apex-soft">No sessions logged yet</p>
            </div>
          ) : (
            <div className="apex-panel divide-y divide-apex-stealth">
              {sessions.map((session, idx) => (
                <Link
                  key={session.id}
                  href={`/apps/stea/apextwin-poc/events/${eventId}/sessions/${session.id}`}
                  className="block p-4 hover:bg-apex-graphite/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-apex-white font-medium">
                          Session {session.sessionNumber || sessions.length - idx}
                        </span>
                        {session.sessionTime && (
                          <span className="text-apex-soft text-xs">@ {session.sessionTime}</span>
                        )}
                      </div>
                      <div className="text-apex-soft text-xs">
                        {session.bikeName || 'Unknown bike'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="apex-label text-[10px]">Laps</div>
                        <div className="apex-data">{session.lapsCompleted || '--'}</div>
                      </div>
                      <div className="text-right">
                        <div className="apex-label text-[10px]">Fastest</div>
                        <div className="apex-data text-apex-mint">{formatLapTime(session.fastestLapSec)}</div>
                      </div>
                      <span className="text-apex-soft">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'paddock' && (
        <PaddockView eventId={eventId} trackId={event.trackId} startDate={event.startDate} />
      )}

      {/* Notes */}
      {event.notes && (
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-2">Event Notes</h2>
          <p className="text-apex-white text-sm whitespace-pre-wrap">{event.notes}</p>
        </div>
      )}
    </div>
  );
}

// Paddock component showing other riders' setups at same track/date
function PaddockView({ eventId, trackId, startDate }) {
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaddock = async () => {
      try {
        // Get sessions at the same track around the same date (±2 days)
        const startDateObj = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const rangeStart = new Date(startDateObj);
        rangeStart.setDate(rangeStart.getDate() - 2);
        const rangeEnd = new Date(startDateObj);
        rangeEnd.setDate(rangeEnd.getDate() + 2);

        const paddockQuery = query(
          collection(db, 'apextwin_sessions'),
          where('trackId', '==', trackId),
          where('date', '>=', rangeStart),
          where('date', '<=', rangeEnd),
          orderBy('date', 'desc')
        );
        const snap = await getDocs(paddockQuery);

        // Filter out current user's sessions and get unique riders
        const user = auth.currentUser;
        const otherSetups = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => s.riderId !== user?.uid);

        setSetups(otherSetups);
      } catch (err) {
        console.error('Error fetching paddock:', err);
      } finally {
        setLoading(false);
      }
    };

    if (trackId && startDate) {
      fetchPaddock();
    }
  }, [eventId, trackId, startDate]);

  if (loading) {
    return <div className="apex-panel p-6 text-center text-apex-soft">Loading paddock...</div>;
  }

  if (setups.length === 0) {
    return (
      <div className="apex-panel p-6 text-center">
        <p className="text-apex-soft">No other riders logged at this track yet</p>
        <p className="text-apex-soft text-xs mt-1">Setups from others at the same track & date will appear here</p>
      </div>
    );
  }

  return (
    <div className="apex-panel divide-y divide-apex-stealth">
      <div className="p-4 border-b border-apex-stealth">
        <h3 className="text-apex-white font-semibold">Other Riders at Track</h3>
        <p className="text-apex-soft text-xs">Anonymous setups from other riders</p>
      </div>
      {setups.map((setup) => (
        <div key={setup.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-apex-white font-medium">{setup.bikeName || 'Unknown'}</span>
              <span className="text-apex-soft text-xs ml-2">by {setup.riderName?.split(' ')[0] || 'Rider'}</span>
            </div>
            {setup.fastestLapSec && (
              <span className="apex-data text-apex-mint">{formatLapTimeStatic(setup.fastestLapSec)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="apex-label">Front PSI</span>
              <div className="apex-data">{setup.tirePressureFrontColdPsi || '--'}</div>
            </div>
            <div>
              <span className="apex-label">Rear PSI</span>
              <div className="apex-data">{setup.tirePressureRearColdPsi || '--'}</div>
            </div>
            <div>
              <span className="apex-label">Weather</span>
              <div className="text-apex-white capitalize">{setup.weather || '--'}</div>
            </div>
            <div>
              <span className="apex-label">Laps</span>
              <div className="apex-data">{setup.lapsCompleted || '--'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatLapTimeStatic(seconds) {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${secs}`;
}
