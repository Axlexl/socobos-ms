import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants';
import { useNav } from '../src/hooks/useNav';
import { formatMonthLabel, formatPeso } from '../src/utils';
import { useBillStore, useRoomStore, useTenancyStore } from '../src/store';

export default function BillingScreen() {
  const nav = useNav();
  const rooms = useRoomStore((s) => s.rooms);
  const getActiveTenancyByRoom = useTenancyStore((s) => s.getActiveTenancyByRoom);
  const getLatestBillByTenancy = useBillStore((s) => s.getLatestBillByTenancy);

  const occupiedRooms = rooms
    .filter((r) => r.status === 'occupied')
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={occupiedRooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          occupiedRooms.length > 0 ? (
            <Text style={styles.listHeader}>
              {occupiedRooms.length} occupied room{occupiedRooms.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const tenancy = getActiveTenancyByRoom(item.id);
          const bill = tenancy ? getLatestBillByTenancy(tenancy.id) : undefined;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                tenancy
                  ? nav.push(
                      `/billing/generate?tenancyId=${tenancy.id}` as any,
                      'Opening billing...',
                    )
                  : null
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.roomNumber}>Room {item.number}</Text>
                {tenancy && <Text style={styles.tenantName}>{tenancy.tenantName}</Text>}
                {bill
                  ? <Text style={styles.monthLabel}>{formatMonthLabel(bill.month)}</Text>
                  : <Text style={styles.noBillHint}>Tap to generate first bill</Text>
                }
              </View>

              <View style={styles.cardRight}>
                {bill ? (
                  <>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          bill.status === 'paid' ? '#DCFCE7'
                          : bill.status === 'partial' ? '#FEF3C7'
                          : '#FEE2E2',
                      },
                    ]}>
                      <Text style={[
                        styles.statusText,
                        {
                          color:
                            bill.status === 'paid' ? COLORS.paid
                            : bill.status === 'partial' ? COLORS.partial
                            : COLORS.unpaid,
                        },
                      ]}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.balance,
                      { color: bill.balance > 0 ? COLORS.danger : COLORS.success },
                    ]}>
                      {formatPeso(bill.balance)}
                    </Text>
                  </>
                ) : (
                  <View style={styles.generateBadge}>
                    <Text style={styles.generateText}>Generate →</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>No occupied rooms</Text>
            <Text style={styles.emptySubtext}>Assign tenants to rooms first</Text>
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
  list: { padding: 16, flexGrow: 1 },
  listHeader: {
    fontSize: 13, color: COLORS.textMuted, marginBottom: 10, fontWeight: '500',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { flex: 1, gap: 3 },
  roomNumber: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  tenantName: { fontSize: 13, color: COLORS.textSecondary },
  monthLabel: { fontSize: 11, color: COLORS.textMuted },
  noBillHint: { fontSize: 11, color: COLORS.primary, fontStyle: 'italic' },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: '600' },
  balance: { fontSize: 15, fontWeight: '700' },
  generateBadge: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  generateText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary },
});
