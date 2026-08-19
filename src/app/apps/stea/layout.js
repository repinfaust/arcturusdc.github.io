'use client';

import { TenantProvider } from '@/contexts/TenantContext';
import SteaAppAccessGate from '@/components/SteaAppAccessGate';

export default function SteaLayout({ children }) {
  return (
    <TenantProvider>
      <SteaAppAccessGate>{children}</SteaAppAccessGate>
    </TenantProvider>
  );
}
