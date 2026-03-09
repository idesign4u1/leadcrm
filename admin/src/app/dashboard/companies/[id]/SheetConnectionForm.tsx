'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SheetConnection } from '@leadcrm/types';

interface Props {
  companyId: string;
  existing: SheetConnection | null;
}

export default function SheetConnectionForm({ companyId, existing }: Props) {
  const [spreadsheetId, setSpreadsheetId] = useState(existing?.spreadsheet_id ?? '');
  const [sheetName, setSheetName] = useState(existing?.sheet_name ?? 'Sheet1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const supabase = createSupabaseBrowserClient();

    const payload = { company_id: companyId, spreadsheet_id: spreadsheetId, sheet_name: sheetName };

    const { error } = existing
      ? await supabase.from('sheet_connections').update(payload).eq('id', existing.id)
      : await supabase.from('sheet_connections').insert(payload);

    setSaving(false);
    setMessage(error ? error.message : 'Saved successfully.');
  }

  return (
    <form onSubmit={handleSave} style={styles.form}>
      <label style={styles.label}>Spreadsheet ID</label>
      <input
        style={styles.input}
        placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
        value={spreadsheetId}
        onChange={(e) => setSpreadsheetId(e.target.value)}
        required
      />
      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: -8 }}>
        Found in the Google Sheets URL after /d/
      </p>

      <label style={styles.label}>Sheet Tab Name</label>
      <input
        style={styles.input}
        placeholder="Sheet1"
        value={sheetName}
        onChange={(e) => setSheetName(e.target.value)}
        required
      />

      {message && (
        <p style={{ fontSize: 13, color: message.startsWith('Saved') ? '#16A34A' : '#EF4444' }}>
          {message}
        </p>
      )}

      <button type="submit" disabled={saving} style={styles.button}>
        {saving ? 'Saving…' : existing ? 'Update Connection' : 'Connect Sheet'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { background: '#fff', borderRadius: 10, padding: 20, maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { border: '1px solid #E5E7EB', borderRadius: 7, padding: '9px 12px', fontSize: 14 },
  button: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
