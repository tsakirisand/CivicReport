import React from 'react';
import { ReportStatus } from '../types';

export default function StatusBadge({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, { bg: string; color: string; label: string }> = {
    submitted: { bg: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', label: 'SUBMITTED' },
    acknowledged: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', label: 'ACKNOWLEDGED' },
    in_progress: { bg: 'rgba(99, 102, 241, 0.25)', color: '#818cf8', label: 'IN PROGRESS' },
    resolved: { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', label: 'RESOLVED' },
    cannot_fix: { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', label: 'CANNOT FIX' },
  };

  const st = styles[status] || styles.submitted;

  return (
    <span
      style={{
        backgroundColor: st.bg,
        color: st.color,
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}
    >
      {st.label}
    </span>
  );
}
