'use client';
import React from 'react';
import { useReports } from '../../../hooks/useReports';
import DashboardChart from '../../../components/DashboardChart';

export default function AnalyticsPage() {
  const { reports } = useReports();

  // Calculate REAL Average Response Time from actual report updates in database
  let totalHours = 0;
  let countWithUpdates = 0;

  reports.forEach((r) => {
    if (r.updates && r.updates.length > 0) {
      const firstUpdate = r.updates[0];
      const created = new Date(r.created_at).getTime();
      const updated = new Date(firstUpdate.updated_at).getTime();
      const diffHours = Math.max(0, (updated - created) / (1000 * 60 * 60));
      totalHours += diffHours;
      countWithUpdates += 1;
    }
  });

  const avgResponseTimeText =
    countWithUpdates > 0
      ? `${(totalHours / countWithUpdates).toFixed(1)} Hours`
      : 'No Resolution Data Yet';

  const categoryCounts = [
    { category: 'broken_light', count: reports.filter((r) => r.category === 'broken_light').length },
    { category: 'pothole', count: reports.filter((r) => r.category === 'pothole').length },
    { category: 'graffiti', count: reports.filter((r) => r.category === 'graffiti').length },
    { category: 'trash', count: reports.filter((r) => r.category === 'trash').length },
    { category: 'flooding', count: reports.filter((r) => r.category === 'flooding').length },
  ];

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Analytics & Response Times</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Live municipal performance metrics calculated directly from Supabase DB</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 20, color: '#fff' }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Average Response Time</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#38bdf8', marginTop: 8 }}>{avgResponseTimeText}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Calculated from {countWithUpdates} resolved reports</div>
        </div>

        <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 20, color: '#fff' }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Resolution Rate</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4ade80', marginTop: 8 }}>{total > 0 ? Math.round((resolved / total) * 100) : 0}%</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{resolved} out of {total} total reports resolved</div>
        </div>
      </div>

      <DashboardChart data={categoryCounts} />
    </div>
  );
}
