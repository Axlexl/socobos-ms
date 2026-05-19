import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants';
import { useNav } from '../src/hooks/useNav';
import { formatPeso } from '../src/utils';
import { useBillStore, useRoomStore } from '../src/store';

// ── Menu items ────────────────────────────────────────────────────────────────
const MENU = [
  { label: 'Rooms',        sub: 'Manage rooms',       route: '/rooms',        color: '#1A1F36', icon: '🚪' },
  { label: 'Add Room',     sub: 'New room',            route: '/rooms/add',    color: '#16A34A', icon: '＋' },
  { label: 'Billing',      sub: 'Monthly bills',       route: '/billing',      color: '#C9A84C', icon: '🧾' },
  { label: 'Payments',     sub: 'Record payments',     route: '/payments',     color: '#7C3AED', icon: '💳' },
  { label: 'Calendar',     sub: 'Payment overview',    route: '/calendar',     color: '#0891B2', icon: '📅' },
  { label: 'Past Records', sub: 'Tenant history',      route: '/past-records', color: '#DC2626', icon: '📋' },
  { label: 'Rates',        sub: 'Utility rates',       route: '/rates',        color: '#EA580C', icon: '⚡' },
] as const;

export default function HomeScreen() {
  const nav = useNav();
  const rooms = useRoomStore((s) => s.rooms);
  const bills = useBillStore((s) => s.bills);

  const totalRooms   = rooms.length;
  const occupied     = rooms.filter((r) => r.status === 'occupied').length;
  const vacant       = rooms.filter((r) => r.status === 'vacant').length;
  const unpaidBills  = bills.filter((b) => b.status === 'unpaid' || b.status === 'partial');
  const unpaidCount  = unpaidBills.length;
  const unpaidAmount = unpaidBills.reduce((s, b) => s + b.balance, 0);
  const totalIncome  = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.totalAmount, 0);
  const pct          = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // Split menu into pairs for 2-col grid
  const rows: (typeof MENU[number])[][] = [];
  for (let i = 0; i < MENU.length; i += 2) {
    rows.push(MENU.slice(i, i + 2) as any);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.topAccent} />
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>Good day</Text>
            <Text style={s.date}>{today}</Text>
          </View>
          <TouchableOpacity
            onPress={() => nav.push('/profile' as any, 'Opening profile...')}
            style={s.avatarBtn}
          >
            <Text style={s.avatarTxt}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Occupancy card ── */}
        <View style={s.occCard}>
          <View style={s.occLeft}>
            <Text style={s.occTag}>OCCUPANCY</Text>
            <Text style={s.occNum}>
              {pct}<Text style={s.occPct}>%</Text>
            </Text>
            <Text style={s.occSub}>{occupied} of {totalRooms} rooms</Text>
          </View>
          <View style={s.occRight}>
            <View style={s.occBar}>
              <View style={[s.occFill, { width: `${pct}%` as any }]} />
            </View>
            <View style={s.occLegend}>
              <View style={s.legRow}>
                <View style={[s.legDot, { backgroundColor: COLORS.accent }]} />
                <Text style={s.legTxt}>{occupied} occupied</Text>
              </View>
              <View style={s.legRow}>
                <View style={[s.legDot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <Text style={s.legTxt}>{vacant} vacant</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Finance strip ── */}
        <View style={s.finStrip}>
          <View style={s.finItem}>
            <Text style={s.finLabel}>Collected</Text>
            <Text style={s.finVal}>{formatPeso(totalIncome)}</Text>
          </View>
          <View style={s.finDiv} />
          <View style={s.finItem}>
            <Text style={s.finLabel}>Outstanding</Text>
            <Text style={[s.finVal, { color: unpaidAmount > 0 ? COLORS.danger : COLORS.success }]}>
              {formatPeso(unpaidAmount)}
            </Text>
          </View>
          <View style={s.finDiv} />
          <View style={s.finItem}>
            <Text style={s.finLabel}>Unpaid</Text>
            <Text style={[s.finVal, { color: unpaidCount > 0 ? COLORS.danger : COLORS.success }]}>
              {unpaidCount} bills
            </Text>
          </View>
        </View>

        {/* ── Menu grid ── */}
        <View style={s.menuSection}>
          <Text style={s.menuTitle}>Menu</Text>
          <View style={s.grid}>
            {MENU.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={s.menuCard}
                onPress={() => nav.push(item.route as any, `Opening ${item.label}...`)}
                activeOpacity={0.75}
              >
                {/* Top color band */}
                <View style={[s.cardBand, { backgroundColor: item.color }]}>
                  <Text style={s.cardIcon}>{item.icon}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardLabel}>{item.label}</Text>
                  <Text style={s.cardSub}>{item.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: { backgroundColor: COLORS.primary },
  topAccent: { height: 3, backgroundColor: COLORS.accent },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: COLORS.primary },

  scroll: { padding: 16, gap: 16, paddingBottom: 32 },

  // Occupancy
  occCard: {
    backgroundColor: COLORS.primary, borderRadius: 18, padding: 20,
    flexDirection: 'row', gap: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  occLeft: { gap: 4 },
  occTag: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  occNum: { fontSize: 52, fontWeight: '800', color: '#fff', lineHeight: 60 },
  occPct: { fontSize: 22, fontWeight: '600', color: COLORS.accent },
  occSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  occRight: { flex: 1, justifyContent: 'center', gap: 14 },
  occBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' },
  occFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 99 },
  occLegend: { gap: 8 },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legDot: { width: 7, height: 7, borderRadius: 4 },
  legTxt: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // Finance strip
  finStrip: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  finItem: { flex: 1, alignItems: 'center', gap: 4 },
  finDiv: { width: 1, backgroundColor: COLORS.divider },
  finLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  finVal: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },

  // Menu grid
  menuSection: { gap: 12 },
  menuTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', paddingLeft: 2,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  menuCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden',
    width: '47.5%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardBand: {
    height: 80, alignItems: 'center', justifyContent: 'center',
  },
  cardIcon: { fontSize: 32 },
  cardBody: { padding: 12, gap: 2 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: 11, color: COLORS.textMuted },
});
