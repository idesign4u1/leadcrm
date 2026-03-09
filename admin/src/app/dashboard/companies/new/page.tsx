'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('companies').insert({ name, slug });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard/companies');
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>New Company</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Company Name</label>
        <input style={styles.input} value={name} onChange={(e) => handleNameChange(e.target.value)} required />

        <label style={styles.label}>Slug</label>
        <input style={styles.input} value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: -8 }}>Lowercase, letters, numbers, hyphens only.</p>

        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Creating…' : 'Create Company'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { background: '#fff', borderRadius: 10, padding: 24, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { border: '1px solid #E5E7EB', borderRadius: 7, padding: '9px 12px', fontSize: 14 },
  error: { color: '#EF4444', fontSize: 13 },
  button: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
