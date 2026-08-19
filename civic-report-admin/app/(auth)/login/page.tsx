'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginAdmin } from '../../../services/authService';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@palaiofaliro.gr');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await loginAdmin(email, password);
    setLoading(false);

    if (res.error && !res.user) {
      setError(res.error);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.1)', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#ffffff' }}>Municipality Admin Portal</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Δήμος Παλαιού Φαλήρου - Διαχείριση Αναφορών</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Admin Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0 12px', height: 46 }}>
              <Mail size={18} color="#64748b" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@palaiofaliro.gr"
                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', marginLeft: 10, fontSize: 14 }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0 12px', height: 46 }}>
              <Lock size={18} color="#64748b" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', marginLeft: 10, fontSize: 14 }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              height: 48,
              fontWeight: 'bold',
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>{loading ? 'Authenticating...' : 'Log In to Admin Dashboard'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
