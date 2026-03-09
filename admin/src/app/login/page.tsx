'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>LeadCRM Admin</h1>
        <p style={styles.subtitle}>Sign in to manage companies and users</p>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' },
  card: { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none' },
  error: { color: '#EF4444', fontSize: 13 },
  button: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};
