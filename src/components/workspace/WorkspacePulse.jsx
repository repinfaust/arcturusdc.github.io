'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import BuildProgressTile from './tiles/BuildProgressTile';
import TestingSnapshotTile from './tiles/TestingSnapshotTile';
import BacklogHealthTile from './tiles/BacklogHealthTile';
import DiscoverySignalsTile from './tiles/DiscoverySignalsTile';
import DocumentationActivityTile from './tiles/DocumentationActivityTile';

export default function WorkspacePulse() {
  const { currentTenant } = useTenant();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState('all');

  useEffect(() => {
    if (!currentTenant?.id) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for dashboard metrics
    const dashboardRef = doc(db, 'tenants', currentTenant.id, 'dashboard', 'metrics');

    const unsubscribe = onSnapshot(
      dashboardRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Convert Firestore Timestamps to Date objects for display
          const processedData = {
            ...data,
            buildProgress: {
              ...data.buildProgress,
              apps: data.buildProgress?.apps?.map(app => ({
                ...app,
                lastActivity: app.lastActivity?.toDate?.() || app.lastActivity,
              })) || [],
            },
            lastUpdated: data.lastUpdated?.toDate?.() || data.lastUpdated,
          };

          setDashboardData(processedData);
        } else {
          // No data yet - show mock data as fallback
          const mockData = {
            buildProgress: {
              apps: [
                {
                  name: 'SyncFit',
                  progress: 62,
                  epicsComplete: 3,
                  epicsTotal: 5,
                  featuresInProgress: 12,
                  featuresTotal: 27,
                  bugsOpen: 4,
                  lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
                },
              ],
            },
            testingSnapshot: {
              pass: 23,
              fail: 5,
              awaitingRetest: 2,
              coverage: 76,
            },
            backlogHealth: {
              ready: 14,
              inDevelopment: 9,
              blocked: 2,
              bugsOpen: 7,
              cycleTime: 2.9,
            },
            discoverySignals: {
              newNotes: 3,
              jtbdDrafts: 2,
              coverage: 64,
            },
            documentationActivity: {
              newDocs: 1,
              updatedThisWeek: 3,
              linkedPercentage: 92,
            },
            lastUpdated: new Date(),
          };
          setDashboardData(mockData);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching dashboard metrics:', error);
        setLoading(false);
        // Still show mock data on error
        const mockData = {
          buildProgress: { apps: [] },
          testingSnapshot: { pass: 0, fail: 0, awaitingRetest: 0, coverage: 0 },
          backlogHealth: { ready: 0, inDevelopment: 0, blocked: 0, bugsOpen: 0, cycleTime: 0 },
          discoverySignals: { newNotes: 0, jtbdDrafts: 0, coverage: 0 },
          documentationActivity: { newDocs: 0, updatedThisWeek: 0, linkedPercentage: 0 },
        };
        setDashboardData(mockData);
      }
    );

    return () => unsubscribe();
  }, [currentTenant?.id]);

  if (!currentTenant) {
    return null;
  }

  // Get list of available apps
  const availableApps = dashboardData?.buildProgress?.apps?.map(app => app.name) || [];
  const hasMultipleApps = availableApps.length > 1;

  // Filter data for selected app
  const getFilteredAppData = () => {
    if (!dashboardData) return null;

    if (selectedApp === 'all') {
      // Aggregate all apps
      const allApps = dashboardData.buildProgress?.apps || [];
      if (allApps.length === 0) return null;

      const totalEpicsComplete = allApps.reduce((sum, app) => sum + (app.epicsComplete || 0), 0);
      const totalEpicsTotal = allApps.reduce((sum, app) => sum + (app.epicsTotal || 0), 0);
      const totalFeaturesInProgress = allApps.reduce((sum, app) => sum + (app.featuresInProgress || 0), 0);
      const totalFeaturesTotal = allApps.reduce((sum, app) => sum + (app.featuresTotal || 0), 0);
      const totalBugsOpen = allApps.reduce((sum, app) => sum + (app.bugsOpen || 0), 0);
      const progress = totalEpicsTotal > 0 ? Math.round((totalEpicsComplete / totalEpicsTotal) * 100) : 0;

      return {
        name: 'All Apps',
        progress,
        epicsComplete: totalEpicsComplete,
        epicsTotal: totalEpicsTotal,
        featuresInProgress: totalFeaturesInProgress,
        featuresTotal: totalFeaturesTotal,
        bugsOpen: totalBugsOpen,
        lastActivity: allApps.reduce((latest, app) => {
          const appActivity = new Date(app.lastActivity || 0);
          return appActivity > latest ? appActivity : latest;
        }, new Date(0)),
      };
    } else {
      // Find specific app
      const app = dashboardData.buildProgress?.apps?.find(a => a.name === selectedApp);
      return app || null;
    }
  };

  const filteredAppData = getFilteredAppData();

  return (
    <div className="mt-12 space-y-8">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Workspace Pulse</h2>
          <p className="text-sm text-neutral-600 mt-1">
            At-a-glance health overview across all modules
          </p>
        </div>
        {dashboardData?.lastUpdated && (
          <span className="text-xs text-neutral-500">
            Updated {formatRelativeTime(dashboardData.lastUpdated)}
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
          {/* Section 1: App-Specific Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                App Progress & Health
              </h3>
              {hasMultipleApps && (
                <div className="flex items-center gap-2">
                  <label htmlFor="app-selector" className="text-sm text-neutral-600">
                    Filter by app:
                  </label>
                  <select
                    id="app-selector"
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                  >
                    <option value="all">All Apps (Summary)</option>
                    {availableApps.map((appName) => (
                      <option key={appName} value={appName}>
                        {appName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <BuildProgressTile
                data={filteredAppData ? { apps: [filteredAppData] } : { apps: [] }}
              />
              <TestingSnapshotTile data={dashboardData?.testingSnapshot} />
              <BacklogHealthTile data={dashboardData?.backlogHealth} />
            </div>
          </div>

          {/* Section 2: Workspace-Wide Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Workspace Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DiscoverySignalsTile data={dashboardData?.discoverySignals} />
              <DocumentationActivityTile data={dashboardData?.documentationActivity} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(date) {
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
