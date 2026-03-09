import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';

export default function SettingsScreen() {
  const { profile, roles } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile?.full_name ?? '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{roles[0]?.role ?? '—'}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  section: { marginBottom: 16 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 15, color: '#111827' },
  signOutButton: {
    marginTop: 32,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
