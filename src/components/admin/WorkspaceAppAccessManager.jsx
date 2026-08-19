'use client';

import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { updateTenant } from '@/lib/tenantUtils';
import { normalizeAllowedSteaApps, STEA_APP_KEYS, tenantUsesLegacyAppAccess } from '@/lib/steaAppCatalog';
import SteaAppSelector from './SteaAppSelector';

export default function WorkspaceAppAccessManager({ tenant, onSaved }) {
  const { isSuperAdmin, isWorkspaceAdmin, refreshTenants } = useTenant();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setSelectedKeys(
      tenantUsesLegacyAppAccess(tenant)
        ? [...STEA_APP_KEYS]
        : normalizeAllowedSteaApps(tenant?.allowedSteaApps)
    );
    setMessage(null);
  }, [tenant]);

  if (!tenant || (!isSuperAdmin && !isWorkspaceAdmin)) return null;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const allowedSteaApps = normalizeAllowedSteaApps(selectedKeys);
      await updateTenant(tenant.id, { allowedSteaApps });
      await refreshTenants();
      onSaved?.({ ...tenant, allowedSteaApps });
      setMessage({ type: 'success', text: `${allowedSteaApps.length} apps are now available in ${tenant.name}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'App access could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">App access</p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900">{tenant.name}</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            This is the workspace’s visible and permitted STEa app set. Existing workspaces keep legacy access until this policy is saved.
          </p>
        </div>
        {tenantUsesLegacyAppAccess(tenant) && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Legacy: all apps
          </span>
        )}
      </div>

      <SteaAppSelector selectedKeys={selectedKeys} onChange={setSelectedKeys} disabled={saving} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-5">
        <div aria-live="polite" className={`text-sm ${message?.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
          {message?.text || 'Changes apply the next time a member navigates or switches workspace.'}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving access…' : 'Save app access'}
        </button>
      </div>
    </section>
  );
}
