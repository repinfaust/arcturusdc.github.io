'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';

export default function SessionsListPage() {
  const [sessions, setSessions] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lapTimerActive, setLapTimerActive] = useState(false);

  // Filters
  const [selectedBike, setSelectedBike] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch bikes for filter
        const bikesSnap = await getDocs(collection(db, 'apextwin_riders', user.uid, 'bikes'));
        setBikes(bikesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch tracks for filter
        const tracksSnap = await getDocs(collection(db, 'apextwin_tracks'));
        setTracks(tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch sessions
        let sessionsQuery = query(
          collection(db, 'apextwin_sessions'),
          where('riderId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(50)
        );

        const sessionsSnap = await getDocs(sessionsQuery);
        setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch rider preferences
        const riderDoc = await getDoc(doc(db, 'apextwin_riders', user.uid));
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          const inferredLapTimerActive = typeof riderData.lapTimerActive === 'boolean'
            ? riderData.lapTimerActive
            : ['intermediate', 'pro'].includes(riderData.experienceLevel || 'novice');
          setLapTimerActive(inferredLapTimerActive);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatLapTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Apply filters
  const filteredSessions = sessions.filter((session) => {
    if (selectedBike && session.bikeId !== selectedBike) return false;
    if (selectedTrack && session.trackId !== selectedTrack) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="apex-h1 mb-1">My Sessions</h1>
          <p className="text-apex-soft">Browse and filter your session history</p>
        </div>
        <Link href="/apps/stea/apextwin-poc/sessions/new" className="apex-btn apex-btn-primary">
          + Log New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="apex-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="apex-label">Bike:</label>
            <select
              className="apex-input w-48"
              value={selectedBike}
              onChange={(e) => setSelectedBike(e.target.value)}
            >
              <option value="">All Bikes</option>
              {bikes.map((bike) => (
                <option key={bike.id} value={bike.id}>{bike.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="apex-label">Track:</label>
            <select
              className="apex-input w-48"
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
            >
              <option value="">All Tracks</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          </div>
          {(selectedBike || selectedTrack) && (
            <button
              onClick={() => { setSelectedBike(''); setSelectedTrack(''); }}
              className="text-apex-mint text-sm hover:text-apex-mint-tint"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="apex-panel">
        {loading ? (
          <div className="p-8 text-center text-apex-soft">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-apex-soft mb-4">
              {sessions.length === 0 ? 'No sessions logged yet' : 'No sessions match your filters'}
            </p>
            <Link href="/apps/stea/apextwin-poc/sessions/new" className="apex-btn apex-btn-primary">
              Log your first session
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-apex-stealth">
            {filteredSessions.map((session) => (
              <Link
                key={session.id}
                href={`/apps/stea/apextwin-poc/sessions/${session.id}`}
                className="block p-4 hover:bg-apex-graphite/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-apex-white font-medium">{session.trackName || 'Unknown Track'}</span>
                      <span className="text-apex-soft text-sm">{session.bikeName || 'Unknown Bike'}</span>
                      {session.eventName && (
                        <span className="text-apex-mint/60 text-xs">{session.eventName}</span>
                      )}
                    </div>
                    <div className="text-apex-soft text-xs">{formatDate(session.date)}</div>
                  </div>

                  <div className="flex items-center gap-6 text-sm shrink-0">
                    {/* Tyre Pressures */}
                    <div className="text-right hidden sm:block">
                      <div className="apex-label text-[10px]">Tyres (Cold)</div>
                      <div className="apex-data">
                        {session.tirePressureFrontColdPsi || '--'} / {session.tirePressureRearColdPsi || '--'}
                        <span className="text-apex-soft text-xs ml-1">PSI</span>
                      </div>
                    </div>

                    {/* Laps */}
                    {lapTimerActive ? (
                      <>
                        <div className="text-right hidden md:block">
                          <div className="apex-label text-[10px]">Laps</div>
                          <div className="apex-data">{session.lapsCompleted || '--'}</div>
                        </div>
                        <div className="text-right">
                          <div className="apex-label text-[10px]">Fastest</div>
                          <div className="apex-data text-apex-mint">{formatLapTime(session.fastestLapSec)}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-right">
                        <div className="apex-label text-[10px]">Lap Timing</div>
                        <div className="text-apex-soft text-xs">Off</div>
                      </div>
                    )}

                    <span className="text-apex-soft">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
