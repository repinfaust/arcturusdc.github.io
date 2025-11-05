'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import {
  createTenant,
  getAllTenants,
  getTenantMembers,
  addTenantMember,
  removeTenantMember,
  updateMemberRole,
  deleteTenant,
  updateTenant,
} from '@/lib/tenantUtils';
import TenantSwitcher from '@/components/TenantSwitcher';

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

export default function AdminPage() {
  const router = useRouter();
  const { isSuperAdmin, isWorkspaceAdmin, availableTenants, currentTenant, refreshTenants, loading: tenantLoading } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // Start on members tab

  // Forms state
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('team');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        router.replace('/apps/stea');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Check admin access after tenant context loads
  useEffect(() => {
    if (authReady && user && !tenantLoading) {
      // Only redirect if we're sure they're not an admin
      if (!isSuperAdmin && !isWorkspaceAdmin) {
        router.replace('/apps/stea');
      }
    }
  }, [authReady, user, tenantLoading, isSuperAdmin, isWorkspaceAdmin, router]);

  // Load tenants (super admins only)
  useEffect(() => {
    if (authReady && user && isSuperAdmin) {
      loadTenants();
    }
  }, [authReady, user, isSuperAdmin]);

  // Auto-select current tenant for workspace admins
  useEffect(() => {
    if (authReady && user && isWorkspaceAdmin && !isSuperAdmin && currentTenant) {
      setSelectedTenant(currentTenant);
    }
  }, [authReady, user, isWorkspaceAdmin, isSuperAdmin, currentTenant]);

  // Load members when tenant selected
  useEffect(() => {
    if (selectedTenant) {
      loadMembers(selectedTenant.id);
    }
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const allTenants = await getAllTenants();
      setTenants(allTenants);
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (tenantId) => {
    try {
      const tenantMembers = await getTenantMembers(tenantId);
      setMembers(tenantMembers);
    } catch (err) {
      console.error('Failed to load members:', err);
      setError('Failed to load members');
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      await createTenant({
        name: newTenantName,
        plan: newTenantPlan,
        ownerEmail: user.email,
      });

      setSuccess(`Workspace "${newTenantName}" created successfully!`);
      setNewTenantName('');
      setNewTenantPlan('team');
      setShowCreateTenant(false);
      await loadTenants();
      refreshTenants();
    } catch (err) {
      console.error('Failed to create tenant:', err);
      setError(err.message || 'Failed to create workspace');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      await addTenantMember({
        tenantId: selectedTenant.id,
        userEmail: newMemberEmail.toLowerCase(),
        role: newMemberRole,
        invitedBy: user.email,
      });

      setSuccess(`Added ${newMemberEmail} to ${selectedTenant.name}`);
      setNewMemberEmail('');
      setNewMemberRole('member');
      setShowAddMember(false);
      await loadMembers(selectedTenant.id);
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err.message || 'Failed to add member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberEmail) => {
    if (!selectedTenant) return;
    if (!confirm(`Remove ${memberEmail} from ${selectedTenant.name}?`)) return;

    setError('');
    setSuccess('');

    try {
      await removeTenantMember(selectedTenant.id, memberEmail);
      setSuccess(`Removed ${memberEmail}`);
      await loadMembers(selectedTenant.id);
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberEmail, newRole) => {
    if (!selectedTenant) return;

    setError('');
    setSuccess('');

    try {
      await updateMemberRole(selectedTenant.id, memberEmail, newRole);
      setSuccess(`Updated ${memberEmail}'s role to ${newRole}`);
      await loadMembers(selectedTenant.id);
    } catch (err) {
      console.error('Failed to update role:', err);
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (!confirm(`Delete workspace "${tenant.name}"? This will remove all members and cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteTenant(tenant.id);
      setSuccess(`Deleted workspace "${tenant.name}"`);
      if (selectedTenant?.id === tenant.id) {
        setSelectedTenant(null);
        setMembers([]);
      }
      await loadTenants();
      refreshTenants();
    } catch (err) {
      console.error('Failed to delete tenant:', err);
      setError(err.message || 'Failed to delete workspace');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth);
      router.replace('/apps/stea');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (!authReady || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">Loading admin panel...</div>
      </div>
    );
  }

  // Show loading while checking admin status
  if (!authReady || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-pink-600 mx-auto" />
          <p className="text-sm text-neutral-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Only show to admins
  if (!user || (!isSuperAdmin && !isWorkspaceAdmin)) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-pink-50/30">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/apps/stea"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100"
              >
                ← Back to STEa
              </Link>
              <div className="h-6 w-px bg-neutral-200" />
              <h1 className="text-xl font-semibold text-neutral-900">STEa Admin</h1>
            </div>

            <div className="flex items-center gap-3">
              <TenantSwitcher />
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-neutral-200">
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === 'tenants'
                  ? 'border-b-2 border-pink-600 text-pink-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Workspaces ({tenants.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'members'
                ? 'border-b-2 border-pink-600 text-pink-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            disabled={!selectedTenant}
          >
            Members {selectedTenant && `(${members.length})`}
          </button>
        </div>

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">All Workspaces</h2>
              <button
                onClick={() => setShowCreateTenant(!showCreateTenant)}
                className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700"
              >
                {showCreateTenant ? 'Cancel' : '+ New Workspace'}
              </button>
            </div>

            {/* Create Tenant Form */}
            {showCreateTenant && (
              <form onSubmit={handleCreateTenant} className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
                <h3 className="mb-4 font-medium text-neutral-900">Create New Workspace</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Workspace Name</label>
                    <input
                      type="text"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      placeholder="e.g., Acme Corp"
                      required
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Plan</label>
                    <select
                      value={newTenantPlan}
                      onChange={(e) => setNewTenantPlan(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    >
                      <option value="solo">Solo</option>
                      <option value="team">Team</option>
                      <option value="agency">Agency</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="mt-4 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </form>
            )}

            {/* Tenants List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className={`rounded-lg border p-4 transition ${
                    selectedTenant?.id === tenant.id
                      ? 'border-pink-300 bg-pink-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{tenant.name}</h3>
                      <p className="text-xs capitalize text-neutral-500">{tenant.plan} plan</p>
                    </div>
                    <button
                      onClick={() => setSelectedTenant(tenant)}
                      className="rounded px-2 py-1 text-xs text-pink-600 transition hover:bg-pink-100"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="mb-3 text-xs text-neutral-500">
                    Created: {tenant.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </div>
                  <button
                    onClick={() => handleDeleteTenant(tenant)}
                    className="text-xs text-red-600 transition hover:text-red-700 hover:underline"
                  >
                    Delete workspace
                  </button>
                </div>
              ))}

              {tenants.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                  <p className="text-neutral-600">No workspaces yet. Create your first one above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            {selectedTenant ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Members of {selectedTenant.name}
                    </h2>
                    <p className="text-sm text-neutral-600">{members.length} total members</p>
                  </div>
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700"
                  >
                    {showAddMember ? 'Cancel' : '+ Add Member'}
                  </button>
                </div>

                {/* Add Member Form */}
                {showAddMember && (
                  <form onSubmit={handleAddMember} className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
                    <h3 className="mb-4 font-medium text-neutral-900">Add Member to {selectedTenant.name}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700">Email Address</label>
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="user@example.com"
                          required
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700">Role</label>
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="tester">Tester</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="mt-4 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Adding...' : 'Add Member'}
                    </button>
                  </form>
                )}

                {/* Members List */}
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <table className="w-full">
                    <thead className="border-b border-neutral-200 bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-600">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-600">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-600">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-600">
                          Invited
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {members.map((member) => (
                        <tr key={member.id} className="transition hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm text-neutral-900">{member.userEmail}</td>
                          <td className="px-4 py-3">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.userEmail, e.target.value)}
                              className="rounded border border-neutral-300 px-2 py-1 text-xs capitalize focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="tester">Tester</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                member.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {member.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-600">
                            {member.invitedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveMember(member.userEmail)}
                              className="text-xs text-red-600 transition hover:text-red-700 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}

                      {members.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                            No members yet. Add members above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                <p className="text-neutral-600">Select a workspace from the Workspaces tab to manage its members.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
