'use client';

import { TenantProvider } from '@/contexts/TenantContext';

export default function SteaLayout({ children }) {
  return <TenantProvider>{children}</TenantProvider>;
}
