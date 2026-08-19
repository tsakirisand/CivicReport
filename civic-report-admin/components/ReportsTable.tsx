'use client';
import React from 'react';
import Link from 'next/link';
import { Report } from '../types';
import StatusBadge from './StatusBadge';
import { MapPin, Eye, Camera } from 'lucide-react';

interface ReportsTableProps {
  reports: Report[];
}

export default function ReportsTable({ reports }: ReportsTableProps) {
  return (
    <div style={{ overflowX: 'auto', backgroundColor: '#1e293b', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
        <thead>
          <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <th style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Photo</th>
            <th style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Category / ID</th>
            <th style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Description & Address</th>
            <th style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Priority</th>
            <th style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
            <th style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                No reports submitted yet in Supabase database.
              </td>
            </tr>
          ) : (
            reports.map((report) => {
              const hasPhoto = report.photos && report.photos.length > 0;
              const photoUrl = hasPhoto ? report.photos[0] : null;

              return (
                <tr key={report.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Report photo"
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <Camera size={20} color="#64748b" />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{report.category.replace('_', ' ').toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>#{report.id.substring(0, 8)}</div>
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 300 }}>
                    <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 500 }}>{report.description}</div>
                    <div style={{ fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={13} />
                      <span>{report.address}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: report.priority_level === 'high' ? '#f87171' : report.priority_level === 'medium' ? '#fbbf24' : '#60a5fa',
                      }}
                    >
                      {report.priority_level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={report.status} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Link
                      href={`/reports/${report.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <Eye size={14} />
                      <span>Change Status</span>
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
