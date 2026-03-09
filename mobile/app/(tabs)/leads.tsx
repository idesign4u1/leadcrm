import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchLeads } from '@/lib/leads';
import { isSuperAdmin } from '@/lib/auth';
import type { Lead } from '@leadcrm/types';

// Columns hidden from preview (internal CRM metadata)
const HIDDEN_COLS = new Set(['lead_id', 'updated_at']);
const PREVIEW_COUNT = 3;

export default function LeadsScreen() {
  const { roles } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const companyId = isSuperAdmin(roles)
    ? null
    : (roles.find((r) => r.company_id)?.company_id ?? null);

  const load = useCallback(async () => {
    if (!companyId) {
      setError('No company assigned.');
      setLoading(false);
      return;
    }
    try {
      const data = await fetchLeads(companyId);
      setHeaders(data.headers);
      setLeads(data.leads);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const previewCols = headers
    .filter((h) => !HIDDEN_COLS.has(h))
    .slice(0, PREVIEW_COUNT);

  const filtered = search.trim()
    ? leads.filter((lead) =>
        Object.values(lead.fields).some((v) =>
          v.toLowerCase().includes(search.trim().toLowerCase())
        )
      )
    : leads;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        {companyId && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push(`/lead/new?companyId=${companyId}`)}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search leads…"
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={{ color: '#2563EB' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.rowIndex)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              previewCols={previewCols}
              onPress={() =>
                router.push(`/lead/${item.rowIndex}?companyId=${companyId}`)
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? 'No leads match your search.' : 'No leads yet.'}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

function LeadCard({
  lead,
  previewCols,
  onPress,
}: {
  lead: Lead;
  previewCols: string[];
  onPress: () => void;
}) {
  const status = lead.fields['status'];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={{ gap: 3 }}>
        {previewCols.map((col) => (
          <Text key={col} style={styles.cardField} numberOfLines={1}>
            <Text style={styles.cardLabel}>{col}: </Text>
            {lead.fields[col] || '—'}
          </Text>
        ))}
      </View>
      {status ? (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#2563EB', borderRadius: 7, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  search: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardField: { fontSize: 13, color: '#374151' },
  cardLabel: { fontWeight: '600', color: '#6B7280' },
  statusBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn: { padding: 8 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 48, fontSize: 14 },
});
