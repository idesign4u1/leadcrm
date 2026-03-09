'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { CompanyStatus } from '@leadcrm/types';

interface Props {
  companyId: string;
  statuses: CompanyStatus[];
}

export default function StatusManager({ companyId, statuses }: Props) {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from('company_statuses').insert({
      company_id: companyId,
      name: newName,
      color: newColor,
      sort_order: statuses.length,
    });
    setNewName('');
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('company_statuses').delete().eq('id', id);
    router.refresh();
  }

  return (
    <div style={styles.container}>
      <div style={styles.list}>
        {statuses.length === 0 && (
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No statuses yet.</p>
        )}
        {statuses.map((s) => (
          <div key={s.id} style={styles.statusRow}>
            <span style={{ ...styles.dot, background: s.color }} />
            <span style={{ fontSize: 14 }}>{s.name}</span>
            {s.is_default && <span style={styles.badge}>default</span>}
            <button onClick={() => handleDelete(s.id)} style={styles.deleteBtn}>×</button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} style={styles.addForm}>
        <input
          style={styles.input}
          placeholder="Status name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={styles.colorPicker} />
        <button type="submit" disabled={adding} style={styles.addBtn}>
          {adding ? '…' : '+ Add'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: '#fff', borderRadius: 10, padding: 20, maxWidth: 520, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  list: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
  badge: { fontSize: 11, background: '#DBEAFE', color: '#1D4ED8', borderRadius: 4, padding: '2px 6px' },
  deleteBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 18, lineHeight: 1 },
  addForm: { display: 'flex', gap: 8, alignItems: 'center' },
  input: { flex: 1, border: '1px solid #E5E7EB', borderRadius: 7, padding: '8px 12px', fontSize: 13 },
  colorPicker: { width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 },
  addBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
