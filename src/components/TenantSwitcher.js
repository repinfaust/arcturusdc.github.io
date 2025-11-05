'use client';

import { useState, useRef, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import Link from 'next/link';

export default function TenantSwitcher({ className = '' }) {
  const { currentTenant, availableTenants, switchTenant, loading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border border-neutral-200 bg-white/80 px-3 py-2 text-sm ${className}`}>
        <div className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
        <span className="text-neutral-500">Loading workspace...</span>
      </div>
    );
  }

  if (availableTenants.length === 0) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm ${className}`}>
        <span className="text-amber-800">No workspace access</span>
      </div>
    );
  }

  if (availableTenants.length === 1) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border border-neutral-200 bg-white/80 px-3 py-2 text-sm ${className}`}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-xs font-semibold text-white">
          {currentTenant?.name?.[0]?.toUpperCase() || 'W'}
        </div>
        <span className="font-medium text-neutral-900">{currentTenant?.name || 'Workspace'}</span>
        {(isSuperAdmin || isWorkspaceAdmin) && (
          <Link
            href="/apps/stea/admin"
            className="ml-1 text-xs text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            Admin
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white/80 px-3 py-2 text-sm transition hover:border-neutral-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-xs font-semibold text-white">
          {currentTenant?.name?.[0]?.toUpperCase() || 'W'}
        </div>
        <span className="font-medium text-neutral-900">{currentTenant?.name || 'Select workspace'}</span>
        <svg
          className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-64 rounded-xl border border-neutral-200 bg-white shadow-xl">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Your Workspaces
          </div>
          <div className="max-h-80 overflow-y-auto">
            {availableTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  switchTenant(tenant);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-neutral-50 ${
                  currentTenant?.id === tenant.id ? 'bg-pink-50' : ''
                }`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-xs font-semibold text-white">
                  {tenant.name?.[0]?.toUpperCase() || 'W'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium text-neutral-900">{tenant.name}</div>
                  {tenant.plan && (
                    <div className="text-xs capitalize text-neutral-500">{tenant.plan} plan</div>
                  )}
                </div>
                {currentTenant?.id === tenant.id && (
                  <svg className="h-5 w-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {(isSuperAdmin || isWorkspaceAdmin) && (
            <>
              <div className="border-t border-neutral-200" />
              <Link
                href="/apps/stea/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
