'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const DEFAULT_APPS = ['Adhd Acclaim', 'Mandrake', 'SyncFit', 'Tou.Me'];

/**
 * Admin component for managing which apps belong to a tenant
 *
 * This allows non-developers to configure which apps should be tracked
 * in the Workspace Pulse dashboard without touching code or Firestore directly.
 *
 * Usage: Add this to /apps/stea/admin/page.js
 */
export default function TenantAppsManager() {
  const { currentTenant, isSuperAdmin } = useTenant();
  const [selectedApps, setSelectedApps] = useState([]);
  const [availableApps, setAvailableApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Discover all apps from workspace data
  useEffect(() => {
    async function discoverApps() {
      if (!currentTenant?.id) {
        setLoading(false);
        return;
      }

      try {
        const discovered = new Set(DEFAULT_APPS);

        // Query cards for app names
        const cardsQuery = query(
          collection(db, 'stea_cards'),
          where('tenantId', '==', currentTenant.id)
        );
        const cardsSnapshot = await getDocs(cardsQuery);
        cardsSnapshot.docs.forEach(doc => {
          const app = doc.data().app;
          if (app) discovered.add(app);
        });

        // Query epics for app names
        const epicsQuery = query(
          collection(db, 'stea_epics'),
          where('tenantId', '==', currentTenant.id)
        );
        const epicsSnapshot = await getDocs(epicsQuery);
        epicsSnapshot.docs.forEach(doc => {
          const app = doc.data().app;
          if (app) discovered.add(app);
        });

        // Query features for app names
        const featuresQuery = query(
          collection(db, 'stea_features'),
          where('tenantId', '==', currentTenant.id)
        );
        const featuresSnapshot = await getDocs(featuresQuery);
        featuresSnapshot.docs.forEach(doc => {
          const app = doc.data().app;
          if (app) discovered.add(app);
        });

        // Sort alphabetically
        const sortedApps = Array.from(discovered).sort();
        setAvailableApps(sortedApps);

        // Load currently selected apps from tenant doc
        const tenantRef = doc(db, 'tenants', currentTenant.id);
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setSelectedApps(data.apps || []);
        }
      } catch (error) {
        console.error('Error discovering apps:', error);
        setMessage({ type: 'error', text: 'Failed to load apps' });
      } finally {
        setLoading(false);
      }
    }

    discoverApps();
  }, [currentTenant?.id]);

  const handleToggleApp = (appName) => {
    setSelectedApps(prev => {
      if (prev.includes(appName)) {
        return prev.filter(name => name !== appName);
      } else {
        return [...prev, appName];
      }
    });
    setMessage({ type: '', text: '' }); // Clear message when making changes
  };

  const handleSelectAll = () => {
    setSelectedApps([...availableApps]);
    setMessage({ type: 'success', text: 'Selected all apps' });
  };

  const handleDeselectAll = () => {
    setSelectedApps([]);
    setMessage({ type: 'success', text: 'Deselected all apps' });
  };

  const handleSave = async () => {
    if (!currentTenant?.id) {
      setMessage({ type: 'error', text: 'No tenant selected' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const tenantRef = doc(db, 'tenants', currentTenant.id);
      await updateDoc(tenantRef, { apps: selectedApps });

      setMessage({
        type: 'success',
        text: `Successfully saved ${selectedApps.length} app(s). Dashboard will update on next aggregation (within 15 minutes).`,
      });
    } catch (error) {
      console.error('Error saving apps:', error);
      setMessage({
        type: 'error',
        text: `Failed to save: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Manage Workspace Apps
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Configure which apps should be tracked in the Workspace Pulse dashboard.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-500">
          Discovering apps from your workspace...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Tenant Display */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Current Tenant
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-900">
              {currentTenant?.name || 'No tenant selected'}
            </div>
            <div className="mt-2 text-xs text-neutral-600">
              {selectedApps.length} of {availableApps.length} apps selected for tracking
            </div>
          </div>

          {/* Apps Selection */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">
                Select Apps to Track
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-pink-600 hover:text-pink-700 hover:underline focus:outline-none"
                >
                  Select All
                </button>
                <span className="text-xs text-neutral-400">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-pink-600 hover:text-pink-700 hover:underline focus:outline-none"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {availableApps.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
                <p className="text-sm text-neutral-600">
                  No apps found in your workspace yet.
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Create some epics, features, or cards with app names in Filo first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {availableApps.map((appName) => (
                  <label
                    key={appName}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${
                      selectedApps.includes(appName)
                        ? 'border-pink-300 bg-pink-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedApps.includes(appName)}
                      onChange={() => handleToggleApp(appName)}
                      className="h-5 w-5 rounded border-neutral-300 text-pink-600 focus:ring-2 focus:ring-pink-500/20 focus:ring-offset-0"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <span className="font-medium text-neutral-900">{appName}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
            <div className="text-xs text-neutral-500">
              Changes saved to Firestore • Dashboard updates every 15 minutes
            </div>
            <button
              onClick={handleSave}
              disabled={saving || selectedApps.length === 0}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Status Messages */}
          {message.text && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900">
              How This Works
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-blue-800">
              <li>• Apps are automatically discovered from your epics, features, and cards</li>
              <li>• Check the apps you want to track in the dashboard</li>
              <li>• Selected apps appear in the dashboard's app filter dropdown</li>
              <li>• Cloud Functions aggregate metrics every 15 minutes</li>
              <li>• You can manually trigger aggregation from the panel below</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
