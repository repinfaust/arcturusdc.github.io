'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const ABILITY_LEVELS = [
  { value: 'amateur', label: 'Amateur', description: 'New to track days, learning the basics' },
  { value: 'club', label: 'Club', description: 'Regular track days, developing skills' },
  { value: 'semi_pro', label: 'Semi Pro', description: 'Competitive rider, racing experience' },
  { value: 'pro', label: 'Pro', description: 'Professional racer' },
];

export default function RiderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [riderData, setRiderData] = useState(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalLaps: 0,
    bestLapTime: null,
    avgConfidence: null,
  });

  const [formData, setFormData] = useState({
    displayName: '',
    ability: '',
    weight: '',
    height: '',
    yearsRiding: '',
    homeTrack: '',
    goals: '',
  });

  useEffect(() => {
    const fetchRiderData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch rider profile
        const riderDoc = await getDoc(doc(db, 'apextwin_riders', user.uid));
        if (riderDoc.exists()) {
          const data = riderDoc.data();
          setRiderData(data);
          setFormData({
            displayName: data.displayName || user.displayName || '',
            ability: data.ability || '',
            weight: data.weight?.toString() || '',
            height: data.height?.toString() || '',
            yearsRiding: data.yearsRiding?.toString() || '',
            homeTrack: data.homeTrack || '',
            goals: data.goals || '',
          });
        } else {
          setFormData({
            ...formData,
            displayName: user.displayName || '',
          });
        }

        // Fetch stats from sessions
        const sessionsQuery = query(
          collection(db, 'apextwin_sessions'),
          where('riderId', '==', user.uid),
          orderBy('fastestLapSec', 'asc'),
          limit(100)
        );
        const sessionsSnap = await getDocs(sessionsQuery);

        let totalLaps = 0;
        let bestLap = null;
        let confidenceSum = 0;
        let confidenceCount = 0;

        sessionsSnap.docs.forEach(doc => {
          const session = doc.data();
          if (session.lapsCompleted) totalLaps += session.lapsCompleted;
          if (session.fastestLapSec && (!bestLap || session.fastestLapSec < bestLap)) {
            bestLap = session.fastestLapSec;
          }
          if (session.confidence !== null && session.confidence !== undefined) {
            confidenceSum += session.confidence;
            confidenceCount++;
          }
        });

        setStats({
          totalSessions: sessionsSnap.size,
          totalLaps: totalLaps,
          bestLapTime: bestLap,
          avgConfidence: confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : null,
        });

      } catch (err) {
        console.error('Error fetching rider data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRiderData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);

    try {
      await setDoc(doc(db, 'apextwin_riders', user.uid), {
        displayName: formData.displayName.trim() || null,
        ability: formData.ability || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseInt(formData.height) : null,
        yearsRiding: formData.yearsRiding ? parseInt(formData.yearsRiding) : null,
        homeTrack: formData.homeTrack.trim() || null,
        goals: formData.goals.trim() || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setRiderData({ ...formData });
    } catch (err) {
      console.error('Error saving rider data:', err);
      alert('Failed to save rider profile');
    } finally {
      setSaving(false);
    }
  };

  const formatLapTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  };

  const getAbilityLabel = (value) => {
    return ABILITY_LEVELS.find(a => a.value === value)?.label || '--';
  };

  if (loading) {
    return (
      <div className="apex-panel p-8 text-center text-apex-soft">Loading rider profile...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="apex-h1 mb-1">Rider Profile</h1>
        <p className="text-apex-soft">Your riding stats and personal data</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="apex-panel p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Ability</div>
          <div className="apex-data text-lg text-apex-mint">{getAbilityLabel(formData.ability)}</div>
        </div>
        <div className="apex-panel p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Sessions</div>
          <div className="apex-data text-lg">{stats.totalSessions}</div>
        </div>
        <div className="apex-panel p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Total Laps</div>
          <div className="apex-data text-lg">{stats.totalLaps}</div>
        </div>
        <div className="apex-panel p-4 text-center">
          <div className="apex-label text-[10px] mb-1">Best Lap</div>
          <div className="apex-data text-lg text-apex-mint">{formatLapTime(stats.bestLapTime)}</div>
        </div>
      </div>

      {/* Confidence Indicator */}
      {stats.avgConfidence !== null && (
        <div className="apex-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="apex-label">Average Confidence</span>
            <span className="apex-data text-apex-mint">{stats.avgConfidence}%</span>
          </div>
          <div className="h-2 bg-apex-stealth rounded-full overflow-hidden">
            <div
              className="h-full bg-apex-mint transition-all duration-300"
              style={{ width: `${stats.avgConfidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Profile Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="apex-label block mb-1">Display Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="apex-input"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>

            <div>
              <label className="apex-label block mb-1">Years Riding</label>
              <input
                type="number"
                min="0"
                max="50"
                placeholder="e.g. 5"
                className="apex-input"
                value={formData.yearsRiding}
                onChange={(e) => setFormData({ ...formData, yearsRiding: e.target.value })}
              />
            </div>

            <div>
              <label className="apex-label block mb-1">Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="200"
                step="0.1"
                placeholder="e.g. 75"
                className="apex-input"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            <div>
              <label className="apex-label block mb-1">Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                placeholder="e.g. 180"
                className="apex-input"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="apex-label block mb-1">Home Track</label>
              <input
                type="text"
                placeholder="e.g. Brands Hatch"
                className="apex-input"
                value={formData.homeTrack}
                onChange={(e) => setFormData({ ...formData, homeTrack: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Ability Level */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Ability Level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ABILITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setFormData({ ...formData, ability: level.value })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.ability === level.value
                    ? 'border-apex-mint bg-apex-mint/10'
                    : 'border-apex-stealth hover:border-apex-mint/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.ability === level.value
                      ? 'border-apex-mint bg-apex-mint'
                      : 'border-apex-stealth'
                  }`}>
                    {formData.ability === level.value && (
                      <span className="text-apex-carbon text-[10px]">✓</span>
                    )}
                  </div>
                  <div>
                    <span className="text-apex-white font-medium block">{level.label}</span>
                    <span className="text-apex-soft text-xs">{level.description}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="apex-panel p-4 sm:p-6">
          <h2 className="apex-h2 mb-4 border-b border-apex-stealth pb-2">Goals</h2>
          <textarea
            rows={3}
            placeholder="What are your riding goals this season?"
            className="apex-input resize-none"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="apex-btn apex-btn-primary px-8"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
