import React, { useState } from 'react';
import {
    FlatList, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useNav } from '../hooks/useNav';
import { useRoomStore, useTenancyStore } from '../store';
import { formatPeso } from '../utils';

export default function RoomsScreen() {
  const nav = useNav();
  const rooms = useRoomStore((s) => s.rooms);
  const getActiveTenancyByRoom = useTenancyStore((s) => s.getActiveTenancyByRoom);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant'>('all');

  const filtered = rooms
    .filter((r) => {
      const matchSearch = r.number.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || r.status === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === 'occupied').length;
  const vacantCount = rooms.filter((r) => r.status === 'vacant').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topAccent} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rooms</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => nav.push('/rooms/add' as any, 'Opening add room...')}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: totalRooms },
            { label: 'Occupied', value: occupiedCount },
            { label: 'Vacant', value: vacantCount },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < 2 && styles.statItemBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search room number..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['all', 'occupied', 'vacant'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const tenancy = getActiveTenancyByRoom(item.id);
          const isOccupied = item.status === 'occupied';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.push(`/rooms/${item.id}` as any, `Opening Room ${item.number}...`)}
              activeOpacity={0.75}
            >
              {/* Left accent bar */}
              <View style={[styles.cardAccent, { backgroundColor: isOccupied ? COLORS.accent : COLORS.border }]} />

              {/* Room number badge */}
              <View style={[styles.roomBadge, { backgroundColor: isOccupied ? COLORS.primary : COLORS.background }]}>
                <Text style={[styles.roomBadgeText, { color: isOccupied ? '#fff' : COLORS.textMuted }]}>
                  {item.number}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.roomNumber}>Room {item.number}</Text>
                <Text style={isOccupied ? styles.tenantName : styles.vacantHint}>
                  {isOccupied && tenancy ? tenancy.tenantName : 'Available'}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: isOccupied ? '#E8F5E9' : COLORS.background }]}>
                  <View style={[styles.statusDot, { backgroundColor: isOccupied ? COLORS.success : COLORS.textMuted }]} />
                  <Text style={[styles.statusText, { color: isOccupied ? COLORS.success : COLORS.textMuted }]}>
                    {isOccupied ? 'Occupied' : 'Vacant'}
                  </Text>
                </View>
              </View>

              {/* Rent */}
              <View style={styles.cardRight}>
                <Text style={styles.rentAmount}>{formatPeso(item.monthlyRent)}</Text>
                <Text style={styles.rentLabel}>/ month</Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚪</Text>
            <Text style={styles.emptyTitle}>
              {search || filter !== 'all' ? 'No rooms match' : 'No rooms yet'}
            </Text>
            <Text style={styles.emptySub}>
              {!search && filter === 'all' ? 'Tap "+ Add" to add your first room' : 'Try a different filter'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary },
  topAccent: { height: 3, backgroundColor: COLORS.accent },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  addBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 8,
  },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 20,
    paddingBottom: 16, gap: 0,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statItemBorder: {
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: {
    flex: 1, paddingVertical: 10, fontSize: 14,
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: { backgroundColor: COLORS.accent },
  filterText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  filterTextActive: { color: COLORS.primary },
  list: { padding: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  roomBadge: {
    width: 44, height: 44, borderRadius: 10, margin: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  roomBadgeText: { fontSize: 14, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 4, paddingVertical: 14 },
  roomNumber: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  tenantName: { fontSize: 12, color: COLORS.textSecondary },
  vacantHint: { fontSize: 12, color: COLORS.textMuted },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', gap: 2, paddingRight: 4 },
  rentAmount: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  rentLabel: { fontSize: 10, color: COLORS.textMuted },
  chevron: { fontSize: 20, color: COLORS.textMuted, paddingRight: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textMuted },
});
