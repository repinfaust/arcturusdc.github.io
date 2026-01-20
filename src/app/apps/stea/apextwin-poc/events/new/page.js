'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

const EVENT_TYPES = [
  { value: 'track_day', label: 'Track Day' },
  { value: 'track_weekend', label: 'Track Weekend' },
  { value: 'race_event', label: 'Race Event' },
  { value: 'test_session', label: 'Test Session' },
];

const RIDER_GROUPS = [
  { value: 'orange', label: 'Orange', description: 'Newcomers / Learning', color: 'bg-orange-500' },
  { value: 'red', label: 'Red', description: 'Intermediate', color: 'bg-red-500' },
  { value: 'gold', label: 'Gold', description: 'Fast / Experienced', color: 'bg-yellow-500' },
];

export default function NewEventPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');

  const [formData, setFormData] = useState({
    trackId: '',
    eventType: 'track_day',
    riderGroup: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    selectedBikes: [],
    notes: '',
  });

  const getTrackLabel = (track) => `${track.name || ''} (${track.country || 'Unknown'})`;
  const findTrackByLabel = (label) =>
    tracks.find((track) => getTrackLabel(track).toLowerCase() === label.toLowerCase());

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch tracks
        const tracksQuery = query(
          collection(db, 'apextwin_tracks'),
          orderBy('name', 'asc')
        );
        const tracksSnap = await getDocs(tracksQuery);
        setTracks(tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch user's bikes
        const bikesQuery = query(
          collection(db, 'apextwin_riders', user.uid, 'bikes')
        );
        const bikesSnap = await getDocs(bikesQuery);
        setBikes(bikesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBikeToggle = (bikeId) => {
    setFormData(prev => ({
      ...prev,
      selectedBikes: prev.selectedBikes.includes(bikeId)
        ? prev.selectedBikes.filter(id => id !== bikeId)
        : [...prev.selectedBikes, bikeId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    if (!formData.trackId) {
      alert('Please select a track');
      return;
    }

    if (formData.selectedBikes.length === 0) {
      alert('Please select at least one bike');
      return;
    }

    setSaving(true);
    try {
      const selectedTrack = tracks.find(t => t.id === formData.trackId);
      const selectedBikesData = bikes
        .filter(b => formData.selectedBikes.includes(b.id))
        .map(b => ({ id: b.id, name: `${b.make} ${b.model}` }));

      const eventData = {
        riderId: user.uid,
        riderName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        trackId: formData.trackId,
        trackName: selectedTrack?.name || 'Unknown Track',
        trackLat: selectedTrack?.latitude || selectedTrack?.lat || null,
        trackLng: selectedTrack?.longitude || selectedTrack?.lng || null,
        trackCountry: selectedTrack?.country || null,
        eventType: formData.eventType,
        riderGroup: formData.riderGroup || null,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : null,
        bikes: selectedBikesData,
        notes: formData.notes || null,
        sessionCount: 0,
        paddockOptIn: false,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'apextwin_events'), eventData);
      router.push(`/apps/stea/apextwin-poc/events/${docRef.id}`);
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="apex-panel p-8 text-center text-apex-soft">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/apps/stea/apextwin-poc/events" className="text-apex-soft hover:text-apex-white">
            ← Events
          </Link>
        </div>
        <h1 className="apex-h1">New Event</h1>
        <p className="text-apex-soft text-sm">Create a track day, weekend, or race event</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Track Selection */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Circuit</h2>
          <div className="space-y-2">
            <label className="apex-label block mb-1">Track *</label>
            <input
              type="text"
              list="apextwin-track-options"
              className="apex-input"
              placeholder="Search and select a track..."
              value={trackQuery}
              onChange={(e) => {
                const value = e.target.value;
                setTrackQuery(value);
                const match = findTrackByLabel(value);
                setFormData(prev => ({ ...prev, trackId: match?.id || '' }));
              }}
              required
            />
            <datalist id="apextwin-track-options">
              {tracks.map(track => (
                <option key={track.id} value={getTrackLabel(track)} />
              ))}
            </datalist>
            <p className="text-apex-soft text-[10px]">
              Start typing to search, then select a track from the dropdown.
            </p>
          </div>
        </div>

        {/* Event Details */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Event Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="apex-label block mb-2">Event Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                className="apex-input"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="apex-label block mb-2">Rider Group</label>
              <select
                value={formData.riderGroup}
                onChange={(e) => setFormData(prev => ({ ...prev, riderGroup: e.target.value }))}
                className="apex-input"
              >
                <option value="">Select group...</option>
                {RIDER_GROUPS.map(group => (
                  <option key={group.value} value={group.value}>{group.label} - {group.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="apex-label block mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="apex-input"
                required
              />
            </div>
            <div>
              <label className="apex-label block mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="apex-input"
                placeholder="Optional for multi-day"
              />
            </div>
          </div>
        </div>

        {/* Bike Selection */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Bikes *</h2>
          {bikes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-apex-soft mb-3">No bikes registered yet</p>
              <Link href="/apps/stea/apextwin-poc/garage" className="apex-btn apex-btn-secondary text-sm">
                Add a bike first
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bikes.map(bike => (
                <button
                  key={bike.id}
                  type="button"
                  onClick={() => handleBikeToggle(bike.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.selectedBikes.includes(bike.id)
                      ? 'border-apex-mint bg-apex-mint/10'
                      : 'border-apex-stealth hover:border-apex-mint/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.selectedBikes.includes(bike.id)
                        ? 'border-apex-mint bg-apex-mint'
                        : 'border-apex-stealth'
                    }`}>
                      {formData.selectedBikes.includes(bike.id) && (
                        <span className="text-apex-carbon text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <div className="text-apex-white font-medium">
                        {bike.make} {bike.model}
                      </div>
                      <div className="text-apex-soft text-xs">
                        {bike.year} • {bike.engineCC}cc
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="apex-input min-h-[100px]"
            placeholder="Event goals, weather forecast, etc..."
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/apps/stea/apextwin-poc/events" className="apex-btn apex-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || bikes.length === 0}
            className="apex-btn apex-btn-primary apex-btn-touch"
          >
            {saving ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
