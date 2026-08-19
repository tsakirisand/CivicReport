'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MapPin, BarChart3, Settings, ShieldCheck, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Live Map', href: '/map', icon: MapPin },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside style={{ width: 260, backgroundColor: '#1e293b', minHeight: '100vh', padding: 24, borderRight: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>Palaio Faliro</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Municipality Admin</p>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: 32 }}>
        <Link
          href="/login"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            color: '#fca5a5',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
}
