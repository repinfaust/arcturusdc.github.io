'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

export default function PaddockPage() {
  const [sessions, setSessions] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Filters
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Sorting
  const [sortBy, setSortBy] = useState('fastestLapSec');
  const [sortOrder, setSortOrder] = useState('asc');

  // Quick filters
  const [filterPsi, setFilterPsi] = useState(null);
  const [filterWithTimes, setFilterWithTimes] = useState(false);
  const [userFrontPsi, setUserFrontPsi] = useState(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const tracksSnap = await getDocs(collection(db, 'apextwin_tracks'));
        setTracks(tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching tracks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const handleSearch = async () => {
    if (!selectedTrack || !selectedDate) {
      alert('Please select both a track and date');
      return;
    }

    setSearching(true);
    setSessions([]);
    setFilterPsi(null);
    setFilterWithTimes(false);

    try {
      // Extend range to ±2 days to catch multi-day events
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - 2);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      dayEnd.setDate(dayEnd.getDate() + 2);

      const paddockQuery = query(
        collection(db, 'apextwin_sessions'),
        where('trackId', '==', selectedTrack),
        where('date', '>=', Timestamp.fromDate(dayStart)),
        where('date', '<=', Timestamp.fromDate(dayEnd)),
        orderBy('date', 'asc')
      );

      const paddockSnap = await getDocs(paddockQuery);
      const paddockSessions = paddockSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => !!session.paddockOptIn);
      setSessions(paddockSessions);

      // Find current user's front PSI for filtering
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userSession = paddockSessions.find(s => s.riderId === currentUser.uid);
        if (userSession?.tirePressureFrontColdPsi) {
          setUserFrontPsi(userSession.tirePressureFrontColdPsi);
        }
      }
    } catch (err) {
      console.error('Error fetching paddock data:', err);
      // Handle index error gracefully
      if (err.code === 'failed-precondition') {
        alert('Database index required. Please contact support.');
      }
    } finally {
      setSearching(false);
    }
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'fastestLapSec' ? 'asc' : 'desc');
    }
  };

  // Apply sorting and filtering
  const getDisplaySessions = () => {
    let result = [...sessions];

    // Apply filters
    if (filterWithTimes) {
      result = result.filter(s => s.fastestLapSec);
    }
    if (filterPsi && userFrontPsi) {
      result = result.filter(s => {
        if (!s.tirePressureFrontColdPsi) return true;
        return Math.abs(s.tirePressureFrontColdPsi - userFrontPsi) <= filterPsi;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle nulls
      if (valA === null || valA === undefined) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = sortOrder === 'asc' ? Infinity : -Infinity;

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

    return result;
  };

  const displaySessions = getDisplaySessions();

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="ml-1 text-apex-stealth">⇅</span>;
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // Calculate stats
  const getStats = () => {
    const withFrontPsi = displaySessions.filter(s => s.tirePressureFrontColdPsi);
    const withRearPsi = displaySessions.filter(s => s.tirePressureRearColdPsi);
    const withTimes = displaySessions.filter(s => s.fastestLapSec);

    return {
      avgFrontPsi: withFrontPsi.length > 0
        ? (withFrontPsi.reduce((sum, s) => sum + s.tirePressureFrontColdPsi, 0) / withFrontPsi.length).toFixed(1)
        : '--',
      avgRearPsi: withRearPsi.length > 0
        ? (withRearPsi.reduce((sum, s) => sum + s.tirePressureRearColdPsi, 0) / withRearPsi.length).toFixed(1)
        : '--',
      fastestLap: withTimes.length > 0
        ? Math.min(...withTimes.map(s => s.fastestLapSec))
        : null,
    };
  };

  const formatLapTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Rider';
    return fullName.split(' ')[0];
  };

  const currentUser = auth.currentUser;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="apex-h1 mb-1">Paddock View</h1>
        <p className="text-apex-soft">See anonymised setups shared by riders at the track</p>
      </div>

      {/* Filters */}
      <div className="apex-panel p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="apex-label block mb-1">Track</label>
            <select
              className="apex-input"
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
            >
              <option value="">Select track...</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name} {track.country && `(${track.country})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="apex-label block mb-1">Date</label>
            <input
              type="date"
              className="apex-input w-44"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !selectedTrack || !selectedDate}
            className="apex-btn apex-btn-primary"
          >
            {searching ? 'Searching...' : 'Search Paddock'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searching ? (
        <div className="apex-panel p-8 text-center text-apex-soft">
          Searching paddock...
        </div>
      ) : sessions.length === 0 && selectedTrack ? (
        <div className="apex-panel p-8 text-center">
          <p className="text-apex-soft mb-2">No sessions found for this track and date</p>
          <p className="text-apex-soft/60 text-sm">Be the first to log a session!</p>
        </div>
      ) : sessions.length > 0 ? (
        <div className="apex-panel overflow-hidden">
          <div className="p-4 border-b border-apex-stealth">
            <h2 className="apex-h2">
              {tracks.find(t => t.id === selectedTrack)?.name || 'Track'}
            </h2>
            <p className="text-apex-soft text-sm">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} on {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-apex-stealth">
                <tr className="text-left">
                  <th className="apex-label px-4 py-3">Rider</th>
                  <th className="apex-label px-4 py-3">Bike</th>
                  <th className="apex-label px-4 py-3">Front Tyre</th>
                  <th className="apex-label px-4 py-3">Rear Tyre</th>
                  <th className="apex-label px-4 py-3 text-right">F/R Cold PSI</th>
                  <th className="apex-label px-4 py-3 text-right">Fastest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-stealth">
                {sessions.map((session) => {
                  const isOwn = session.riderId === currentUser?.uid;
                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-apex-graphite/30 transition-colors ${isOwn ? 'bg-apex-mint/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-apex-white">
                          {getFirstName(session.riderName)}
                          {isOwn && <span className="text-apex-mint text-xs ml-2">(you)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-apex-soft">
                        {session.bikeName || '--'}
                      </td>
                      <td className="px-4 py-3 text-apex-soft">
                        {session.tireBrandFront || '--'}
                        {session.tireCompoundFront && <span className="text-apex-white ml-1">{session.tireCompoundFront}</span>}
                      </td>
                      <td className="px-4 py-3 text-apex-soft">
                        {session.tireBrandRear || '--'}
                        {session.tireCompoundRear && <span className="text-apex-white ml-1">{session.tireCompoundRear}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="apex-data">
                          {session.tirePressureFrontColdPsi || '--'} / {session.tirePressureRearColdPsi || '--'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="apex-data text-apex-mint">
                          {formatLapTime(session.fastestLapSec)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-apex-stealth">
            {sessions.map((session) => {
              const isOwn = session.riderId === currentUser?.uid;
              return (
                <div
                  key={session.id}
                  className={`p-4 ${isOwn ? 'bg-apex-mint/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-apex-white font-medium">
                      {getFirstName(session.riderName)}
                      {isOwn && <span className="text-apex-mint text-xs ml-2">(you)</span>}
                    </span>
                    <span className="apex-data text-apex-mint">{formatLapTime(session.fastestLapSec)}</span>
                  </div>
                  <div className="text-apex-soft text-sm mb-2">{session.bikeName || '--'}</div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="apex-label text-[10px] block">Tyres</span>
                      <span className="text-apex-soft">
                        {session.tireBrandFront || '--'} / {session.tireBrandRear || '--'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="apex-label text-[10px] block">Cold PSI</span>
                      <span className="apex-data">
                        {session.tirePressureFrontColdPsi || '--'} / {session.tirePressureRearColdPsi || '--'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="apex-panel p-8 text-center">
          <div className="text-apex-mint text-5xl mb-4">⬡</div>
          <p className="text-apex-soft">Select a track and date to see what others are running</p>
        </div>
      )}

      {/* Info */}
      <div className="apex-panel p-4">
        <div className="flex items-start gap-3">
          <span className="text-apex-mint">ℹ</span>
          <div className="text-apex-soft text-sm">
            <p className="mb-1">
              <strong className="text-apex-white">Privacy note:</strong> Shared sessions are opt-in per event.
            </p>
            <p>
              Only first names and basic setup data are shown. Notes and contact info stay private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
