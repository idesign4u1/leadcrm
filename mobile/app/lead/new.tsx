import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { fetchHeaders, createLead } from '@/lib/leads';
import type { LeadRow } from '@leadcrm/types';

// Skip auto-filled CRM fields from the form
const SKIP_FIELDS = new Set(['lead_id', 'updated_at']);

export default function NewLeadScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const router = useRouter();

  const [headers, setHeaders] = useState<string[]>([]);
  const [fields, setFields] = useState<LeadRow>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHeaders(companyId)
      .then((h) => {
        setHeaders(h);
        const initial: LeadRow = {};
        h.forEach((k) => { initial[k] = ''; });
        setFields(initial);
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  async function handleCreate() {
    setSaving(true);
    try {
      await createLead(companyId, fields);
      Alert.alert('Success', 'Lead added successfully.');
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const formFields = headers.filter((h) => !SKIP_FIELDS.has(h));

  return (
    <>
      <Stack.Screen options={{ title: 'Add Lead', headerBackTitle: 'Leads' }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.form}>
          {formFields.map((header) => (
            <View key={header} style={styles.field}>
              <Text style={styles.label}>{header}</Text>
              <TextInput
                style={[styles.input, header === 'notes' && styles.notesInput]}
                value={fields[header] ?? ''}
                onChangeText={(v) => setFields((prev) => ({ ...prev, [header]: v }))}
                multiline={header === 'notes'}
                numberOfLines={header === 'notes' ? 4 : 1}
                placeholder={`Enter ${header}…`}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Add Lead</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  notesInput: { height: 90, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#2563EB',
    margin: 12,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
