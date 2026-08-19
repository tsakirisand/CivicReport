import React from 'react';
import { Report } from '../types';
import StatusBadge from './StatusBadge';
import { MapPin, Calendar, User } from 'lucide-react';

export default function ReportCard({ report }: { report: Report }) {
  return (
    <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16, color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8' }}>#{report.id.substring(0, 8)}</span>
        <StatusBadge status={report.status} />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 8px 0' }}>{report.category.replace('_', ' ').toUpperCase()}</h3>
      <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12 }}>{report.description}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa' }}>
          <MapPin size={14} />
          <span>{report.address}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={14} />
          <span>{report.user_full_name || 'Citizen'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} />
          <span>{new Date(report.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
