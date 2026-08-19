'use client';
import React from 'react';
import StatsCard from '../../components/StatsCard';
import DashboardChart from '../../components/DashboardChart';
import ReportsTable from '../../components/ReportsTable';
import { useReports } from '../../hooks/useReports';
import { Radio } from 'lucide-react';

export default function DashboardPage() {
  const { reports } = useReports();

  const total = reports.length;
  const pending = reports.filter((r) => r.status === 'submitted').length;
  const inProgress = reports.filter((r) => r.status === 'in_progress' || r.status === 'acknowledged').length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const categoryCounts = [
    { category: 'broken_light', count: reports.filter((r) => r.category === 'broken_light').length },
    { category: 'pothole', count: reports.filter((r) => r.category === 'pothole').length },
    { category: 'graffiti', count: reports.filter((r) => r.category === 'graffiti').length },
    { category: 'trash', count: reports.filter((r) => r.category === 'trash').length },
    { category: 'flooding', count: reports.filter((r) => r.category === 'flooding').length },
  ];

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Municipality Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Δήμος Παλαιού Φαλήρου • Real-Time Supabase Management</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: 20 }}>
          <Radio size={16} color="#34d399" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>Supabase Realtime Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatsCard title="Total Reports" value={total} icon="📋" color="#2563eb" bgColor="rgba(37, 99, 235, 0.2)" />
        <StatsCard title="Pending (Submitted)" value={pending} icon="⏳" color="#d97706" bgColor="rgba(245, 158, 11, 0.2)" />
        <StatsCard title="In Progress" value={inProgress} icon="🔧" color="#4f46e5" bgColor="rgba(99, 102, 241, 0.2)" />
        <StatsCard title={`Resolved (${completionRate}%)`} value={resolved} icon="✅" color="#16a34a" bgColor="rgba(16, 185, 129, 0.2)" />
      </div>

      {/* Category Chart Section */}
      <div style={{ marginBottom: 28 }}>
        <DashboardChart data={categoryCounts} />
      </div>

      {/* Recent Reports Table */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 }}>Live Citizen Reports</h2>
        <ReportsTable reports={reports} />
      </div>
    </div>
  );
}
