import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { fetchLead, updateLead } from '@/lib/leads';
import type { LeadRow } from '@leadcrm/types';

// Fields the user can edit inline on the detail screen
const EDITABLE_FIELDS = new Set(['status', 'notes', 'assigned_to']);
// Fields hidden from the UI entirely
const HIDDEN_FIELDS = new Set(['lead_id', 'updated_at']);
// Fields that trigger phone/email actions
const PHONE_FIELDS = ['phone', 'mobile', 'tel'];
const EMAIL_FIELDS = ['email'];

export default function LeadDetailScreen() {
  const { rowIndex, companyId } = useLocalSearchParams<{
    rowIndex: string;
    companyId: string;
  }>();
  const router = useRouter();

  const [headers, setHeaders] = useState<string[]>([]);
  const [fields, setFields] = useState<LeadRow>({});
  const [edits, setEdits] = useState<Partial<LeadRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchLead(companyId, parseInt(rowIndex, 10));
      setHeaders(data.headers);
      setFields(data.fields);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [companyId, rowIndex]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (Object.keys(edits).length === 0) return;
    setSaving(true);
    try {
      await updateLead(companyId, parseInt(rowIndex, 10), edits);
      setFields((prev) => ({ ...prev, ...edits }));
      setEdits({});
      Alert.alert('Saved', 'Lead updated successfully.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleCall() {
    const phoneField = PHONE_FIELDS.find((f) => fields[f]);
    const phone = phoneField ? fields[phoneField] : null;
    if (!phone) { Alert.alert('No phone number found.'); return; }
    Linking.openURL(`tel:${phone}`);
  }

  function handleMessage() {
    const phoneField = PHONE_FIELDS.find((f) => fields[f]);
    const phone = phoneField ? fields[phoneField] : null;
    if (!phone) { Alert.alert('No phone number found.'); return; }
    Linking.openURL(`sms:${phone}`);
  }

  function handleEmail() {
    const emailField = EMAIL_FIELDS.find((f) => fields[f]);
    const email = emailField ? fields[emailField] : null;
    if (!email) { Alert.alert('No email found.'); return; }
    Linking.openURL(`mailto:${email}`);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: fields['name'] || fields['full_name'] || `Lead #${rowIndex}`,
          headerBackTitle: 'Leads',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Action buttons */}
        <View style={styles.actions}>
          <ActionButton label="Call" onPress={handleCall} color="#16A34A" />
          <ActionButton label="SMS" onPress={handleMessage} color="#0891B2" />
          <ActionButton label="Email" onPress={handleEmail} color="#7C3AED" />
        </View>

        {/* Dynamic fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Details</Text>
          {headers
            .filter((h) => !HIDDEN_FIELDS.has(h))
            .map((header) => {
              const isEditable = EDITABLE_FIELDS.has(header);
              const currentValue = edits[header] ?? fields[header] ?? '';
              return (
                <View key={header} style={styles.field}>
                  <Text style={styles.fieldLabel}>{header}</Text>
                  {isEditable ? (
                    <TextInput
                      style={[styles.fieldInput, header === 'notes' && styles.notesInput]}
                      value={currentValue}
                      onChangeText={(v) => setEdits((prev) => ({ ...prev, [header]: v }))}
                      multiline={header === 'notes'}
                      numberOfLines={header === 'notes' ? 4 : 1}
                      placeholder={`Enter ${header}…`}
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{fields[header] || '—'}</Text>
                  )}
                </View>
              );
            })}
        </View>

        {/* Metadata */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Last updated: {fields['updated_at']
              ? new Date(fields['updated_at']).toLocaleString()
              : '—'}
          </Text>
        </View>

        {/* Save button */}
        {hasChanges && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

function ActionButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 14 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue: { fontSize: 15, color: '#111827' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  notesInput: { height: 90, textAlignVertical: 'top' },
  meta: { paddingHorizontal: 16, marginBottom: 8 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  saveBtn: {
    backgroundColor: '#2563EB',
    margin: 12,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
