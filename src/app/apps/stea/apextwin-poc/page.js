'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function ApexTwinDashboard() {
  const [recentEvents, setRecentEvents] = useState([]);
  const [bikesCount, setBikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasCookie = document.cookie.includes('apextwin_onboarding=1');
    const hasLocal = window.localStorage.getItem('apextwin_onboarding_seen') === '1';
    if (!hasCookie && !hasLocal) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch recent events
        const eventsQuery = query(
          collection(db, 'apextwin_events'),
          where('riderId', '==', user.uid),
          orderBy('startDate', 'desc'),
          limit(3)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentEvents(events);

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
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="apex-panel p-6 max-w-lg w-full">
            <h2 className="apex-h2 mb-2">Welcome to ApexTwin</h2>
            <p className="text-apex-soft text-sm mb-4">
              Quick tour — keep it simple, then refine after you ride.
            </p>
            <div className="space-y-3 text-apex-soft text-sm">
              <div>1. Add a bike so your setup defaults are ready.</div>
              <div>2. Create an event for your track day or test.</div>
              <div>3. Log sessions and capture your notes + confidence.</div>
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href="/apps/stea/apextwin-poc/bikes"
                className="apex-btn apex-btn-secondary text-xs"
                onClick={() => {
                  setShowOnboarding(false);
                  window.localStorage.setItem('apextwin_onboarding_seen', '1');
                  document.cookie = 'apextwin_onboarding=1; path=/; max-age=31536000';
                }}
              >
                Add a Bike
              </Link>
              <Link
                href="/apps/stea/apextwin-poc/events/new"
                className="apex-btn apex-btn-primary text-xs"
                onClick={() => {
                  setShowOnboarding(false);
                  window.localStorage.setItem('apextwin_onboarding_seen', '1');
                  document.cookie = 'apextwin_onboarding=1; path=/; max-age=31536000';
                }}
              >
                Create Event
              </Link>
              <button
                type="button"
                className="text-apex-soft text-xs"
                onClick={() => {
                  setShowOnboarding(false);
                  window.localStorage.setItem('apextwin_onboarding_seen', '1');
                  document.cookie = 'apextwin_onboarding=1; path=/; max-age=31536000';
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
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
          href="/apps/stea/apextwin-poc/events/new"
          className="apex-panel p-4 sm:p-6 hover:border-apex-mint/50 transition-colors group bg-gradient-to-r from-apex-graphite to-apex-carbon"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-2xl sm:text-3xl text-apex-mint">+</span>
              <div>
                <h3 className="text-apex-white font-semibold">New Event</h3>
                <p className="text-apex-soft text-xs sm:text-sm">Create a track day or race event</p>
              </div>
            </div>
            <span className="text-apex-soft group-hover:text-apex-mint transition-colors text-xl">→</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Link
            href="/apps/stea/apextwin-poc/events"
            className="apex-panel p-4 hover:border-apex-mint/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl sm:text-2xl text-apex-mint">◈</span>
              <span className="text-apex-soft group-hover:text-apex-mint transition-colors">→</span>
            </div>
            <h3 className="text-apex-white font-semibold text-sm sm:text-base">My Events</h3>
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
            <p className="text-apex-soft text-xs hidden sm:block">Shared setups (opt-in)</p>
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
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Events</div>
          <div className="apex-data text-xl sm:text-2xl">{loading ? '--' : recentEvents.length > 0 ? '...' : '0'}</div>
        </div>
        <div className="apex-panel p-3 sm:p-4">
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Last Track</div>
          <div className="apex-data text-sm sm:text-lg truncate">
            {loading ? '--' : recentEvents[0]?.trackName || 'None'}
          </div>
        </div>
        <div className="apex-panel p-3 sm:p-4">
          <div className="apex-label mb-1 text-[10px] sm:text-xs">Sessions</div>
          <div className="apex-data text-xl sm:text-2xl text-apex-mint">
            {loading ? '--' : recentEvents.reduce((sum, e) => sum + (e.sessionCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="apex-panel">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-apex-stealth">
          <h2 className="apex-h2">Recent Events</h2>
          <Link
            href="/apps/stea/apextwin-poc/events"
            className="text-apex-mint text-xs sm:text-sm hover:text-apex-mint-tint transition-colors"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 sm:p-8 text-center text-apex-soft">Loading...</div>
        ) : recentEvents.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-apex-soft mb-4">No events yet</p>
            <Link href="/apps/stea/apextwin-poc/events/new" className="apex-btn apex-btn-primary">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-apex-stealth">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/apps/stea/apextwin-poc/events/${event.id}`}
                className="block p-3 sm:p-4 hover:bg-apex-graphite/50 transition-colors"
              >
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-apex-white font-medium text-sm truncate flex-1">{event.trackName || 'Unknown Track'}</span>
                    <span className="apex-data text-apex-mint ml-2">{event.sessionCount || 0} sessions</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-apex-soft">{formatDate(event.startDate)}</span>
                    {event.bikes && event.bikes.length > 0 && (
                      <span className="text-apex-soft truncate max-w-[120px]">
                        {event.bikes.map(b => b.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-apex-white font-medium">{event.trackName || 'Unknown Track'}</span>
                      {event.eventType && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-apex-stealth text-apex-soft uppercase">
                          {event.eventType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-apex-soft text-xs">{formatDate(event.startDate)}</div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className="apex-label text-[10px]">Sessions</div>
                      <div className="apex-data">{event.sessionCount || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="apex-label text-[10px]">Bikes</div>
                      <div className="apex-data text-apex-mint">{event.bikes?.length || 0}</div>
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
