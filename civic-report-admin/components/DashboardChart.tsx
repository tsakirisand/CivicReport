'use client';
import React from 'react';

export default function DashboardChart({ data }: { data: { category: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff' }}>
      <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Reports Distribution by Category</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((item) => {
          const pct = Math.round((item.count / maxCount) * 100);
          return (
            <div key={item.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: '#cbd5e1' }}>
                <span>{item.category.replace('_', ' ').toUpperCase()}</span>
                <span>{item.count} reports</span>
              </div>
              <div style={{ width: '100%', height: 10, backgroundColor: '#0f172a', borderRadius: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    borderRadius: 5,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
