import React, { useState } from 'react';
import {
    FlatList, Modal,
    ScrollView, Share,
    StyleSheet, Text, TextInput,
    TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants';
import { useNav } from '../src/hooks/useNav';
import type { MonthlyBill } from '../src/types';
import { formatDate, formatMonthLabel, formatPeso, generateId, todayISO } from '../src/utils';
import { useBillStore, usePaymentStore, useTenancyStore } from '../src/store';

type Filter = 'all' | 'unpaid' | 'partial' | 'paid';

const TABS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'unpaid',  label: 'Unpaid'  },
  { key: 'partial', label: 'Partial' },
  { key: 'paid',    label: 'Paid'    },
];

// ─── Receipt builder ──────────────────────────────────────────────────────────
function buildReceipt(
  bill: MonthlyBill,
  tenantName: string,
  tenantPhone: string,
  payments: { date: string; amount: number; note?: string }[],
): string {
  const line = '─'.repeat(38);
  const pad  = (l: string, r: string, w = 38) =>
    l + ' '.repeat(Math.max(1, w - l.length - r.length)) + r;

  const elecUsed  = bill.currElectricity - bill.prevElectricity;
  const waterUsed = bill.currWater - bill.prevWater;

  let t = '';
  t += '       SOCOBOS BOARDING HOUSE\n';
  t += '           Official Receipt\n';
  t += `${line}\n`;
  t += `Tenant : ${tenantName}\n`;
  t += `Phone  : ${tenantPhone}\n`;
  t += `Room   : ${bill.roomNumber}\n`;
  t += `Month  : ${formatMonthLabel(bill.month)}\n`;
  t += `Due    : ${formatDate(bill.dueDate)}\n`;
  t += `${line}\n`;
  t += 'BILL BREAKDOWN\n';
  t += pad('  Room Rent',                          formatPeso(bill.rentAmount))      + '\n';
  t += pad(`  Electricity (${elecUsed} kWh × ₱${bill.electricityRate})`, formatPeso(bill.electricityCost)) + '\n';
  t += pad(`  Water (${waterUsed} kWh × ₱${bill.waterRate})`,            formatPeso(bill.waterCost))       + '\n';
  t += `${line}\n`;
  t += pad('TOTAL BILL',                           formatPeso(bill.totalAmount))     + '\n';
  t += `${line}\n`;
  if (payments.length > 0) {
    t += 'PAYMENT HISTORY\n';
    payments.forEach((p) => {
      t += pad(`  ${formatDate(p.date)}`, formatPeso(p.amount)) + '\n';
      if (p.note) t += `    Note: ${p.note}\n`;
    });
    t += `${line}\n`;
  }
  t += pad('AMOUNT PAID',    formatPeso(bill.amountPaid))                            + '\n';
  t += pad('BALANCE',        formatPeso(bill.balance))                               + '\n';
  t += `${line}\n`;
  const statusLabel = bill.status === 'paid' ? '✓ FULLY PAID' : bill.status === 'partial' ? '◑ PARTIALLY PAID' : '✗ UNPAID';
  t += `STATUS: ${statusLabel}\n`;
  t += `${line}\n`;
  t += `Generated: ${formatDate(todayISO())}\n`;
  t += 'Thank you for your payment!\n';
  return t;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PaymentsScreen() {
  const nav = useNav();
  const bills            = useBillStore((s) => s.bills);
  const recordPayment    = useBillStore((s) => s.recordPayment);
  const getTenancyById   = useTenancyStore((s) => s.getTenancyById);
  const addPaymentRecord = usePaymentStore((s) => s.addPayment);
  const payments         = usePaymentStore((s) => s.payments);

  const [filter,       setFilter]       = useState<Filter>('all');
  const [search,       setSearch]       = useState('');
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [payAmount,    setPayAmount]    = useState('');
  const [payError,     setPayError]     = useState('');
  const [paying,       setPaying]       = useState(false);

  const filtered = bills
    .filter((b) => {
      const matchFilter = filter === 'all' || b.status === filter;
      const matchSearch =
        b.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
        (getTenancyById(b.tenancyId)?.tenantName ?? '')
          .toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

  // Payments for the selected bill
  const billPayments = selectedBill
    ? payments
        .filter((p) => p.billId === selectedBill.id)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  // Live bill data (updates after recording payment)
  const liveBill = selectedBill
    ? bills.find((b) => b.id === selectedBill.id) ?? selectedBill
    : null;

  async function handleRecordPayment() {
    if (!liveBill) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { setPayError('Enter a valid amount.'); return; }
    if (amount > liveBill.balance) {
      setPayError(`Cannot exceed balance of ${formatPeso(liveBill.balance)}.`);
      return;
    }
    setPayError('');
    const tenancy = getTenancyById(liveBill.tenancyId);
    await recordPayment(liveBill.id, amount);
    await addPaymentRecord({
      id: generateId(),
      billId: liveBill.id,
      tenancyId: liveBill.tenancyId,
      roomNumber: liveBill.roomNumber,
      tenantName: tenancy?.tenantName ?? '',
      amount,
      date: todayISO(),
    });
    setPayAmount('');
    setPaying(false);
  }

  async function handleShare() {
    if (!liveBill) return;
    const tenancy  = getTenancyById(liveBill.tenancyId);
    const receipt  = buildReceipt(
      liveBill,
      tenancy?.tenantName  ?? '—',
      tenancy?.tenantPhone ?? '—',
      billPayments,
    );
    try {
      await Share.share({ message: receipt, title: `Receipt – Room ${liveBill.roomNumber}` });
    } catch { /* user cancelled */ }
  }

  function statusColor(status: string) {
    return status === 'paid' ? COLORS.success : status === 'partial' ? COLORS.warning : COLORS.danger;
  }
  function statusBg(status: string) {
    return status === 'paid' ? COLORS.successLight : status === 'partial' ? COLORS.warningLight : COLORS.dangerLight;
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
          <Text style={st.headerTitle}>Payments</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Search */}
        <View style={st.searchWrap}>
          <TextInput
            style={st.searchInput}
            placeholder="Search room or tenant..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter tabs */}
        <View style={st.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[st.tab, filter === t.key && st.tabActive]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[st.tabTxt, filter === t.key && st.tabTxtActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bill list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={st.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const tenancy = getTenancyById(item.tenancyId);
          return (
            <TouchableOpacity
              style={st.card}
              onPress={() => { setSelectedBill(item); setPayAmount(''); setPayError(''); setPaying(false); }}
              activeOpacity={0.75}
            >
              {/* Status accent bar */}
              <View style={[st.cardAccent, { backgroundColor: statusColor(item.status) }]} />

              <View style={st.cardBody}>
                <View style={st.cardTop}>
                  <View style={st.cardLeft}>
                    <Text style={st.roomNum}>Room {item.roomNumber}</Text>
                    <Text style={st.tenantName}>{tenancy?.tenantName ?? '—'}</Text>
                    <Text style={st.monthLbl}>{formatMonthLabel(item.month)}</Text>
                  </View>
                  <View style={st.cardRight}>
                    <View style={[st.statusPill, { backgroundColor: statusBg(item.status) }]}>
                      <Text style={[st.statusTxt, { color: statusColor(item.status) }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={st.totalAmt}>{formatPeso(item.totalAmount)}</Text>
                    <Text style={[st.balance, { color: item.balance > 0 ? COLORS.danger : COLORS.success }]}>
                      Balance {formatPeso(item.balance)}
                    </Text>
                  </View>
                </View>
                <Text style={st.tapHint}>Tap to view details & receipt →</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={st.empty}>
            <Text style={st.emptyIcon}>💳</Text>
            <Text style={st.emptyTitle}>No bills found</Text>
            <Text style={st.emptySub}>Generate bills from the Billing screen</Text>
          </View>
        }
      />

      {/* ── Bill detail modal ── */}
      <Modal
        visible={!!selectedBill}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBill(null)}
      >
        {liveBill && (() => {
          const tenancy   = getTenancyById(liveBill.tenancyId);
          const elecUsed  = liveBill.currElectricity - liveBill.prevElectricity;
          const waterUsed = liveBill.currWater - liveBill.prevWater;

          return (
            <SafeAreaView style={st.modalSafe}>
              {/* Modal header */}
              <View style={st.modalHeader}>
                <View>
                  <Text style={st.modalTitle}>Room {liveBill.roomNumber}</Text>
                  <Text style={st.modalSub}>{formatMonthLabel(liveBill.month)}</Text>
                </View>
                <View style={st.modalHeaderRight}>
                  <TouchableOpacity style={st.shareBtn} onPress={handleShare}>
                    <Text style={st.shareBtnTxt}>📤 Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.doneBtn} onPress={() => setSelectedBill(null)}>
                    <Text style={st.doneTxt}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView contentContainerStyle={st.modalScroll} showsVerticalScrollIndicator={false}>

                {/* ── Tenant info ── */}
                <View style={st.section}>
                  <View style={st.tenantCard}>
                    <View style={st.tenantAvatar}>
                      <Text style={st.tenantAvatarTxt}>
                        {(tenancy?.tenantName ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={st.tenantInfo}>
                      <Text style={st.tenantNameLg}>{tenancy?.tenantName ?? '—'}</Text>
                      <Text style={st.tenantPhone}>{tenancy?.tenantPhone ?? '—'}</Text>
                    </View>
                    <View style={[st.statusPill, { backgroundColor: statusBg(liveBill.status) }]}>
                      <Text style={[st.statusTxt, { color: statusColor(liveBill.status) }]}>
                        {liveBill.status.charAt(0).toUpperCase() + liveBill.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── Bill breakdown ── */}
                <View style={st.section}>
                  <Text style={st.sectionLabel}>Bill Breakdown</Text>
                  <View style={st.breakdownCard}>
                    <BRow label="Room Rent"                                          value={formatPeso(liveBill.rentAmount)} />
                    <BRow label={`Electricity  ${liveBill.prevElectricity}→${liveBill.currElectricity} kWh (${elecUsed} × ₱${liveBill.electricityRate})`} value={formatPeso(liveBill.electricityCost)} />
                    <BRow label={`Water  ${liveBill.prevWater}→${liveBill.currWater} kWh (${waterUsed} × ₱${liveBill.waterRate})`}                        value={formatPeso(liveBill.waterCost)} />
                    <View style={st.breakdownDivider} />
                    <BRow label="Total Bill"   value={formatPeso(liveBill.totalAmount)} bold />
                    <BRow label="Amount Paid"  value={formatPeso(liveBill.amountPaid)}  color={COLORS.success} />
                    <BRow label="Balance"      value={formatPeso(liveBill.balance)}     color={liveBill.balance > 0 ? COLORS.danger : COLORS.success} bold />
                  </View>
                </View>

                {/* ── Payment history ── */}
                <View style={st.section}>
                  <Text style={st.sectionLabel}>Payment History</Text>
                  <View style={st.historyCard}>
                    {billPayments.length === 0 ? (
                      <Text style={st.noPayments}>No payments recorded yet.</Text>
                    ) : (
                      billPayments.map((p, i) => (
                        <View key={p.id} style={[st.pmtRow, i < billPayments.length - 1 && st.pmtRowBorder]}>
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
                </View>

                {/* ── Record payment ── */}
                {liveBill.status !== 'paid' && (
                  <View style={st.section}>
                    <Text style={st.sectionLabel}>Record Payment</Text>
                    <View style={st.payCard}>
                      {paying ? (
                        <>
                          <Text style={st.payCardHint}>
                            Balance: <Text style={{ color: COLORS.danger, fontWeight: '700' }}>{formatPeso(liveBill.balance)}</Text>
                          </Text>
                          <TextInput
                            style={st.payInput}
                            placeholder={`Amount (max ${formatPeso(liveBill.balance)})`}
                            placeholderTextColor={COLORS.textMuted}
                            value={payAmount}
                            onChangeText={(v) => { setPayAmount(v); setPayError(''); }}
                            keyboardType="decimal-pad"
                            autoFocus
                          />
                          {payError ? <Text style={st.payErr}>{payError}</Text> : null}
                          <View style={st.payBtns}>
                            <TouchableOpacity style={st.confirmBtn} onPress={handleRecordPayment}>
                              <Text style={st.confirmTxt}>Confirm Payment</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={st.cancelBtn} onPress={() => { setPaying(false); setPayAmount(''); setPayError(''); }}>
                              <Text style={st.cancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <TouchableOpacity style={st.recordBtn} onPress={() => setPaying(true)} activeOpacity={0.8}>
                          <Text style={st.recordTxt}>+ Record Payment</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* ── Share receipt ── */}
                <TouchableOpacity style={st.shareFullBtn} onPress={handleShare} activeOpacity={0.85}>
                  <Text style={st.shareFullIcon}>📤</Text>
                  <Text style={st.shareFullTxt}>Share Receipt</Text>
                </TouchableOpacity>

                <View style={{ height: 32 }} />
              </ScrollView>
            </SafeAreaView>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

// ─── Breakdown row ────────────────────────────────────────────────────────────
function BRow({ label, value, bold, color }: {
  label: string; value: string; bold?: boolean; color?: string;
}) {
  return (
    <View style={br.row}>
      <Text style={br.label} numberOfLines={2}>{label}</Text>
      <Text style={[br.value, bold && br.bold, color ? { color } : null]}>{value}</Text>
    </View>
  );
}
const br = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  label: { fontSize: 12, color: COLORS.textSecondary, flex: 1, paddingRight: 8, lineHeight: 18 },
  value: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  bold: { fontWeight: '800', fontSize: 14 },
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
  searchWrap: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: { paddingVertical: 10, fontSize: 14, color: '#fff' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)' },
  tabActive: { backgroundColor: COLORS.accent },
  tabTxt: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabTxtActive: { color: COLORS.primary },

  list: { padding: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { gap: 3 },
  roomNum: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  tenantName: { fontSize: 13, color: COLORS.textSecondary },
  monthLbl: { fontSize: 11, color: COLORS.textMuted },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  totalAmt: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  balance: { fontSize: 12, fontWeight: '600' },
  tapHint: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textMuted },

  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  modalSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  modalHeaderRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  shareBtn: {
    backgroundColor: COLORS.accentLight, paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.accent,
  },
  shareBtnTxt: { fontSize: 12, fontWeight: '700', color: COLORS.accentDark },
  doneBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  doneTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  modalScroll: { padding: 16, gap: 0 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },

  tenantCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  tenantAvatar: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  tenantAvatarTxt: { fontSize: 20, fontWeight: '800', color: COLORS.accent },
  tenantInfo: { flex: 1, gap: 2 },
  tenantNameLg: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  tenantPhone: { fontSize: 12, color: COLORS.textSecondary },

  breakdownCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  breakdownDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },

  historyCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  noPayments: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 8 },
  pmtRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  pmtRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  pmtDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  pmtInfo: { flex: 1, gap: 1 },
  pmtDate: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  pmtNote: { fontSize: 11, color: COLORS.textMuted },
  pmtAmt: { fontSize: 15, fontWeight: '800', color: COLORS.success },

  payCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  payCardHint: { fontSize: 13, color: COLORS.textSecondary },
  payInput: {
    backgroundColor: COLORS.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    borderWidth: 1.5, borderColor: COLORS.border, color: COLORS.textPrimary,
  },
  payErr: { fontSize: 12, color: COLORS.danger },
  payBtns: { flexDirection: 'row', gap: 10 },
  confirmBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  confirmTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    paddingHorizontal: 18, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, color: COLORS.textSecondary },
  recordBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  recordTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  shareFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 16, marginBottom: 4,
  },
  shareFullIcon: { fontSize: 18 },
  shareFullTxt: { fontSize: 15, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3 },
});
