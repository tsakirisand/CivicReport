import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
}

export default function StatsCard({ title, value, icon, color, bgColor }: StatsCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 200,
        backgroundColor: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>{value}</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{title}</div>
      </div>
    </div>
  );
}
