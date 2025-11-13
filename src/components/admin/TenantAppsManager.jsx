'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
  const [apps, setApps] = useState([]);
  const [newAppName, setNewAppName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load current apps for tenant
  useEffect(() => {
    async function loadApps() {
      if (!currentTenant?.id) {
        setLoading(false);
        return;
      }

      try {
        const tenantRef = doc(db, 'tenants', currentTenant.id);
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setApps(data.apps || []);
        }
      } catch (error) {
        console.error('Error loading apps:', error);
        setMessage({ type: 'error', text: 'Failed to load apps configuration' });
      } finally {
        setLoading(false);
      }
    }

    loadApps();
  }, [currentTenant?.id]);

  const handleAddApp = () => {
    const trimmedName = newAppName.trim();

    if (!trimmedName) {
      setMessage({ type: 'error', text: 'App name cannot be empty' });
      return;
    }

    if (apps.includes(trimmedName)) {
      setMessage({ type: 'error', text: 'App already exists' });
      return;
    }

    setApps([...apps, trimmedName]);
    setNewAppName('');
    setMessage({ type: 'success', text: `Added "${trimmedName}" to the list` });
  };

  const handleRemoveApp = (appName) => {
    setApps(apps.filter(name => name !== appName));
    setMessage({ type: 'success', text: `Removed "${appName}" from the list` });
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
      await updateDoc(tenantRef, { apps });

      setMessage({
        type: 'success',
        text: `Successfully saved ${apps.length} app(s). Dashboard will update on next aggregation.`,
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
          Loading apps configuration...
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
            {currentTenant?.id && (
              <div className="mt-1 text-xs text-neutral-500">
                ID: {currentTenant.id}
              </div>
            )}
          </div>

          {/* Current Apps List */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Current Apps ({apps.length})
            </label>
            <div className="mt-2 space-y-2">
              {apps.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
                  No apps configured yet. Add your first app below.
                </div>
              ) : (
                apps.map((appName) => (
                  <div
                    key={appName}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📱</span>
                      <span className="font-medium text-neutral-900">{appName}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveApp(appName)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add New App */}
          <div>
            <label htmlFor="new-app" className="block text-sm font-medium text-neutral-700">
              Add New App
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                id="new-app"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddApp()}
                placeholder="e.g., SyncFit, Toume, Mandrake"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <button
                onClick={handleAddApp}
                disabled={!newAppName.trim()}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Enter the exact name of your app as it appears in your project data.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
            <div className="text-xs text-neutral-500">
              Changes are saved to Firestore immediately
            </div>
            <button
              onClick={handleSave}
              disabled={saving || apps.length === 0}
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
              <li>• Apps configured here appear in the dashboard dropdown</li>
              <li>• Cloud Functions use this list to aggregate metrics per app</li>
              <li>• Dashboard updates automatically every 15 minutes</li>
              <li>• You can manually trigger aggregation from the panel below</li>
            </ul>
            <p className="mt-3 text-xs text-blue-700">
              <strong>Examples:</strong> SyncFit, Toume, Mandrake, ADHD Acclaim
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
