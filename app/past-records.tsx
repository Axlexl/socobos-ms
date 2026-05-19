import React, { useState } from 'react';
import {
    FlatList, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useNav } from '../hooks/useNav';
import { useBillStore, useTenancyStore } from '../store';
import { formatDate, formatPeso } from '../utils';

export default function PastRecordsScreen() {
  const nav = useNav();
  const getAllPastTenancies = useTenancyStore((s) => s.getAllPastTenancies);
  const getBillsByTenancy = useBillStore((s) => s.getBillsByTenancy);
  const [search, setSearch] = useState('');

  const past = getAllPastTenancies().sort(
    (a, b) => (b.moveOutDate ?? '').localeCompare(a.moveOutDate ?? ''),
  );

  const filtered = past.filter(
    (t) =>
      t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      t.roomNumber.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Records</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or room..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={styles.listHeader}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const bills = getBillsByTenancy(item.id);
          const totalBilled = bills.reduce((s, b) => s + b.totalAmount, 0);
          const totalPaid = bills.reduce((s, b) => s + b.amountPaid, 0);
          const outstanding = totalBilled - totalPaid;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                nav.push(`/past-records/${item.id}` as any, 'Opening record...')
              }
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.tenantName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.tenantName}</Text>
                  <View style={styles.leftBadge}>
                    <Text style={styles.leftText}>MOVED OUT</Text>
                  </View>
                </View>
                <Text style={styles.room}>Room {item.roomNumber}</Text>
                <Text style={styles.dates}>
                  {formatDate(item.moveInDate)} → {item.moveOutDate ? formatDate(item.moveOutDate) : '—'}
                </Text>
                <View style={styles.amtRow}>
                  <Text style={styles.amtLabel}>Paid: </Text>
                  <Text style={[styles.amtValue, { color: COLORS.success }]}>
                    {formatPeso(totalPaid)}
                  </Text>
                  {outstanding > 0 && (
                    <>
                      <Text style={styles.amtLabel}>  Owed: </Text>
                      <Text style={[styles.amtValue, { color: COLORS.danger }]}>
                        {formatPeso(outstanding)}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {search ? 'No records match your search' : 'No past records yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!search ? 'Records appear here when a tenant moves out' : ''}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#fff' },
  searchWrap: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary,
  },
  list: { padding: 16, flexGrow: 1 },
  listHeader: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10, fontWeight: '500' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  info: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flexShrink: 1 },
  leftBadge: {
    backgroundColor: '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
  },
  leftText: { fontSize: 10, fontWeight: '700', color: COLORS.danger },
  room: { fontSize: 13, color: COLORS.textSecondary },
  dates: { fontSize: 11, color: COLORS.textMuted },
  amtRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  amtLabel: { fontSize: 12, color: COLORS.textMuted },
  amtValue: { fontSize: 12, fontWeight: '700' },
  chevron: { fontSize: 22, color: COLORS.textMuted, marginTop: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 260 },
});
