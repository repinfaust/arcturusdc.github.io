'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';

export default function NewSessionPage() {
  const router = useRouter();
  const [bikes, setBikes] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCustomTrack, setShowCustomTrack] = useState(false);
  const [lapTimerActive, setLapTimerActive] = useState(false);

  const [formData, setFormData] = useState({
    // Session basics
    date: new Date().toISOString().split('T')[0],
    sessionTime: '',
    bikeId: '',
    trackId: '',
    eventName: '',
    sessionNumber: '',
    // Custom track
    customTrackName: '',
    customTrackCountry: '',
    // Tyres
    tireBrandFront: '',
    tireCompoundFront: '',
    tirePressureFrontColdPsi: '',
    tirePressureFrontHotPsi: '',
    tireBrandRear: '',
    tireCompoundRear: '',
    tirePressureRearColdPsi: '',
    tirePressureRearHotPsi: '',
    tireSetAgeSessions: '',
    // Suspension
    forkCompClicksOut: '',
    forkRebClicksOut: '',
    shockCompClicksOut: '',
    shockRebClicksOut: '',
    // Electronics
    tractionControlLevel: '',
    engineMap: '',
    // Outcome
    lapsCompleted: '',
    fastestLapMin: '',
    fastestLapSec: '',
    notesHandling: '',
    // Conditions
    weather: '',
    // Confidence
    confidence: 50,
  });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch bikes
        const bikesSnap = await getDocs(collection(db, 'apextwin_riders', user.uid, 'bikes'));
        setBikes(bikesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch tracks
        const tracksSnap = await getDocs(collection(db, 'apextwin_tracks'));
        setTracks(tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    // Validation
    if (!formData.bikeId) {
      alert('Please select a bike');
      return;
    }
    if (!formData.trackId && !formData.customTrackName) {
      alert('Please select or add a track');
      return;
    }

    setSaving(true);

    try {
      // Get bike details
      const selectedBike = bikes.find(b => b.id === formData.bikeId);

      // Handle custom track
      let trackId = formData.trackId;
      let trackName = tracks.find(t => t.id === formData.trackId)?.name || '';

      if (showCustomTrack && formData.customTrackName) {
        // Create new track
        const trackDoc = await addDoc(collection(db, 'apextwin_tracks'), {
          name: formData.customTrackName.trim(),
          country: formData.customTrackCountry.trim() || null,
          source: 'manual',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
        trackId = trackDoc.id;
        trackName = formData.customTrackName.trim();
      }

      // Calculate fastest lap in seconds
      let fastestLapSec = null;
      if (lapTimerActive && (formData.fastestLapMin || formData.fastestLapSec)) {
        const mins = parseFloat(formData.fastestLapMin) || 0;
        const secs = parseFloat(formData.fastestLapSec) || 0;
        fastestLapSec = mins * 60 + secs;
      }

      // Create session
      const sessionData = {
        riderId: user.uid,
        riderName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        bikeId: formData.bikeId,
        bikeName: selectedBike ? `${selectedBike.make} ${selectedBike.model}` : 'Unknown',
        trackId: trackId,
        trackName: trackName,
        date: Timestamp.fromDate(new Date(formData.date)),
        sessionTime: formData.sessionTime || null,
        eventName: formData.eventName.trim() || null,
        sessionNumber: formData.sessionNumber ? parseInt(formData.sessionNumber) : null,
        // Tyres
        tireBrandFront: formData.tireBrandFront.trim() || null,
        tireCompoundFront: formData.tireCompoundFront.trim() || null,
        tirePressureFrontColdPsi: formData.tirePressureFrontColdPsi ? parseFloat(formData.tirePressureFrontColdPsi) : null,
        tirePressureFrontHotPsi: formData.tirePressureFrontHotPsi ? parseFloat(formData.tirePressureFrontHotPsi) : null,
        tireBrandRear: formData.tireBrandRear.trim() || null,
        tireCompoundRear: formData.tireCompoundRear.trim() || null,
        tirePressureRearColdPsi: formData.tirePressureRearColdPsi ? parseFloat(formData.tirePressureRearColdPsi) : null,
        tirePressureRearHotPsi: formData.tirePressureRearHotPsi ? parseFloat(formData.tirePressureRearHotPsi) : null,
        tireSetAgeSessions: formData.tireSetAgeSessions ? parseInt(formData.tireSetAgeSessions) : null,
        // Suspension
        forkCompClicksOut: formData.forkCompClicksOut ? parseInt(formData.forkCompClicksOut) : null,
        forkRebClicksOut: formData.forkRebClicksOut ? parseInt(formData.forkRebClicksOut) : null,
        shockCompClicksOut: formData.shockCompClicksOut ? parseInt(formData.shockCompClicksOut) : null,
        shockRebClicksOut: formData.shockRebClicksOut ? parseInt(formData.shockRebClicksOut) : null,
        // Electronics
        tractionControlLevel: formData.tractionControlLevel.trim() || null,
        engineMap: formData.engineMap.trim() || null,
        // Outcome
        lapsCompleted: lapTimerActive && formData.lapsCompleted ? parseInt(formData.lapsCompleted) : null,
        fastestLapSec: fastestLapSec,
        notesHandling: formData.notesHandling.trim() || null,
        // Conditions
        weather: formData.weather || null,
        // Confidence
        confidence: formData.confidence,
        paddockOptIn: false,
        // Meta
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'apextwin_sessions'), sessionData);
      router.push(`/apps/stea/apextwin-poc/sessions/${docRef.id}`);
    } catch (err) {
      console.error('Error saving session:', err);
      alert('Failed to save session');
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
      <div>
        <h1 className="apex-h1 mb-1">Log New Session</h1>
        <p className="text-apex-soft">Record your setup and performance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Session Basics */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="apex-label block mb-1">Date *</label>
              <input
                type="date"
                required
                className="apex-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Session Time</label>
              <input
                type="time"
                className="apex-input"
                value={formData.sessionTime}
                onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Bike *</label>
              <select
                required
                className="apex-input"
                value={formData.bikeId}
                onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })}
              >
                <option value="">Select bike...</option>
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.name} ({bike.make} {bike.model})
                  </option>
                ))}
              </select>
              {bikes.length === 0 && (
                <p className="text-apex-heat text-xs mt-1">
                  No bikes found. <a href="/apps/stea/apextwin-poc/bikes" className="underline">Add a bike first</a>
                </p>
              )}
            </div>
            <div>
              <label className="apex-label block mb-1">Track *</label>
              {!showCustomTrack ? (
                <>
                  <select
                    className="apex-input"
                    value={formData.trackId}
                    onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
                  >
                    <option value="">Select track...</option>
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name} {track.country && `(${track.country})`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomTrack(true)}
                    className="text-apex-mint text-xs mt-1 hover:text-apex-mint-tint"
                  >
                    + Add custom track
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Track name"
                    className="apex-input"
                    value={formData.customTrackName}
                    onChange={(e) => setFormData({ ...formData, customTrackName: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Country (optional)"
                    className="apex-input"
                    value={formData.customTrackCountry}
                    onChange={(e) => setFormData({ ...formData, customTrackCountry: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => { setShowCustomTrack(false); setFormData({ ...formData, customTrackName: '', customTrackCountry: '' }); }}
                    className="text-apex-soft text-xs hover:text-apex-white"
                  >
                    ← Back to track list
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="apex-label block mb-1">Event Name</label>
              <input
                type="text"
                placeholder="e.g. No Limits TD"
                className="apex-input"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Session #</label>
              <input
                type="number"
                min="1"
                placeholder="1, 2, 3..."
                className="apex-input"
                value={formData.sessionNumber}
                onChange={(e) => setFormData({ ...formData, sessionNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Weather</label>
              <select
                className="apex-input"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="sunny">Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="wet">Wet</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tyres */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Tyre Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front */}
            <div className="space-y-3">
              <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider">Front</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="apex-label block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Pirelli"
                    className="apex-input"
                    value={formData.tireBrandFront}
                    onChange={(e) => setFormData({ ...formData, tireBrandFront: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Compound</label>
                  <input
                    type="text"
                    placeholder="e.g. SC1"
                    className="apex-input"
                    value={formData.tireCompoundFront}
                    onChange={(e) => setFormData({ ...formData, tireCompoundFront: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Cold PSI</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="32.0"
                    className="apex-input font-mono"
                    value={formData.tirePressureFrontColdPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureFrontColdPsi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Hot PSI</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="35.0"
                    className="apex-input font-mono"
                    value={formData.tirePressureFrontHotPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureFrontHotPsi: e.target.value })}
                  />
                </div>
              </div>
            </div>
            {/* Rear */}
            <div className="space-y-3">
              <h3 className="text-apex-mint font-semibold text-sm uppercase tracking-wider">Rear</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="apex-label block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Pirelli"
                    className="apex-input"
                    value={formData.tireBrandRear}
                    onChange={(e) => setFormData({ ...formData, tireBrandRear: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Compound</label>
                  <input
                    type="text"
                    placeholder="e.g. SC0"
                    className="apex-input"
                    value={formData.tireCompoundRear}
                    onChange={(e) => setFormData({ ...formData, tireCompoundRear: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Cold PSI</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="29.0"
                    className="apex-input font-mono"
                    value={formData.tirePressureRearColdPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureRearColdPsi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Hot PSI</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="31.0"
                    className="apex-input font-mono"
                    value={formData.tirePressureRearHotPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureRearHotPsi: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="apex-label block mb-1">Tyre Set Age (sessions)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="apex-input w-32"
              value={formData.tireSetAgeSessions}
              onChange={(e) => setFormData({ ...formData, tireSetAgeSessions: e.target.value })}
            />
          </div>
        </div>

        {/* Quick Setup */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Quick Setup</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="apex-label block mb-1">Fork Comp (clicks out)</label>
              <input
                type="number"
                min="0"
                className="apex-input font-mono"
                value={formData.forkCompClicksOut}
                onChange={(e) => setFormData({ ...formData, forkCompClicksOut: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Fork Reb (clicks out)</label>
              <input
                type="number"
                min="0"
                className="apex-input font-mono"
                value={formData.forkRebClicksOut}
                onChange={(e) => setFormData({ ...formData, forkRebClicksOut: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Shock Comp (clicks out)</label>
              <input
                type="number"
                min="0"
                className="apex-input font-mono"
                value={formData.shockCompClicksOut}
                onChange={(e) => setFormData({ ...formData, shockCompClicksOut: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Shock Reb (clicks out)</label>
              <input
                type="number"
                min="0"
                className="apex-input font-mono"
                value={formData.shockRebClicksOut}
                onChange={(e) => setFormData({ ...formData, shockRebClicksOut: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Traction Control</label>
              <input
                type="text"
                placeholder="e.g. TC 3"
                className="apex-input font-mono"
                value={formData.tractionControlLevel}
                onChange={(e) => setFormData({ ...formData, tractionControlLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="apex-label block mb-1">Engine Map</label>
              <input
                type="text"
                placeholder="e.g. A, B, Rain"
                className="apex-input font-mono"
                value={formData.engineMap}
                onChange={(e) => setFormData({ ...formData, engineMap: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Outcome */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Outcome</h2>
          {lapTimerActive ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="apex-label block mb-1">Laps Completed</label>
                <input
                  type="number"
                  min="0"
                  className="apex-input font-mono"
                  value={formData.lapsCompleted}
                  onChange={(e) => setFormData({ ...formData, lapsCompleted: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="apex-label block mb-1">Fastest Lap (mm:ss.xx)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="1"
                    className="apex-input w-20 font-mono text-center"
                    value={formData.fastestLapMin}
                    onChange={(e) => setFormData({ ...formData, fastestLapMin: e.target.value })}
                  />
                  <span className="text-apex-white text-xl">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59.99"
                    step="0.01"
                    placeholder="45.00"
                    className="apex-input w-28 font-mono text-center"
                    value={formData.fastestLapSec}
                    onChange={(e) => setFormData({ ...formData, fastestLapSec: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-apex-soft text-xs mb-4">
              Lap timing is off. Enable “Active lap timer in use” in your rider profile to log lap metrics.
            </p>
          )}
          {/* Confidence Slider */}
          <div className="mt-4">
            <label className="apex-label block mb-2">Confidence Level</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="flex-1 h-2 bg-apex-stealth rounded-lg appearance-none cursor-pointer accent-apex-mint"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
              />
              <span className="apex-data text-apex-mint w-12 text-right">{formData.confidence}%</span>
            </div>
            <div className="flex justify-between text-[10px] text-apex-soft mt-1 px-1">
              <span>Cautious</span>
              <span>Pushing</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="apex-label block mb-1">Notes / Handling Feedback</label>
            <textarea
              rows={3}
              placeholder="How did the bike feel? Any issues or observations..."
              className="apex-input resize-none"
              value={formData.notesHandling}
              onChange={(e) => setFormData({ ...formData, notesHandling: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={saving}
            className="apex-btn apex-btn-primary px-8 min-h-[48px] sm:min-h-0 order-1 sm:order-none"
          >
            {saving ? 'Saving...' : 'Save Session'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="apex-btn apex-btn-secondary min-h-[48px] sm:min-h-0 order-2 sm:order-none"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
