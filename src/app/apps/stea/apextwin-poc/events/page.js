'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const eventsQuery = query(
          collection(db, 'apextwin_events'),
          where('riderId', '==', user.uid),
          orderBy('startDate', 'desc')
        );
        const snapshot = await getDocs(eventsQuery);
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (start, end) => {
    const startStr = formatDate(start);
    if (!end) return startStr;
    const endDate = end.toDate ? end.toDate() : new Date(end);
    const startDate = start.toDate ? start.toDate() : new Date(start);
    if (startDate.toDateString() === endDate.toDateString()) return startStr;
    return `${startStr} - ${formatDate(end)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="apex-h1">Events</h1>
          <p className="text-apex-soft text-sm">Track days, weekends, and race events</p>
        </div>
        <Link href="/apps/stea/apextwin-poc/events/new" className="apex-btn apex-btn-primary apex-btn-touch">
          + New Event
        </Link>
      </div>

      {/* Events List */}
      <div className="apex-panel">
        {loading ? (
          <div className="p-8 text-center text-apex-soft">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-apex-soft mb-4">No events yet</p>
            <Link href="/apps/stea/apextwin-poc/events/new" className="apex-btn apex-btn-primary">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-apex-stealth">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/apps/stea/apextwin-poc/events/${event.id}`}
                className="block p-4 hover:bg-apex-graphite/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-apex-white font-medium truncate">
                        {event.trackName || 'Unknown Track'}
                      </span>
                      {event.eventType && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-apex-stealth text-apex-soft uppercase">
                          {event.eventType}
                        </span>
                      )}
                    </div>
                    <div className="text-apex-soft text-xs">
                      {formatDateRange(event.startDate, event.endDate)}
                    </div>
                    {event.bikes && event.bikes.length > 0 && (
                      <div className="text-apex-mint/70 text-xs mt-1">
                        {event.bikes.map(b => b.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="apex-label text-[10px]">Sessions</div>
                      <div className="apex-data">{event.sessionCount || 0}</div>
                    </div>
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
