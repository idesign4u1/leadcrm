import { View, Text, StyleSheet } from 'react-native';

// Phase 2: will fetch dynamic headers + rows from Google Sheets
export default function LeadsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leads</Text>
      <Text style={styles.note}>Phase 2: connect Google Sheet and render leads.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  note: { color: '#6B7280', fontSize: 14 },
});
