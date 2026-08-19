'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useReports } from '../../../hooks/useReports';
import { MapPin, Radio, Filter } from 'lucide-react';

const LiveAdminMap = dynamic(() => import('../../../components/LiveAdminMap'), {
  ssr: false,
  loading: () => <div style={{ height: 520, backgroundColor: '#0f172a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading Live GIS Map...</div>,
});

export default function MapPage() {
  const { reports } = useReports();
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReports = reports.filter((r) => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={26} color="#3b82f6" />
            <span>Interactive Municipal Map (Palaio Faliro)</span>
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Real-Time GIS Mapping of Citizen Reports across Palaio Faliro</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: 20 }}>
          <Radio size={16} color="#34d399" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>Live Map Sync Active</span>
        </div>
      </div>

      {/* Map Filter Controls */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#94a3b8" />
          <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>Filter Map Pins:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}
        >
          <option value="all">All Map Reports ({reports.length})</option>
          <option value="submitted">Submitted Only</option>
          <option value="in_progress">In Progress Only</option>
          <option value="resolved">Resolved Only</option>
        </select>
      </div>

      {/* Interactive Map Component */}
      <LiveAdminMap reports={filteredReports} />
    </div>
  );
}
