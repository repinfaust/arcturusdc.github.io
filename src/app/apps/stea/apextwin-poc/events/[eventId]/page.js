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
  const [lapTimerActive, setLapTimerActive] = useState(false);
  const [paddockUpdating, setPaddockUpdating] = useState(false);

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

        // Fetch rider preferences for lap timing
        const riderDoc = await getDoc(doc(db, 'apextwin_riders', user.uid));
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          const inferredLapTimerActive = typeof riderData.lapTimerActive === 'boolean'
            ? riderData.lapTimerActive
            : ['intermediate', 'pro'].includes(riderData.experienceLevel || 'novice');
          setLapTimerActive(inferredLapTimerActive);
        }
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

  const handlePaddockToggle = async () => {
    if (!event) return;
    const nextValue = !event.paddockOptIn;
    setPaddockUpdating(true);
    setEvent(prev => ({ ...prev, paddockOptIn: nextValue }));
    setSessions(prev => prev.map(session => ({ ...session, paddockOptIn: nextValue })));

    try {
      await updateDoc(doc(db, 'apextwin_events', eventId), { paddockOptIn: nextValue });
      if (sessions.length > 0) {
        await Promise.all(
          sessions.map(session =>
            updateDoc(doc(db, 'apextwin_sessions', session.id), { paddockOptIn: nextValue })
          )
        );
      }
    } catch (err) {
      console.error('Error updating paddock setting:', err);
      setEvent(prev => ({ ...prev, paddockOptIn: !nextValue }));
      setSessions(prev => prev.map(session => ({ ...session, paddockOptIn: !nextValue })));
      alert('Failed to update paddock sharing');
    } finally {
      setPaddockUpdating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
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
  const summaryCols = lapTimerActive ? 'grid-cols-3' : 'grid-cols-2';

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
      <div className="apex-panel overflow-hidden">
        <CircuitMap
          trackName={event.trackName}
          className="h-48 sm:h-64"
          variant="placeholder"
        />
      </div>

      {/* Track Strategy */}
      <details className="apex-panel p-3 sm:p-4 group">
        <summary className="flex items-center justify-between cursor-pointer list-none">
          <div className="flex items-center gap-3">
            <span className="text-xl text-apex-mint">⚑</span>
            <div>
              <span className="text-apex-white font-semibold text-sm sm:text-base">Track Strategy</span>
              <p className="text-apex-soft text-xs">Open your notes and map references</p>
            </div>
          </div>
          <span className="text-apex-soft group-hover:text-apex-mint transition-colors">▾</span>
        </summary>
        <div className="mt-3 text-apex-soft text-xs sm:text-sm">
          Use this board to mark braking points, lines, and corner notes.
          <div className="mt-3">
            <Link
              href={`/apps/stea/apextwin-poc/events/${eventId}/strategy`}
              className="apex-btn apex-btn-secondary text-xs sm:text-sm"
            >
              Open Strategy
            </Link>
          </div>
        </div>
      </details>

      {/* Session Summary */}
      <div className="apex-panel p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="apex-h2">Session Summary</h2>
          <span
            className="text-apex-soft text-xs"
            title="Lap metrics show when an active lap timer is in use."
          >
            ⓘ
          </span>
        </div>
        <div className={`grid ${summaryCols} gap-3`}>
          <div className="apex-panel p-3 text-center">
            <div className="apex-label text-[10px] mb-1">Sessions</div>
            <div className="apex-data text-xl sm:text-2xl">{sessions.length}</div>
          </div>
          {lapTimerActive && (
            <div className="apex-panel p-3 text-center">
              <div className="apex-label text-[10px] mb-1">Best Lap</div>
              <div className="apex-data text-xl sm:text-2xl text-apex-mint">{formatLapTime(bestLap)}</div>
            </div>
          )}
          <div className="apex-panel p-3 text-center">
            <div className="apex-label text-[10px] mb-1">Bikes</div>
            <div className="apex-data text-xl sm:text-2xl">{event.bikes?.length || 0}</div>
          </div>
        </div>
        {event.bikes && event.bikes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {event.bikes.map(bike => (
              <span key={bike.id} className="px-3 py-1 bg-apex-stealth rounded-full text-xs text-apex-white">
                {bike.name}
              </span>
            ))}
          </div>
        )}
      </div>

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

      {/* Previous Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="apex-h2">Previous Sessions</h2>
          <span className="text-apex-soft text-xs">At this track</span>
        </div>

        {lapTimerActive && sessions.length > 0 && (
          <LapTimeVisualization sessions={sessions} bestLap={bestLap} formatLapTime={formatLapTime} />
        )}

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
                  {lapTimerActive ? (
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
                  ) : (
                    <span className="text-apex-soft text-xs">View notes →</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Paddock */}
      <PaddockView
        eventId={eventId}
        trackId={event.trackId}
        startDate={event.startDate}
        paddockOptIn={!!event.paddockOptIn}
        onToggleOptIn={handlePaddockToggle}
        toggling={paddockUpdating}
      />

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
function PaddockView({ eventId, trackId, startDate, paddockOptIn, onToggleOptIn, toggling }) {
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
          .filter(s => s.riderId !== user?.uid)
          .filter(s => !!s.paddockOptIn);

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

  return (
    <div className="space-y-3">
      <div className="apex-panel p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="apex-h2 mb-1">Paddock</h3>
            <p className="text-apex-soft text-xs">
              See anonymised setups from riders at the same track and date range.
            </p>
            <p className="text-apex-soft text-xs mt-1">
              Your identity is hidden. You control whether your data is shared for this event.
            </p>
          </div>
          <button
            onClick={onToggleOptIn}
            disabled={toggling}
            className={`apex-btn ${paddockOptIn ? 'apex-btn-primary' : 'apex-btn-secondary'} text-xs`}
            title="Share anonymised tyre pressures and basic session info for this event."
          >
            {toggling ? 'Updating...' : paddockOptIn ? 'Sharing On' : 'Share My Data'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="apex-panel p-6 text-center text-apex-soft">Loading paddock...</div>
      ) : setups.length === 0 ? (
        <div className="apex-panel p-6 text-center">
          <p className="text-apex-soft">No shared setups yet for this track</p>
          <p className="text-apex-soft text-xs mt-1">Shared data from other riders will appear here</p>
        </div>
      ) : (
        <div className="apex-panel divide-y divide-apex-stealth">
          <div className="p-4 border-b border-apex-stealth">
            <h4 className="text-apex-white font-semibold">Other Riders at Track</h4>
            <p className="text-apex-soft text-xs">Shared, anonymised snapshots</p>
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
      )}
    </div>
  );
}

