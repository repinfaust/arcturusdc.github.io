'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const TenantContext = createContext({
  currentTenant: null,
  availableTenants: [],
  loading: true,
  error: null,
  switchTenant: () => {},
  refreshTenants: () => {},
  isSuperAdmin: false,
});

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

export function TenantProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Load user's tenants from tenant_members collection
  const loadTenants = useCallback(async (userEmail) => {
    if (!userEmail) {
      setAvailableTenants([]);
      setCurrentTenant(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if user is super admin
      const isAdmin = SUPER_ADMINS.includes(userEmail);
      setIsSuperAdmin(isAdmin);

      // If super admin, load all tenants
      if (isAdmin) {
        console.log('[TENANT DEBUG] User is super admin, loading all tenants');
        const tenantsRef = collection(db, 'tenants');
        const tenantsSnap = await getDocs(tenantsRef);
        const allTenants = [];

        tenantsSnap.forEach((doc) => {
          allTenants.push({ id: doc.id, ...doc.data() });
        });

        setAvailableTenants(allTenants);

        // Auto-select first tenant or last used
        if (allTenants.length > 0) {
          const lastTenantId = localStorage.getItem('lastTenantId');
          const lastTenant = allTenants.find(t => t.id === lastTenantId);
          console.log('[TENANT DEBUG] Super admin has', allTenants.length, 'tenants. Last tenant from localStorage:', lastTenantId);
          console.log('[TENANT DEBUG] Auto-selecting:', lastTenant ? lastTenant.name : allTenants[0].name);
          setCurrentTenant(lastTenant || allTenants[0]);
        }
      } else {
        // Load tenants user is a member of
        const membershipsRef = collection(db, 'tenant_members');
        const q = query(
          membershipsRef,
          where('userEmail', '==', userEmail),
          where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        const tenantIds = new Set();

        snapshot.forEach((doc) => {
          tenantIds.add(doc.data().tenantId);
        });

        // Fetch tenant details
        const tenants = [];
        for (const tenantId of tenantIds) {
          const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
          if (tenantDoc.exists()) {
            tenants.push({ id: tenantDoc.id, ...tenantDoc.data() });
          }
        }

        setAvailableTenants(tenants);

        // Auto-select tenant
        if (tenants.length === 1) {
          console.log('[TENANT DEBUG] User has 1 tenant, auto-selecting:', tenants[0].name, tenants[0].id);
          setCurrentTenant(tenants[0]);
        } else if (tenants.length > 1) {
          const lastTenantId = localStorage.getItem('lastTenantId');
          const lastTenant = tenants.find(t => t.id === lastTenantId);
          console.log('[TENANT DEBUG] User has', tenants.length, 'tenants. Last tenant from localStorage:', lastTenantId, 'Found:', !!lastTenant);
          console.log('[TENANT DEBUG] Available tenants:', tenants.map(t => ({ name: t.name, id: t.id })));
          setCurrentTenant(lastTenant || tenants[0]);
        } else {
          console.log('[TENANT DEBUG] User has no tenants');
          setCurrentTenant(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setError(err.message || 'Failed to load workspaces');
      setAvailableTenants([]);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser?.email) {
        loadTenants(firebaseUser.email);
      } else {
        setAvailableTenants([]);
        setCurrentTenant(null);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadTenants]);

  // Save current tenant to localStorage
  useEffect(() => {
    if (currentTenant?.id) {
      localStorage.setItem('lastTenantId', currentTenant.id);
    }
  }, [currentTenant]);

  const switchTenant = useCallback((tenant) => {
    setCurrentTenant(tenant);
  }, []);

  const refreshTenants = useCallback(() => {
    if (user?.email) {
      loadTenants(user.email);
    }
  }, [user, loadTenants]);

  const value = {
    currentTenant,
    availableTenants,
    loading,
    error,
    switchTenant,
    refreshTenants,
    isSuperAdmin,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
