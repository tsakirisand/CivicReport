'use client';
import React, { useState } from 'react';
import { Building, Bell, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const [municipalityName, setMunicipalityName] = useState('Δήμος Παλαιού Φαλήρου');
  const [autoNotifications, setAutoNotifications] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Municipal Settings & Audit Logs</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Configure municipality identity, notification webhooks, and security settings</p>
      </div>

      <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 24, color: '#fff', maxWidth: 640 }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 8 }}>
              <Building size={16} color="#3b82f6" />
              <span>Municipality Official Name</span>
            </label>
            <input
              type="text"
              value={municipalityName}
              onChange={(e) => setMunicipalityName(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 8 }}>
              <Bell size={16} color="#f59e0b" />
              <span>Citizen Status Notifications</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={autoNotifications}
                onChange={(e) => setAutoNotifications(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>Send instant push notifications when status updates occur</span>
            </div>
          </div>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontWeight: 'bold',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>
    </div>
  );
}
