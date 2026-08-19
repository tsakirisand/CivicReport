'use client';
import React, { useState } from 'react';
import ReportsTable from '../../../components/ReportsTable';
import { useReports } from '../../../hooks/useReports';
import { Search, Download, Filter } from 'lucide-react';

export default function ReportsManagementPage() {
  const { reports } = useReports();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority_level === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  /**
   * Fixed UTF-8 BOM CSV Export for perfect Greek character support in Microsoft Excel
   */
  const exportToCSV = () => {
    const headers = ['Report ID', 'Category', 'Description', 'Address', 'Priority', 'Status', 'Date Created'];

    const rows = filtered.map((r) => [
      r.id,
      r.category,
      `"${(r.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.address || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      r.priority_level,
      r.status,
      new Date(r.created_at).toLocaleString('el-GR'),
    ]);

    // UTF-8 BOM \uFEFF ensures Excel renders Greek characters natively
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `municipal_reports_palaio_faliro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Reports Management</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Filter, inspect citizen reports and update resolution status</p>
        </div>

        <button
          onClick={exportToCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#059669',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Download size={16} />
          <span>Export CSV (UTF-8)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0 12px', height: 42 }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search reports by keyword, address, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', marginLeft: 8, fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="#94a3b8" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="cannot_fix">Cannot Fix</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <ReportsTable reports={filtered} />
    </div>
  );
}
