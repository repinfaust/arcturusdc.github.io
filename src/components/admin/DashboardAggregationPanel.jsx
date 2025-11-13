'use client';

import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { aggregateWorkspacePulse } from '@/lib/workspacePulseAggregator';

/**
 * Admin panel component for manually triggering workspace pulse aggregation
 *
 * Usage: Add this to /apps/stea/admin/page.js
 * Only accessible to super admins
 */
export default function DashboardAggregationPanel() {
  const { currentTenant, isSuperAdmin } = useTenant();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [apps, setApps] = useState('SyncFit, Toume');

  if (!isSuperAdmin) {
    return null;
  }

  const handleAggregate = async () => {
    if (!currentTenant?.id) {
      setError('No tenant selected');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Aggregating dashboard metrics...');

    try {
      const appsList = apps
        .split(',')
        .map(app => app.trim())
        .filter(app => app.length > 0);

      await aggregateWorkspacePulse(currentTenant.id, {
        apps: appsList,
      });

      setStatus(`✅ Dashboard metrics updated successfully for ${currentTenant.name}`);
      setError('');
    } catch (err) {
      console.error('Aggregation error:', err);
      setError(`Failed to aggregate: ${err.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Workspace Pulse Dashboard Aggregation
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Manually trigger dashboard metrics calculation for the current tenant.
        </p>
      </div>

      <div className="space-y-4">
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

        {/* Apps Input */}
        <div>
          <label htmlFor="apps" className="block text-sm font-medium text-neutral-700">
            Apps to Track (comma-separated)
          </label>
          <input
            type="text"
            id="apps"
            value={apps}
            onChange={(e) => setApps(e.target.value)}
            placeholder="SyncFit, Toume, Mandrake"
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Enter app names separated by commas. These will be used to calculate build progress.
          </p>
        </div>

        {/* Aggregate Button */}
        <button
          onClick={handleAggregate}
          disabled={loading || !currentTenant?.id}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Aggregating...' : 'Aggregate Dashboard Metrics'}
        </button>

        {/* Status Messages */}
        {status && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {status}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900">
            What This Does
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-blue-800">
            <li>• Calculates build progress across all specified apps</li>
            <li>• Aggregates testing snapshot from Hans test cases</li>
            <li>• Computes backlog health metrics from Filo cards</li>
            <li>• Gathers discovery signals from Harls projects</li>
            <li>• Analyzes documentation activity from Ruby docs</li>
            <li>• Updates `/tenants/{'{tenantId}'}/dashboard/metrics` in Firestore</li>
          </ul>
          <p className="mt-3 text-xs text-blue-700">
            <strong>Note:</strong> This operation queries multiple collections and may take 5-15 seconds.
            The dashboard will update automatically via real-time listeners.
          </p>
        </div>
      </div>
    </div>
  );
}
