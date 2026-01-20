'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc, collection, query, where, orderBy, getDocs, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { isFieldVisible, EXPERIENCE_LEVELS } from '@/config/skillModes';

export default function NewEventSessionPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [userBikes, setUserBikes] = useState({});
  const [previousSessions, setPreviousSessions] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('novice');
  const [lapTimerActive, setLapTimerActive] = useState(false);

  const [formData, setFormData] = useState({
    sessionDate: '',
    sessionTime: '',
    bikeId: '',
    sessionNumber: '',
    // Gearing
    frontSprocket: '',
    rearSprocket: '',
    chainLength: '',
    tireSizeFront: '',
    tireBrandFront: '',
    tireCompoundFront: '',
    tirePressureFrontColdPsi: '',
    tirePressureFrontHotPsi: '',
    tireSizeRear: '',
    tireBrandRear: '',
    tireCompoundRear: '',
    tirePressureRearColdPsi: '',
    tirePressureRearHotPsi: '',
    tireSetAgeSessions: '',
    forkCompClicksOut: '',
    forkRebClicksOut: '',
    shockCompClicksOut: '',
    shockRebClicksOut: '',
    tractionControlLevel: '',
    engineMap: '',
    lapsCompleted: '',
    fastestLapMin: '',
    fastestLapSec: '',
    notesHandling: '',
    weather: '',
    weatherSource: 'auto',
    confidence: 50,
  });

  // Helper to check if a field group should be shown
  const showField = (fieldId) => {
    if (fieldId === 'lapTimes' && !lapTimerActive) return false;
    return isFieldVisible(experienceLevel, fieldId);
  };

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

        // Set default session date to event start date
        if (eventData.startDate) {
          const startDate = eventData.startDate.toDate ? eventData.startDate.toDate() : new Date(eventData.startDate);
          setFormData(prev => ({ ...prev, sessionDate: startDate.toISOString().split('T')[0] }));
        }

        // Fetch previous sessions for this event
        const sessionsQuery = query(
          collection(db, 'apextwin_sessions'),
          where('eventId', '==', eventId),
          orderBy('createdAt', 'desc')
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPreviousSessions(sessions);

        // Auto-set session number
        if (sessions.length > 0) {
          const maxSessionNum = Math.max(...sessions.map(s => s.sessionNumber || 0));
          setFormData(prev => ({ ...prev, sessionNumber: (maxSessionNum + 1).toString() }));
        } else {
          setFormData(prev => ({ ...prev, sessionNumber: '1' }));
        }

        // Fetch weather if we have coordinates
        if (eventData.trackLat && eventData.trackLng) {
          fetchWeather(eventData.trackLat, eventData.trackLng, eventData.startDate, eventData.endDate);
        }

        // Fetch user's bikes with default settings
        const bikesQuery = query(collection(db, 'apextwin_riders', user.uid, 'bikes'));
        const bikesSnap = await getDocs(bikesQuery);
        const bikesMap = {};
        bikesSnap.docs.forEach(d => {
          bikesMap[d.id] = { id: d.id, ...d.data() };
        });
        setUserBikes(bikesMap);

        // Fetch rider's experience level
        const riderDoc = await getDoc(doc(db, 'apextwin_riders', user.uid));
        if (riderDoc.exists()) {
          const riderData = riderDoc.data();
          setExperienceLevel(riderData.experienceLevel || 'novice');
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
  }, [eventId, router]);

  // Fetch weather from Open-Meteo API (free, no API key required)
  const fetchWeather = async (lat, lng, startDate, endDate) => {
    setLoadingWeather(true);
    try {
      const start = startDate?.toDate ? startDate.toDate() : new Date(startDate);
      const end = endDate?.toDate ? endDate.toDate() : (endDate ? new Date(endDate) : start);

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      // Use Open-Meteo free weather API
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&start_date=${startStr}&end_date=${endStr}&timezone=auto`
      );

      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Copy settings from a previous session (excluding time/date/outcome)
  const copyFromSession = (session) => {
    setFormData(prev => ({
      ...prev,
      bikeId: session.bikeId || prev.bikeId,
      // Gearing
      frontSprocket: session.frontSprocket?.toString() || '',
      rearSprocket: session.rearSprocket?.toString() || '',
      chainLength: session.chainLength?.toString() || '',
      // Tyres
      tireSizeFront: session.tireSizeFront || '',
      tireBrandFront: session.tireBrandFront || '',
      tireCompoundFront: session.tireCompoundFront || '',
      tirePressureFrontColdPsi: session.tirePressureFrontColdPsi?.toString() || '',
      tirePressureFrontHotPsi: session.tirePressureFrontHotPsi?.toString() || '',
      tireSizeRear: session.tireSizeRear || '',
      tireBrandRear: session.tireBrandRear || '',
      tireCompoundRear: session.tireCompoundRear || '',
      tirePressureRearColdPsi: session.tirePressureRearColdPsi?.toString() || '',
      tirePressureRearHotPsi: session.tirePressureRearHotPsi?.toString() || '',
      tireSetAgeSessions: session.tireSetAgeSessions ? (session.tireSetAgeSessions + 1).toString() : '',
      // Suspension
      forkCompClicksOut: session.forkCompClicksOut?.toString() || '',
      forkRebClicksOut: session.forkRebClicksOut?.toString() || '',
      shockCompClicksOut: session.shockCompClicksOut?.toString() || '',
      shockRebClicksOut: session.shockRebClicksOut?.toString() || '',
      // Electronics
      tractionControlLevel: session.tractionControlLevel || '',
      engineMap: session.engineMap || '',
    }));
  };

  // Apply default settings from a bike
  const applyBikeDefaults = (bikeId) => {
    const bike = userBikes[bikeId];
    if (!bike?.defaultSettings) return;

    const d = bike.defaultSettings;
    setFormData(prev => ({
      ...prev,
      // Gearing
      frontSprocket: d.frontSprocket?.toString() || prev.frontSprocket,
      rearSprocket: d.rearSprocket?.toString() || prev.rearSprocket,
      chainLength: d.chainLength?.toString() || prev.chainLength,
      // Tyres (use bike's default tyre sizes if available)
      tireSizeFront: bike.tyreSizeFront || prev.tireSizeFront,
      tireBrandFront: d.tireBrandFront || prev.tireBrandFront,
      tireCompoundFront: d.tireCompoundFront || prev.tireCompoundFront,
      tirePressureFrontColdPsi: d.tirePressureFrontColdPsi?.toString() || prev.tirePressureFrontColdPsi,
      tireSizeRear: bike.tyreSizeRear || prev.tireSizeRear,
      tireBrandRear: d.tireBrandRear || prev.tireBrandRear,
      tireCompoundRear: d.tireCompoundRear || prev.tireCompoundRear,
      tirePressureRearColdPsi: d.tirePressureRearColdPsi?.toString() || prev.tirePressureRearColdPsi,
      // Suspension
      forkCompClicksOut: d.forkCompClicksOut?.toString() || prev.forkCompClicksOut,
      forkRebClicksOut: d.forkRebClicksOut?.toString() || prev.forkRebClicksOut,
      shockCompClicksOut: d.shockCompClicksOut?.toString() || prev.shockCompClicksOut,
      shockRebClicksOut: d.shockRebClicksOut?.toString() || prev.shockRebClicksOut,
      // Electronics
      tractionControlLevel: d.tractionControlLevel || prev.tractionControlLevel,
      engineMap: d.engineMap || prev.engineMap,
    }));
  };

  // Check if a bike has default settings
  const bikeHasDefaults = (bikeId) => {
    const bike = userBikes[bikeId];
    if (!bike?.defaultSettings) return false;
    return Object.values(bike.defaultSettings).some(v => v !== null && v !== undefined && v !== '');
  };

  // Get weather description from code
  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog',
      51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
      61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
      71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
      80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
      95: 'Thunderstorm',
    };
    return weatherCodes[code] || 'Unknown';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !event) return;

    if (!formData.bikeId) {
      alert('Please select a bike');
      return;
    }

    setSaving(true);

    try {
      const selectedBike = event.bikes?.find(b => b.id === formData.bikeId);

      let fastestLapSec = null;
      if (lapTimerActive && (formData.fastestLapMin || formData.fastestLapSec)) {
        const mins = parseFloat(formData.fastestLapMin) || 0;
        const secs = parseFloat(formData.fastestLapSec) || 0;
        fastestLapSec = mins * 60 + secs;
      }

      const sessionData = {
        riderId: user.uid,
        riderName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        eventId: eventId,
        bikeId: formData.bikeId,
        bikeName: selectedBike?.name || 'Unknown',
        trackId: event.trackId,
        trackName: event.trackName,
        date: formData.sessionDate ? Timestamp.fromDate(new Date(formData.sessionDate)) : event.startDate,
        sessionTime: formData.sessionTime || null,
        sessionNumber: formData.sessionNumber ? parseInt(formData.sessionNumber) : null,
        // Gearing
        frontSprocket: formData.frontSprocket ? parseInt(formData.frontSprocket) : null,
        rearSprocket: formData.rearSprocket ? parseInt(formData.rearSprocket) : null,
        chainLength: formData.chainLength ? parseInt(formData.chainLength) : null,
        // Tyres
        tireSizeFront: formData.tireSizeFront.trim() || null,
        tireBrandFront: formData.tireBrandFront.trim() || null,
        tireCompoundFront: formData.tireCompoundFront.trim() || null,
        tirePressureFrontColdPsi: formData.tirePressureFrontColdPsi ? parseFloat(formData.tirePressureFrontColdPsi) : null,
        tirePressureFrontHotPsi: formData.tirePressureFrontHotPsi ? parseFloat(formData.tirePressureFrontHotPsi) : null,
        tireSizeRear: formData.tireSizeRear.trim() || null,
        tireBrandRear: formData.tireBrandRear.trim() || null,
        tireCompoundRear: formData.tireCompoundRear.trim() || null,
        tirePressureRearColdPsi: formData.tirePressureRearColdPsi ? parseFloat(formData.tirePressureRearColdPsi) : null,
        tirePressureRearHotPsi: formData.tirePressureRearHotPsi ? parseFloat(formData.tirePressureRearHotPsi) : null,
        tireSetAgeSessions: formData.tireSetAgeSessions ? parseInt(formData.tireSetAgeSessions) : null,
        forkCompClicksOut: formData.forkCompClicksOut ? parseInt(formData.forkCompClicksOut) : null,
        forkRebClicksOut: formData.forkRebClicksOut ? parseInt(formData.forkRebClicksOut) : null,
        shockCompClicksOut: formData.shockCompClicksOut ? parseInt(formData.shockCompClicksOut) : null,
        shockRebClicksOut: formData.shockRebClicksOut ? parseInt(formData.shockRebClicksOut) : null,
        tractionControlLevel: formData.tractionControlLevel.trim() || null,
        engineMap: formData.engineMap.trim() || null,
        lapsCompleted: lapTimerActive && formData.lapsCompleted ? parseInt(formData.lapsCompleted) : null,
        fastestLapSec: fastestLapSec,
        notesHandling: formData.notesHandling.trim() || null,
        weather: formData.weather || null,
        weatherSource: formData.weatherSource || 'auto',
        confidence: formData.confidence,
        paddockOptIn: !!event?.paddockOptIn,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'apextwin_sessions'), sessionData);

      // Update event session count
      await updateDoc(doc(db, 'apextwin_events', eventId), {
        sessionCount: increment(1),
      });

      router.push(`/apps/stea/apextwin-poc/events/${eventId}`);
    } catch (err) {
      console.error('Error saving session:', err);
      alert('Failed to save session');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="apex-panel p-8 text-center text-apex-soft">Loading...</div>;
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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <Link href={`/apps/stea/apextwin-poc/events/${eventId}`} className="text-apex-soft hover:text-apex-white">
            ← {event.trackName}
          </Link>
          <span className="text-[10px] px-2 py-1 bg-apex-stealth rounded text-apex-soft">
            {EXPERIENCE_LEVELS[experienceLevel]?.icon} {EXPERIENCE_LEVELS[experienceLevel]?.label} Mode
          </span>
        </div>
        <h1 className="apex-h1 mb-1">Log Session</h1>
        <p className="text-apex-soft text-sm">{event.trackName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Copy Previous Session */}
        {previousSessions.length > 0 && (
          <div className="apex-panel p-4 sm:p-6 border-apex-mint/30">
            <h2 className="apex-h2 mb-3 text-apex-mint">Quick Start</h2>
            <p className="text-apex-soft text-sm mb-3">Copy settings from a previous session (excludes time, date, and outcome)</p>
            <div className="flex flex-wrap gap-2">
              {previousSessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => copyFromSession(session)}
                  className="px-3 py-2 bg-apex-stealth hover:bg-apex-mint/20 text-apex-white text-sm rounded-lg transition-colors"
                >
                  Session {session.sessionNumber || '?'} {session.sessionTime && `@ ${session.sessionTime}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weather Forecast */}
        {weatherData?.daily && (
          <div className="apex-panel p-4 sm:p-6">
            <h2 className="apex-h2 mb-3">Weather Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {weatherData.daily.time.map((date, idx) => (
                <div
                  key={date}
                  className={`p-3 rounded-lg text-center ${
                    formData.sessionDate === date
                      ? 'bg-apex-mint/20 border border-apex-mint'
                      : 'bg-apex-stealth'
                  }`}
                >
                  <div className="text-apex-soft text-xs mb-1">
                    {new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-apex-white text-sm font-medium mb-1">
                    {getWeatherDescription(weatherData.daily.weathercode[idx])}
                  </div>
                  <div className="text-apex-soft text-xs">
                    {Math.round(weatherData.daily.temperature_2m_min[idx])}° - {Math.round(weatherData.daily.temperature_2m_max[idx])}°C
                  </div>
                  {weatherData.daily.precipitation_probability_max[idx] > 20 && (
                    <div className="text-apex-heat text-xs mt-1">
                      {weatherData.daily.precipitation_probability_max[idx]}% rain
                    </div>
                  )}
                </div>
              ))}
            </div>
            {loadingWeather && (
              <p className="text-apex-soft text-sm mt-2">Loading weather...</p>
            )}
          </div>
        )}

        {/* Session Basics */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Session Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="apex-label block mb-1">Session Date</label>
              <input
                type="date"
                className="apex-input"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
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
              <label className="apex-label block mb-1">
                Weather
                <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded ${
                  formData.weatherSource === 'auto' ? 'bg-apex-mint/20 text-apex-mint' : 'bg-apex-stealth text-apex-soft'
                }`}>
                  {formData.weatherSource === 'auto' ? 'Auto' : 'Manual'}
                </span>
              </label>
              <select
                className="apex-input"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value, weatherSource: 'manual' })}
              >
                <option value="">Select...</option>
                <option value="sunny">Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="wet">Wet</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          {/* Bike Selection */}
          <div className="mt-4">
            <label className="apex-label block mb-2">Bike *</label>
            {event.bikes && event.bikes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.bikes.map(bike => (
                  <div key={bike.id} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, bikeId: bike.id })}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        formData.bikeId === bike.id
                          ? 'border-apex-mint bg-apex-mint/10'
                          : 'border-apex-stealth hover:border-apex-mint/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.bikeId === bike.id
                            ? 'border-apex-mint bg-apex-mint'
                            : 'border-apex-stealth'
                        }`}>
                          {formData.bikeId === bike.id && (
                            <span className="text-apex-carbon text-[10px]">✓</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-apex-white font-medium">{bike.name}</span>
                          {bikeHasDefaults(bike.id) && (
                            <span className="ml-2 text-[10px] bg-apex-mint/20 text-apex-mint px-1.5 py-0.5 rounded">HAS DEFAULTS</span>
                          )}
                        </div>
                      </div>
                    </button>
                    {formData.bikeId === bike.id && bikeHasDefaults(bike.id) && (
                      <button
                        type="button"
                        onClick={() => applyBikeDefaults(bike.id)}
                        className="w-full px-3 py-2 bg-apex-mint/10 hover:bg-apex-mint/20 text-apex-mint text-sm rounded-lg border border-apex-mint/30 transition-colors"
                      >
                        Use Default Settings from Garage
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-apex-heat text-sm">No bikes on this event</p>
            )}
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
                {showField('tyreSizes') && (
                  <div className="col-span-2">
                    <label className="apex-label block mb-1">Size</label>
                    <input type="text" placeholder="e.g. 120/70-17" className="apex-input"
                      value={formData.tireSizeFront}
                      onChange={(e) => setFormData({ ...formData, tireSizeFront: e.target.value })}
                    />
                  </div>
                )}
                {showField('tyreCompounds') && (
                  <>
                    <div>
                      <label className="apex-label block mb-1">Brand</label>
                      <input type="text" placeholder="e.g. Pirelli" className="apex-input"
                        value={formData.tireBrandFront}
                        onChange={(e) => setFormData({ ...formData, tireBrandFront: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="apex-label block mb-1">Compound</label>
                      <input type="text" placeholder="e.g. SC1" className="apex-input"
                        value={formData.tireCompoundFront}
                        onChange={(e) => setFormData({ ...formData, tireCompoundFront: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="apex-label block mb-1">Cold PSI</label>
                  <input type="number" step="0.1" placeholder="32.0" className="apex-input font-mono"
                    value={formData.tirePressureFrontColdPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureFrontColdPsi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Hot PSI</label>
                  <input type="number" step="0.1" placeholder="35.0" className="apex-input font-mono"
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
                {showField('tyreSizes') && (
                  <div className="col-span-2">
                    <label className="apex-label block mb-1">Size</label>
                    <input type="text" placeholder="e.g. 180/55-17" className="apex-input"
                      value={formData.tireSizeRear}
                      onChange={(e) => setFormData({ ...formData, tireSizeRear: e.target.value })}
                    />
                  </div>
                )}
                {showField('tyreCompounds') && (
                  <>
                    <div>
                      <label className="apex-label block mb-1">Brand</label>
                      <input type="text" placeholder="e.g. Pirelli" className="apex-input"
                        value={formData.tireBrandRear}
                        onChange={(e) => setFormData({ ...formData, tireBrandRear: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="apex-label block mb-1">Compound</label>
                      <input type="text" placeholder="e.g. SC0" className="apex-input"
                        value={formData.tireCompoundRear}
                        onChange={(e) => setFormData({ ...formData, tireCompoundRear: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="apex-label block mb-1">Cold PSI</label>
                  <input type="number" step="0.1" placeholder="29.0" className="apex-input font-mono"
                    value={formData.tirePressureRearColdPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureRearColdPsi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apex-label block mb-1">Hot PSI</label>
                  <input type="number" step="0.1" placeholder="31.0" className="apex-input font-mono"
                    value={formData.tirePressureRearHotPsi}
                    onChange={(e) => setFormData({ ...formData, tirePressureRearHotPsi: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="apex-label block mb-1">Tyre Set Age (sessions)</label>
            <input type="number" min="0" placeholder="0" className="apex-input w-32"
              value={formData.tireSetAgeSessions}
              onChange={(e) => setFormData({ ...formData, tireSetAgeSessions: e.target.value })}
            />
          </div>
        </div>

        {/* Gearing - intermediate+ */}
        {showField('gearing') && (
          <div className="apex-panel p-4 sm:p-6">
            <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Gearing</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="apex-label block mb-1">Front Sprocket</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="20"
                    placeholder="15"
                    className="apex-input font-mono"
                    value={formData.frontSprocket}
                    onChange={(e) => setFormData({ ...formData, frontSprocket: e.target.value })}
                  />
                  <span className="text-apex-soft text-sm">T</span>
                </div>
              </div>
              <div>
                <label className="apex-label block mb-1">Rear Sprocket</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30"
                    max="60"
                    placeholder="45"
                    className="apex-input font-mono"
                    value={formData.rearSprocket}
                    onChange={(e) => setFormData({ ...formData, rearSprocket: e.target.value })}
                  />
                  <span className="text-apex-soft text-sm">T</span>
                </div>
              </div>
              {showField('chainLength') && (
                <div>
                  <label className="apex-label block mb-1">Chain Links</label>
                  <input
                    type="number"
                    min="100"
                    max="140"
                    placeholder="118"
                    className="apex-input font-mono"
                    value={formData.chainLength}
                    onChange={(e) => setFormData({ ...formData, chainLength: e.target.value })}
                  />
                </div>
              )}
            </div>
            {formData.frontSprocket && formData.rearSprocket && (
              <div className="mt-3 text-apex-soft text-sm">
                Ratio: <span className="text-apex-mint font-mono">{(parseInt(formData.rearSprocket) / parseInt(formData.frontSprocket)).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Suspension & Electronics - intermediate+ */}
        {(showField('suspensionBasic') || showField('electronics')) && (
          <div className="apex-panel p-4 sm:p-6">
            <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Suspension & Electronics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {showField('suspensionBasic') && (
                <>
                  <div>
                    <label className="apex-label block mb-1">Fork Reb</label>
                    <input type="number" min="0" className="apex-input font-mono"
                      value={formData.forkRebClicksOut}
                      onChange={(e) => setFormData({ ...formData, forkRebClicksOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="apex-label block mb-1">Shock Reb</label>
                    <input type="number" min="0" className="apex-input font-mono"
                      value={formData.shockRebClicksOut}
                      onChange={(e) => setFormData({ ...formData, shockRebClicksOut: e.target.value })}
                    />
                  </div>
                </>
              )}
              {showField('suspensionAdvanced') && (
                <>
                  <div>
                    <label className="apex-label block mb-1">Fork Comp</label>
                    <input type="number" min="0" className="apex-input font-mono"
                      value={formData.forkCompClicksOut}
                      onChange={(e) => setFormData({ ...formData, forkCompClicksOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="apex-label block mb-1">Shock Comp</label>
                    <input type="number" min="0" className="apex-input font-mono"
                      value={formData.shockCompClicksOut}
                      onChange={(e) => setFormData({ ...formData, shockCompClicksOut: e.target.value })}
                    />
                  </div>
                </>
              )}
              {showField('electronics') && (
                <>
                  <div>
                    <label className="apex-label block mb-1">TC Level</label>
                    <input type="text" placeholder="e.g. 3" className="apex-input font-mono"
                      value={formData.tractionControlLevel}
                      onChange={(e) => setFormData({ ...formData, tractionControlLevel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="apex-label block mb-1">Engine Map</label>
                    <input type="text" placeholder="e.g. A" className="apex-input font-mono"
                      value={formData.engineMap}
                      onChange={(e) => setFormData({ ...formData, engineMap: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Outcome */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Outcome</h2>
          {lapTimerActive ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="apex-label block mb-1">Laps Completed</label>
                <input type="number" min="0" className="apex-input font-mono"
                  value={formData.lapsCompleted}
                  onChange={(e) => setFormData({ ...formData, lapsCompleted: e.target.value })}
                />
              </div>
              <div>
                <label className="apex-label block mb-1">Fastest Lap (mm:ss.xx)</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" placeholder="1" className="apex-input w-16 font-mono text-center"
                    value={formData.fastestLapMin}
                    onChange={(e) => setFormData({ ...formData, fastestLapMin: e.target.value })}
                  />
                  <span className="text-apex-white text-xl">:</span>
                  <input type="number" min="0" max="59.99" step="0.01" placeholder="45.00" className="apex-input w-24 font-mono text-center"
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
            <label className="apex-label block mb-2">
              Confidence Level
              <span className="text-apex-soft text-[10px] ml-2 font-normal">Helps your insights later</span>
            </label>
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
            <label className="apex-label block mb-1">Notes / Handling</label>
            <textarea rows={3} placeholder="How did the bike feel?" className="apex-input resize-none"
              value={formData.notesHandling}
              onChange={(e) => setFormData({ ...formData, notesHandling: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button type="submit" disabled={saving} className="apex-btn apex-btn-primary px-8 min-h-[48px] sm:min-h-0">
            {saving ? 'Saving...' : 'Save Session'}
          </button>
          <Link href={`/apps/stea/apextwin-poc/events/${eventId}`} className="apex-btn apex-btn-secondary text-center min-h-[48px] sm:min-h-0">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