function formatLapTimeStatic(seconds) {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${secs}`;
}

// Lap Time Visualization Component
function LapTimeVisualization({ sessions, bestLap, formatLapTime }) {
  const [activeOverlays, setActiveOverlays] = useState([]);
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);

  // Available data overlays
  const OVERLAY_OPTIONS = [
    { key: 'tirePressureFront', label: 'Front Tyre PSI', color: '#4ade80', unit: 'psi' },
    { key: 'tirePressureRear', label: 'Rear Tyre PSI', color: '#60a5fa', unit: 'psi' },
    { key: 'suspensionFrontRebound', label: 'Front Rebound', color: '#f472b6', unit: 'clicks' },
    { key: 'suspensionRearRebound', label: 'Rear Rebound', color: '#fb923c', unit: 'clicks' },
    { key: 'confidence', label: 'Confidence', color: '#a78bfa', unit: '%' },
    { key: 'lapsCompleted', label: 'Laps', color: '#fbbf24', unit: '' },
    { key: 'trackTemp', label: 'Track Temp', color: '#f87171', unit: '°C' },
    { key: 'tyreSetAge', label: 'Tyre Age', color: '#94a3b8', unit: 'sessions' },
  ];

  // Sort sessions by session number or creation order
  const sortedSessions = [...sessions].sort((a, b) => {
    const numA = a.sessionNumber || 0;
    const numB = b.sessionNumber || 0;
    return numA - numB;
  });

  // Calculate lap time range for scaling
  const lapTimes = sortedSessions.map(s => s.fastestLapSec).filter(Boolean);
  const minLap = Math.min(...lapTimes);
  const maxLap = Math.max(...lapTimes);
  const range = maxLap - minLap || 1;

  // Calculate percentage position for lap time bar
  const getLapPosition = (lapSec) => {
    if (!lapSec) return 50;
    // Invert so faster (lower) times appear higher
    return 100 - ((lapSec - minLap) / range) * 80 - 10;
  };

  // Get overlay value ranges for scaling
  const getOverlayRange = (key) => {
    const values = sortedSessions.map(s => s[key]).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  // Calculate variance impact
  const calculateVariance = () => {
    if (sortedSessions.length < 2) return [];

    const variances = [];

    OVERLAY_OPTIONS.forEach(overlay => {
      const sessionsWithBoth = sortedSessions.filter(s =>
        s.fastestLapSec && s[overlay.key] !== undefined && s[overlay.key] !== null
      );

      if (sessionsWithBoth.length >= 2) {
        // Simple correlation calculation
        const values = sessionsWithBoth.map(s => s[overlay.key]);
        const times = sessionsWithBoth.map(s => s.fastestLapSec);

        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

        let numerator = 0;
        let denomValue = 0;
        let denomTime = 0;

        for (let i = 0; i < values.length; i++) {
          numerator += (values[i] - avgValue) * (times[i] - avgTime);
          denomValue += Math.pow(values[i] - avgValue, 2);
          denomTime += Math.pow(times[i] - avgTime, 2);
        }

        const correlation = denomValue && denomTime
          ? numerator / (Math.sqrt(denomValue) * Math.sqrt(denomTime))
          : 0;

        if (Math.abs(correlation) > 0.3) {
          variances.push({
            key: overlay.key,
            label: overlay.label,
            correlation: correlation,
            impact: correlation > 0 ? 'slower' : 'faster',
            dataPoints: sessionsWithBoth.length,
            confidence: sessionsWithBoth.length >= 5 ? 'high' : sessionsWithBoth.length >= 3 ? 'medium' : 'low',
          });
        }
      }
    });

    return variances.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  };

  const toggleOverlay = (key) => {
    setActiveOverlays(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const variances = calculateVariance();

  // Determine if we need horizontal scroll (more than 6 sessions on mobile)
  const needsScroll = sortedSessions.length > 6;

  return (
    <div className="apex-panel p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="apex-h2 text-sm sm:text-base">Lap Time Analysis</h2>
        <div className="relative">
          <button
            onClick={() => setShowOverlayMenu(!showOverlayMenu)}
            className="apex-btn apex-btn-secondary text-[10px] sm:text-xs px-2 sm:px-3 py-1 whitespace-nowrap"
          >
            Overlays {activeOverlays.length > 0 && `(${activeOverlays.length})`}
          </button>
          {showOverlayMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowOverlayMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-apex-graphite border border-apex-stealth rounded-lg p-2 z-20 w-44 sm:w-48 shadow-xl max-h-64 overflow-y-auto">
                {OVERLAY_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => toggleOverlay(option.key)}
                    className={`w-full text-left px-2 sm:px-3 py-2.5 sm:py-2 rounded text-xs flex items-center gap-2 transition-colors ${
                      activeOverlays.includes(option.key)
                        ? 'bg-apex-stealth text-apex-white'
                        : 'text-apex-soft hover:bg-apex-stealth/50 active:bg-apex-stealth/50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative bg-apex-graphite rounded-lg p-2 sm:p-4">
        {/* Y-axis labels - narrower on mobile */}
        <div className="absolute left-1 sm:left-0 top-3 sm:top-4 bottom-6 sm:bottom-8 w-10 sm:w-12 flex flex-col justify-between text-[8px] sm:text-[10px] text-apex-soft">
          <span className="truncate">{formatLapTime(minLap)}</span>
          <span className="text-apex-mint">Best</span>
          <span className="truncate">{formatLapTime(maxLap)}</span>
        </div>

        {/* Chart Grid - scrollable on mobile if many sessions */}
        <div className={`ml-11 sm:ml-14 relative ${needsScroll ? 'overflow-x-auto pb-2 -mr-2 sm:mr-0' : ''}`}>
          <div
            className="relative h-32 sm:h-40"
            style={needsScroll ? { minWidth: `${sortedSessions.length * 40}px` } : {}}
          >
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-b border-apex-stealth/30 w-full" />
              ))}
            </div>

            {/* Best lap reference line */}
            <div
              className="absolute w-full border-t border-dashed border-apex-mint/50 pointer-events-none"
              style={{ top: `${getLapPosition(bestLap)}%` }}
            />

            {/* Session bars and points */}
            <div className="absolute inset-0 flex items-end justify-around px-1 sm:px-2">
              {sortedSessions.map((session, idx) => {
                const lapPos = getLapPosition(session.fastestLapSec);
                const isBest = session.fastestLapSec === bestLap;

                return (
                  <div
                    key={session.id}
                    className="relative flex flex-col items-center min-w-[24px] sm:min-w-0"
                    style={{ height: '100%', flex: needsScroll ? '0 0 auto' : 1 }}
                  >
                    {/* Lap time point - larger touch target on mobile */}
                    {session.fastestLapSec && (
                      <div
                        className={`absolute w-4 h-4 sm:w-3 sm:h-3 rounded-full transition-all ${
                          isBest ? 'bg-apex-mint ring-2 ring-apex-mint/30' : 'bg-apex-white'
                        }`}
                        style={{ top: `${lapPos}%`, transform: 'translateY(-50%)' }}
                        title={`${formatLapTime(session.fastestLapSec)}`}
                      />
                    )}

                    {/* Overlay points */}
                    {activeOverlays.map(overlayKey => {
                      const overlay = OVERLAY_OPTIONS.find(o => o.key === overlayKey);
                      const value = session[overlayKey];
                      if (value === undefined || value === null) return null;

                      const overlayRange = getOverlayRange(overlayKey);
                      const overlayPos = 100 - ((value - overlayRange.min) / (overlayRange.max - overlayRange.min || 1)) * 80 - 10;

                      return (
                        <div
                          key={overlayKey}
                          className="absolute w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full opacity-70"
                          style={{
                            backgroundColor: overlay.color,
                            top: `${overlayPos}%`,
                            transform: 'translateY(-50%)',
                          }}
                          title={`${overlay.label}: ${value}${overlay.unit}`}
                        />
                      );
                    })}

                    {/* Session label */}
                    <div className="absolute bottom-0 transform translate-y-full pt-0.5 sm:pt-1">
                      <span className="text-[8px] sm:text-[10px] text-apex-soft">S{session.sessionNumber || idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll hint for mobile */}
        {needsScroll && (
          <div className="sm:hidden text-[8px] text-apex-soft text-center mt-1">
            ← Scroll to see all sessions →
          </div>
        )}
      </div>

      {/* Active Overlays Legend */}
      {activeOverlays.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-apex-white" />
            <span className="text-[9px] sm:text-[10px] text-apex-soft">Lap Time</span>
          </div>
          {activeOverlays.map(key => {
            const overlay = OVERLAY_OPTIONS.find(o => o.key === key);
            return (
              <div key={key} className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full opacity-70 flex-shrink-0"
                  style={{ backgroundColor: overlay.color }}
                />
                <span className="text-[9px] sm:text-[10px] text-apex-soft">{overlay.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Variance Insights */}
      {variances.length > 0 && (
        <div className="border-t border-apex-stealth pt-3 sm:pt-4">
          <h3 className="text-[10px] sm:text-xs font-semibold text-apex-white mb-2">Performance Insights</h3>
          <div className="space-y-2">
            {variances.slice(0, 3).map(v => (
              <div
                key={v.key}
                className="bg-apex-graphite/50 rounded px-2 sm:px-3 py-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-apex-soft">{v.label}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      v.confidence === 'high' ? 'bg-apex-mint/20 text-apex-mint' :
                      v.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-apex-stealth text-apex-soft'
                    }`}>
                      {v.dataPoints} pts
                    </span>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium ${
                    v.impact === 'faster' ? 'text-apex-mint' : 'text-apex-heat'
                  }`}>
                    Higher = {v.impact} ({(Math.abs(v.correlation) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] sm:text-[10px] text-apex-soft mt-2">
            Based on {sessions.length} sessions • More data = more accurate insights
          </p>
        </div>
      )}

      {/* No data state */}
      {sortedSessions.length === 0 && (
        <div className="text-center py-6 sm:py-8 text-apex-soft text-xs sm:text-sm">
          Log sessions to see lap time analysis
        </div>
      )}
    </div>
  );
}
