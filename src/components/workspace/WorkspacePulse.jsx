'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import BuildProgressTile from './tiles/BuildProgressTile';
import TestingSnapshotTile from './tiles/TestingSnapshotTile';
import BacklogHealthTile from './tiles/BacklogHealthTile';
import DiscoverySignalsTile from './tiles/DiscoverySignalsTile';
import DocumentationActivityTile from './tiles/DocumentationActivityTile';

export default function WorkspacePulse() {
  const { currentTenant } = useTenant();
  const [epics, setEpics] = useState(null);
  const [features, setFeatures] = useState(null);
  const [cards, setCards] = useState(null);
  const [docs, setDocs] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    if (!currentTenant?.id) return;
    const tid = currentTenant.id;

    const unsubEpics = onSnapshot(
      query(collection(db, 'stea_epics'), where('tenantId', '==', tid)),
      (snap) => {
        setEpics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLastRefresh(new Date());
      },
      () => setEpics([])
    );

    const unsubFeatures = onSnapshot(
      query(collection(db, 'stea_features'), where('tenantId', '==', tid)),
      (snap) => setFeatures(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setFeatures([])
    );

    const unsubCards = onSnapshot(
      query(collection(db, 'stea_cards'), where('tenantId', '==', tid)),
      (snap) => setCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setCards([])
    );

    const unsubDocs = onSnapshot(
      query(collection(db, 'stea_docs'), where('tenantId', '==', tid)),
      (snap) => setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setDocs([])
    );

    return () => { unsubEpics(); unsubFeatures(); unsubCards(); unsubDocs(); };
  }, [currentTenant?.id]);

  if (!currentTenant) return null;

  const loading = epics === null || features === null || cards === null;

  // ── Derived metrics ──────────────────────────────────────────────────────

  // Most recent createdAt across all items — used as "last activity"
  const mostRecentActivity = (() => {
    if (!epics && !features && !cards) return null;
    const all = [...(epics || []), ...(features || []), ...(cards || [])];
    const ts = all
      .map(i => i.createdAt?.toDate?.() || (i.createdAt ? new Date(i.createdAt) : null))
      .filter(Boolean);
    return ts.length > 0 ? new Date(Math.max(...ts)) : null;
  })();

  // Build Progress
  const buildProgress = (() => {
    const e = epics || [];
    const f = features || [];
    const epicsTotal = e.length;
    const epicsComplete = e.filter(i => i.statusColumn === 'Done').length;
    const featuresTotal = f.length;
    const featuresInProgress = f.filter(i => i.statusColumn === 'Build').length;
    const progress = epicsTotal > 0 ? Math.round((epicsComplete / epicsTotal) * 100) : 0;
    return {
      apps: [{
        name: currentTenant.name || 'All Apps',
        progress,
        epicsComplete,
        epicsTotal,
        featuresInProgress,
        featuresTotal,
        bugsOpen: 0,
        lastActivity: mostRecentActivity,
      }],
    };
  })();

  // Testing Snapshot — test cards = those with [TEST] or [GATE] prefix
  const testingSnapshot = (() => {
    const c = cards || [];
    const testCards = c.filter(i => /^\[(TEST|GATE)\]/i.test(i.title || ''));
    const pass = testCards.filter(i => i.statusColumn === 'Done').length;
    const fail = testCards.filter(i => i.statusColumn === "Won't Do").length;
    const pending = testCards.filter(i => i.statusColumn !== 'Done' && i.statusColumn !== "Won't Do").length;
    const totalTests = testCards.length;
    const passRate = totalTests > 0 ? Math.round((pass / totalTests) * 100) : 0;
    // Coverage = % of features that have at least one test card
    const featureIds = [...new Set(testCards.map(c => c.featureId).filter(Boolean))];
    const featuresTotal = (features || []).length;
    const coverage = featuresTotal > 0 ? Math.round((featureIds.length / featuresTotal) * 100) : 0;
    return { pass, fail, awaitingRetest: pending, coverage, passRate, totalTests };
  })();

  // Backlog Health — map Filo columns to backlog states
  const backlogHealth = (() => {
    const c = cards || [];
    const ready = c.filter(i => i.statusColumn === 'Planning').length;
    const inDevelopment = c.filter(i => i.statusColumn === 'Build').length;
    const blocked = c.filter(i => i.blocked === true).length;
    return { ready, inDevelopment, blocked, bugsOpen: 0, cycleTime: 0 };
  })();

  // Discovery Signals — if no Harls data, derive from card user stories
  const discoverySignals = (() => {
    const c = cards || [];
    const withStory = c.filter(i => i.userStory && i.userStory.trim().length > 0).length;
    const total = c.length;
    const coverage = total > 0 ? Math.round((withStory / total) * 100) : 0;
    return { newNotes: 0, jtbdDrafts: 0, coverage };
  })();

  // Documentation Activity
  const documentationActivity = (() => {
    const d = docs || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newDocs = d.filter(i => {
      const t = i.createdAt?.toDate?.() || (i.createdAt ? new Date(i.createdAt) : null);
      return t && t >= sevenDaysAgo;
    }).length;
    const updatedThisWeek = d.filter(i => {
      const t = i.updatedAt?.toDate?.() || (i.updatedAt ? new Date(i.updatedAt) : null);
      return t && t >= sevenDaysAgo;
    }).length;
    const linked = d.filter(i => i.cardId || i.linkedCards?.length > 0).length;
    const linkedPercentage = d.length > 0 ? Math.round((linked / d.length) * 100) : 0;
    return { newDocs, updatedThisWeek, linkedPercentage };
  })();

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Workspace Pulse</h2>
          <p className="text-sm text-neutral-600 mt-1">
            At-a-glance health overview across all modules
          </p>
        </div>
        {lastRefresh && (
          <span className="text-xs text-neutral-500">
            Updated {formatRelativeTime(lastRefresh)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">App Progress & Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <BuildProgressTile data={buildProgress} />
              <TestingSnapshotTile data={testingSnapshot} />
              <BacklogHealthTile data={backlogHealth} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Workspace Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DiscoverySignalsTile data={discoverySignals} />
              <DocumentationActivityTile data={documentationActivity} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(date) {
  if (!date) return '—';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
