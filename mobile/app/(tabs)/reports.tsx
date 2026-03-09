import { View, Text, StyleSheet } from 'react-native';

// Phase 4: charts and summaries from sheet data
export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.note}>Phase 4: lead charts and status summaries.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  note: { color: '#6B7280', fontSize: 14 },
});
