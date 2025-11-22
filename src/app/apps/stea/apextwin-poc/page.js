'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function ApexTwinDashboard() {
  const [recentSessions, setRecentSessions] = useState([]);
  const [bikesCount, setBikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch recent sessions
        const sessionsQuery = query(
          collection(db, 'apextwin_sessions'),
          where('riderId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(3)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentSessions(sessions);

        // Fetch bikes count
        const bikesQuery = query(
          collection(db, 'apextwin_riders', user.uid, 'bikes')
        );
        const bikesSnap = await getDocs(bikesQuery);
        setBikesCount(bikesSnap.size);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
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
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="apex-panel p-4 sm:p-8">
        <h1 className="apex-h1 mb-2">Track Setup Companion</h1>
        <p className="text-apex-soft max-w-2xl text-sm sm:text-base">
          Log tyre pressures, suspension settings, and electronics for every session.
          Compare setups in the paddock and track your progression.
        </p>
      </div>

      {/* Quick Actions - Primary CTA larger on mobile */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Link
          href="/apps/stea/apextwin-poc/sessions/new"
          className="apex-panel p-4 sm:p-6 hover:border-apex-mint/50 transition-colors group bg-gradient-to-r from-apex-graphite to-apex-carbon"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-2xl sm:text-3xl text-apex-mint">+</span>
              <div>
                <h3 className="text-apex-white font-semibold">Log New Session</h3>
                <p className="text-apex-soft text-xs sm:text-sm">Record your setup and performance</p>
              </div>
            </div>
            <span className="text-apex-soft group-hover:text-apex-mint transition-colors text-xl">→</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Link
            href="/apps/stea/apextwin-poc/sessions"
            className="apex-panel p-4 hover:border-apex-mint/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl sm:text-2xl text-apex-mint">◈</span>
              <span className="text-apex-soft group-hover:text-apex-mint transition-colors">→</span>
            </div>
            <h3 className="text-apex-white font-semibold text-sm sm:text-base">My Sessions</h3>
            <p className="text-apex-soft text-xs hidden sm:block">Browse history</p>
          </Link>

          <Link
            href="/apps/stea/apextwin-poc/paddock"
            className="apex-panel p-4 hover:border-apex-mint/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl sm:text-2xl text-apex-mint">⬡</span>
              <span className="text-apex-soft group-hover:text-apex-mint transition-colors">→</span>
            </div>
            <h3 className="text-apex-white font-semibold text-sm sm:text-base">Paddock</h3>
            <p className="text-apex-soft text-xs hidden sm:block">See others</p>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="apex-panel p-3 sm:p-4">
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Bikes</div>
          <div className="apex-data text-xl sm:text-2xl">{loading ? '--' : bikesCount}</div>
        </div>
        <div className="apex-panel p-3 sm:p-4">
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Sessions</div>
          <div className="apex-data text-xl sm:text-2xl">{loading ? '--' : recentSessions.length > 0 ? '...' : '0'}</div>
        </div>
        <div className="apex-panel p-3 sm:p-4">
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Last Track</div>
          <div className="apex-data text-sm sm:text-lg truncate">
            {loading ? '--' : recentSessions[0]?.trackName || 'None'}
          </div>
        </div>
        <div className="apex-panel p-3 sm:p-4">
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Best Lap</div>
          <div className="apex-data text-xl sm:text-2xl text-apex-mint">
            {loading ? '--' : formatLapTime(recentSessions[0]?.fastestLapSec)}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="apex-panel">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-apex-stealth">
          <h2 className="apex-h2">Recent Sessions</h2>
          <Link
            href="/apps/stea/apextwin-poc/sessions"
            className="text-apex-mint text-xs sm:text-sm hover:text-apex-mint-tint transition-colors"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 sm:p-8 text-center text-apex-soft">Loading...</div>
        ) : recentSessions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-apex-soft mb-4">No sessions logged yet</p>
            <Link href="/apps/stea/apextwin-poc/sessions/new" className="apex-btn apex-btn-primary">
              Log your first session
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-apex-stealth">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/apps/stea/apextwin-poc/sessions/${session.id}`}
                className="block p-3 sm:p-4 hover:bg-apex-graphite/50 transition-colors"
              >
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-apex-white font-medium text-sm truncate flex-1">{session.trackName || 'Unknown Track'}</span>
                    <span className="apex-data text-apex-mint ml-2">{formatLapTime(session.fastestLapSec)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-apex-soft">{formatDate(session.date)}</span>
                    <span className="apex-data text-apex-soft">
                      {session.tirePressureFrontColdPsi || '--'}/{session.tirePressureRearColdPsi || '--'} PSI
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-apex-white font-medium">{session.trackName || 'Unknown Track'}</span>
                      <span className="text-apex-soft text-sm">{session.bikeName || 'Unknown Bike'}</span>
                    </div>
                    <div className="text-apex-soft text-xs">{formatDate(session.date)}</div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className="apex-label text-[10px]">Front / Rear</div>
                      <div className="apex-data">
                        {session.tirePressureFrontColdPsi || '--'} / {session.tirePressureRearColdPsi || '--'} PSI
                      </div>
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

      {/* Bikes Quick Access */}
      <div className="apex-panel p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="apex-h2 mb-1">Your Bikes</h2>
            <p className="text-apex-soft text-xs sm:text-sm truncate">
              {bikesCount === 0 ? 'Add your bikes to get started' : `${bikesCount} bike${bikesCount !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <Link href="/apps/stea/apextwin-poc/bikes" className="apex-btn apex-btn-secondary text-xs sm:text-sm whitespace-nowrap">
            {bikesCount === 0 ? 'Add Bike' : 'Manage'}
          </Link>
        </div>
      </div>
    </div>
  );
}
