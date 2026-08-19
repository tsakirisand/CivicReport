import React from 'react';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, maxWidth: 1400, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
