import React, { useMemo, useState } from 'react';
import {
    FlatList, Modal, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { useNav } from '../hooks/useNav';
import { useBillStore, usePaymentStore, useTenancyStore } from '../store';
import { formatDate, formatMonthLabel, formatPeso } from '../utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mk(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const nav = useNav();
  const bills   = useBillStore((s) => s.bills);
  const payments = usePaymentStore((s) => s.payments);
  const getTenancyById = useTenancyStore((s) => s.getTenancyById);

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Month stats map ───────────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const map: Record<string, {
      paid: number; partial: number; unpaid: number;
      totalBilled: number; totalPaid: number;
      bills: typeof bills;
    }> = {};
    bills.forEach((b) => {
      if (!map[b.month]) {
        map[b.month] = { paid:0, partial:0, unpaid:0, totalBilled:0, totalPaid:0, bills:[] };
      }
      map[b.month].bills.push(b);
      map[b.month].totalBilled += b.totalAmount;
      map[b.month].totalPaid  += b.amountPaid;
      if (b.status === 'paid')         map[b.month].paid++;
      else if (b.status === 'partial') map[b.month].partial++;
      else                             map[b.month].unpaid++;
    });
    return map;
  }, [bills]);

  // ── Payment history map: billId → payments[] ─────────────────────────────
  const paymentsByBill = useMemo(() => {
    const map: Record<string, typeof payments> = {};
    payments.forEach((p) => {
      if (!map[p.billId]) map[p.billId] = [];
      map[p.billId].push(p);
    });
    return map;
  }, [payments]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const currentMK      = mk(viewYear, viewMonth);
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const cells          = buildGrid(viewYear, viewMonth);
  const selectedStats  = selected ? monthStats[selected] : null;
  const selectedBills  = (selectedStats?.bills ?? [])
    .slice()
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));

  const yearMonths = Object.keys(monthStats)
    .filter((m) => m.startsWith(String(viewYear)))
    .sort();
  const yearBilled = yearMonths.reduce((s, m) => s + monthStats[m].totalBilled, 0);
  const yearPaid   = yearMonths.reduce((s, m) => s + monthStats[m].totalPaid,   0);

  function openMonth(monthKey: string) {
    setSelected(monthKey);
    setModalOpen(true);
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.topAccent} />
        <View style={st.headerRow}>
          <TouchableOpacity onPress={() => nav.back()} style={st.backBtn}>
            <Text style={st.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>Payment Calendar</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Month navigator ── */}
        <View style={st.navRow}>
          <TouchableOpacity onPress={prevMonth} style={st.navBtn}>
            <Text style={st.navArrow}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openMonth(currentMK)} style={st.navCenter}>
            <Text style={st.navMonth}>{MONTHS[viewMonth]}</Text>
            <Text style={st.navYear}>{viewYear}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={st.navBtn}>
            <Text style={st.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Year strip ── */}
        <View style={st.strip}>
          <StripItem label={`${viewYear} Billed`}    value={formatPeso(yearBilled)} />
          <View style={st.stripDiv} />
          <StripItem label="Collected"  value={formatPeso(yearPaid)} color={COLORS.success} />
          <View style={st.stripDiv} />
          <StripItem
            label="Outstanding"
            value={formatPeso(yearBilled - yearPaid)}
            color={yearBilled - yearPaid > 0 ? COLORS.danger : COLORS.success}
          />
        </View>

        {/* ── Calendar ── */}
        <View style={st.calCard}>
          {/* Day headers */}
          <View style={st.dayRow}>
            {DAYS.map((d) => (
              <Text key={d} style={st.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={st.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={`e${idx}`} style={st.cell} />;
              const isToday = isCurrentMonth && day === now.getDate();
              const hasBills = !!monthStats[currentMK];
              const allPaid  = hasBills && monthStats[currentMK].unpaid === 0 && monthStats[currentMK].partial === 0;
              const hasUnpaid = hasBills && (monthStats[currentMK].unpaid > 0 || monthStats[currentMK].partial > 0);
              const showDot  = day === 1 && hasBills;

              return (
                <TouchableOpacity
                  key={`d${day}`}
                  style={[st.cell, isToday && st.cellToday]}
                  onPress={() => openMonth(currentMK)}
                  activeOpacity={0.65}
                >
                  <Text style={[st.cellTxt, isToday && st.cellTxtToday]}>{day}</Text>
                  {showDot && (
                    <View style={[st.dot, { backgroundColor: allPaid ? COLORS.success : COLORS.danger }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Month tap hint */}
          {monthStats[currentMK] ? (
            <TouchableOpacity style={st.monthBar} onPress={() => openMonth(currentMK)} activeOpacity={0.75}>
              <View style={st.monthBarLeft}>
                <Text style={st.monthBarTitle}>{formatMonthLabel(currentMK)}</Text>
                <View style={st.badgeRow}>
                  {monthStats[currentMK].paid > 0 && (
                    <Badge label={`${monthStats[currentMK].paid} paid`} color={COLORS.success} bg={COLORS.successLight} />
                  )}
                  {monthStats[currentMK].partial > 0 && (
                    <Badge label={`${monthStats[currentMK].partial} partial`} color={COLORS.warning} bg={COLORS.warningLight} />
                  )}
                  {monthStats[currentMK].unpaid > 0 && (
                    <Badge label={`${monthStats[currentMK].unpaid} unpaid`} color={COLORS.danger} bg={COLORS.dangerLight} />
                  )}
                </View>
              </View>
              <View style={st.monthBarRight}>
                <Text style={st.monthBarBilled}>{formatPeso(monthStats[currentMK].totalBilled)}</Text>
                <Text style={st.monthBarPaid}>Paid {formatPeso(monthStats[currentMK].totalPaid)}</Text>
              </View>
              <Text style={st.chevron}>›</Text>
            </TouchableOpacity>
          ) : (
            <View style={st.noData}>
              <Text style={st.noDataTxt}>No bills for {MONTHS[viewMonth]} {viewYear}</Text>
            </View>
          )}
        </View>

        {/* ── All months this year ── */}
        {yearMonths.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>All months — {viewYear}</Text>
            <View style={st.yearList}>
              {yearMonths.map((m, i) => {
                const ms = monthStats[m];
                const allPaid = ms.unpaid === 0 && ms.partial === 0;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[st.yearRow, i < yearMonths.length - 1 && st.yearRowBorder]}
                    onPress={() => openMonth(m)}
                    activeOpacity={0.65}
                  >
                    <View style={[st.yearAccent, { backgroundColor: allPaid ? COLORS.success : COLORS.danger }]} />
                    <View style={st.yearInfo}>
                      <Text style={st.yearMonth}>{formatMonthLabel(m)}</Text>
                      <View style={st.badgeRow}>
                        {ms.paid > 0    && <Badge label={`${ms.paid} paid`}    color={COLORS.success} bg={COLORS.successLight} />}
                        {ms.partial > 0 && <Badge label={`${ms.partial} partial`} color={COLORS.warning} bg={COLORS.warningLight} />}
                        {ms.unpaid > 0  && <Badge label={`${ms.unpaid} unpaid`}  color={COLORS.danger}  bg={COLORS.dangerLight}  />}
                      </View>
                    </View>
                    <View style={st.yearAmts}>
                      <Text style={st.yearBilled}>{formatPeso(ms.totalBilled)}</Text>
                      <Text style={st.yearPaid}>Paid {formatPeso(ms.totalPaid)}</Text>
                    </View>
                    <Text style={st.chevron}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Month detail modal ── */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <SafeAreaView style={st.modalSafe}>
          {/* Modal header */}
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>
              {selected ? formatMonthLabel(selected) : ''}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={st.doneBtn}>
              <Text style={st.doneTxt}>Done</Text>
            </TouchableOpacity>
          </View>

          {selectedStats && (
            <>
              {/* Totals strip */}
              <View style={st.modalStrip}>
                <StripItem label="Billed"      value={formatPeso(selectedStats.totalBilled)} />
                <View style={st.stripDiv} />
                <StripItem label="Paid"        value={formatPeso(selectedStats.totalPaid)} color={COLORS.success} />
                <View style={st.stripDiv} />
                <StripItem
                  label="Outstanding"
                  value={formatPeso(selectedStats.totalBilled - selectedStats.totalPaid)}
                  color={selectedStats.totalBilled - selectedStats.totalPaid > 0 ? COLORS.danger : COLORS.success}
                />
              </View>

              <FlatList
                data={selectedBills}
                keyExtractor={(item) => item.id}
                contentContainerStyle={st.modalList}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => {
                  const tenancy  = getTenancyById(item.tenancyId);
                  const pmts     = (paymentsByBill[item.id] ?? [])
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date));
                  const elecUsed  = item.currElectricity - item.prevElectricity;
                  const waterUsed = item.currWater - item.prevWater;

                  return (
                    <View style={st.billCard}>
                      {/* Status accent */}
                      <View style={[
                        st.billAccent,
                        {
                          backgroundColor:
                            item.status === 'paid'    ? COLORS.success
                            : item.status === 'partial' ? COLORS.warning
                            : COLORS.danger,
                        },
                      ]} />

                      <View style={st.billBody}>
                        {/* Top */}
                        <View style={st.billTop}>
                          <View>
                            <Text style={st.billRoom}>Room {item.roomNumber}</Text>
                            <Text style={st.billTenant}>{tenancy?.tenantName ?? '—'}</Text>
                          </View>
                          <View style={st.billTopRight}>
                            <Badge
                              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              color={item.status === 'paid' ? COLORS.success : item.status === 'partial' ? COLORS.warning : COLORS.danger}
                              bg={item.status === 'paid' ? COLORS.successLight : item.status === 'partial' ? COLORS.warningLight : COLORS.dangerLight}
                            />
                            <Text style={st.billTotal}>{formatPeso(item.totalAmount)}</Text>
                          </View>
                        </View>

                        {/* Bill breakdown */}
                        <View style={st.breakdown}>
                          <BLine label="Rent"                                  value={formatPeso(item.rentAmount)} />
                          <BLine label={`Electricity  ${item.prevElectricity}→${item.currElectricity} kWh (${elecUsed} × ₱${item.electricityRate})`} value={formatPeso(item.electricityCost)} />
                          <BLine label={`Water  ${item.prevWater}→${item.currWater} units (${waterUsed} × ₱${item.waterRate})`} value={formatPeso(item.waterCost)} />
                        </View>

                        {/* Payment history */}
                        <View style={st.pmtSection}>
                          <Text style={st.pmtTitle}>Payment history</Text>
                          {pmts.length === 0 ? (
                            <Text style={st.pmtNone}>No payments recorded yet</Text>
                          ) : (
                            pmts.map((p) => (
                              <View key={p.id} style={st.pmtRow}>
                                <View style={st.pmtDot} />
                                <View style={st.pmtInfo}>
                                  <Text style={st.pmtDate}>{formatDate(p.date)}</Text>
                                  {p.note ? <Text style={st.pmtNote}>{p.note}</Text> : null}
                                </View>
                                <Text style={st.pmtAmt}>{formatPeso(p.amount)}</Text>
                              </View>
                            ))
                          )}
                        </View>

                        {/* Balance */}
                        <View style={st.balRow}>
                          <Text style={st.balLabel}>Balance</Text>
                          <Text style={[st.balValue, { color: item.balance > 0 ? COLORS.danger : COLORS.success }]}>
                            {formatPeso(item.balance)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={st.modalEmpty}>
                    <Text style={st.modalEmptyTxt}>No bills for this month.</Text>
                  </View>
                }
              />
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function StripItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={sc.stripItem}>
      <Text style={sc.stripLabel}>{label}</Text>
      <Text style={[sc.stripValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  stripItem: { flex: 1, alignItems: 'center', gap: 3 },
  stripLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' },
  stripValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
});

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[bc.wrap, { backgroundColor: bg }]}>
      <Text style={[bc.txt, { color }]}>{label}</Text>
    </View>
  );
}
const bc = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  txt: { fontSize: 11, fontWeight: '700' },
});

function BLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={bl.row}>
      <Text style={bl.label} numberOfLines={1}>{label}</Text>
      <Text style={bl.value}>{value}</Text>
    </View>
  );
}
const bl = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  label: { fontSize: 12, color: COLORS.textSecondary, flex: 1, paddingRight: 8 },
  value: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
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

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { fontSize: 22, color: COLORS.textPrimary, fontWeight: '700' },
  navCenter: { alignItems: 'center', gap: 1 },
  navMonth: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  navYear: { fontSize: 12, color: COLORS.textMuted },

  strip: {
    flexDirection: 'row', backgroundColor: COLORS.primary,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  stripDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  calCard: {
    backgroundColor: COLORS.surface, margin: 16, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  dayRow: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 14, paddingBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 8 },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  cellToday: { backgroundColor: COLORS.primary, borderRadius: 10 },
  cellTxt: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  cellTxtToday: { color: '#fff', fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 3 },

  monthBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  monthBarLeft: { flex: 1, gap: 5 },
  monthBarTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  monthBarRight: { alignItems: 'flex-end', gap: 2 },
  monthBarBilled: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  monthBarPaid: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  chevron: { fontSize: 20, color: COLORS.textMuted },
  noData: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.divider },
  noDataTxt: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  section: { paddingHorizontal: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  yearList: {
    backgroundColor: COLORS.surface, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  yearRow: { flexDirection: 'row', alignItems: 'center' },
  yearRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  yearAccent: { width: 4, alignSelf: 'stretch' },
  yearInfo: { flex: 1, padding: 14, gap: 5 },
  yearMonth: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  yearAmts: { alignItems: 'flex-end', paddingRight: 4, gap: 2 },
  yearBilled: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  yearPaid: { fontSize: 11, color: COLORS.success, fontWeight: '600' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  doneBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  doneTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modalStrip: {
    flexDirection: 'row', backgroundColor: COLORS.primary,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  modalList: { padding: 16 },
  modalEmpty: { padding: 32, alignItems: 'center' },
  modalEmptyTxt: { fontSize: 14, color: COLORS.textMuted },

  billCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  billAccent: { width: 4 },
  billBody: { flex: 1, padding: 14, gap: 12 },
  billTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  billRoom: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  billTenant: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  billTopRight: { alignItems: 'flex-end', gap: 5 },
  billTotal: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  breakdown: { gap: 0 },

  // Payment history
  pmtSection: { gap: 8 },
  pmtTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  pmtNone: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  pmtRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pmtDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.success, marginTop: 4,
  },
  pmtInfo: { flex: 1, gap: 1 },
  pmtDate: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  pmtNote: { fontSize: 11, color: COLORS.textMuted },
  pmtAmt: { fontSize: 14, fontWeight: '800', color: COLORS.success },

  balRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1.5, borderTopColor: COLORS.border,
  },
  balLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  balValue: { fontSize: 16, fontWeight: '800' },
});
