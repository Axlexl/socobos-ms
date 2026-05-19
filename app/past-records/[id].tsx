import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView, Share,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { useNav } from '../../hooks/useNav';
import { useBillStore, useTenancyStore } from '../../store';
import { formatDate, formatMonthLabel, formatPeso } from '../../utils';

export default function PastRecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNav();
  const getTenancyById = useTenancyStore((s) => s.getTenancyById);
  const getBillsByTenancy = useBillStore((s) => s.getBillsByTenancy);

  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  const tenancy = getTenancyById(id);
  const bills = tenancy
    ? getBillsByTenancy(tenancy.id).sort((a, b) => a.month.localeCompare(b.month))
    : [];

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalRent       = bills.reduce((s, b) => s + b.rentAmount, 0);
  const totalElec       = bills.reduce((s, b) => s + b.electricityCost, 0);
  const totalWater      = bills.reduce((s, b) => s + b.waterCost, 0);
  const totalBilled     = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid       = bills.reduce((s, b) => s + b.amountPaid, 0);
  const outstanding     = totalBilled - totalPaid;
  const initialPayments = tenancy ? tenancy.securityDeposit + tenancy.advancePayment : 0;
  const grandTotal      = totalBilled + initialPayments;

  // ── Share / Print receipt ───────────────────────────────────────────────────
  function buildReceipt(): string {
    if (!tenancy) return '';
    const line = '─'.repeat(36);
    const pad  = (l: string, r: string, w = 36) =>
      l + ' '.repeat(Math.max(1, w - l.length - r.length)) + r;

    let txt = '';
    txt += '        SOCOBOS BOARDING HOUSE\n';
    txt += '          Billing Statement\n';
    txt += `${line}\n`;
    txt += `Tenant : ${tenancy.tenantName}\n`;
    txt += `Phone  : ${tenancy.tenantPhone}\n`;
    txt += `Room   : ${tenancy.roomNumber}\n`;
    txt += `Period : ${formatDate(tenancy.moveInDate)} –\n`;
    txt += `         ${tenancy.moveOutDate ? formatDate(tenancy.moveOutDate) : 'Present'}\n`;
    txt += `${line}\n`;
    txt += 'MOVE-IN FEES\n';
    txt += pad('  Security Deposit', formatPeso(tenancy.securityDeposit)) + '\n';
    txt += pad('  Advance Payment',  formatPeso(tenancy.advancePayment))  + '\n';
    txt += `${line}\n`;
    txt += 'MONTHLY BILLS\n\n';

    bills.forEach((b) => {
      const elecUsed  = b.currElectricity - b.prevElectricity;
      const waterUsed = b.currWater - b.prevWater;
      txt += `  ${formatMonthLabel(b.month)}\n`;
      txt += pad(`    Rent`,                          formatPeso(b.rentAmount))      + '\n';
      txt += pad(`    Electricity (${elecUsed} kWh)`, formatPeso(b.electricityCost)) + '\n';
      txt += pad(`    Water (${waterUsed} units)`,    formatPeso(b.waterCost))       + '\n';
      txt += pad(`    Subtotal`,                      formatPeso(b.totalAmount))     + '\n';
      txt += pad(`    Paid`,                          formatPeso(b.amountPaid))      + '\n';
      txt += pad(`    Balance`,                       formatPeso(b.balance))         + '\n';
      txt += '\n';
    });

    txt += `${line}\n`;
    txt += pad('Total Rent',        formatPeso(totalRent))   + '\n';
    txt += pad('Total Electricity', formatPeso(totalElec))   + '\n';
    txt += pad('Total Water',       formatPeso(totalWater))  + '\n';
    txt += pad('Total Billed',      formatPeso(totalBilled)) + '\n';
    txt += pad('Total Paid',        formatPeso(totalPaid))   + '\n';
    if (outstanding > 0) {
      txt += pad('Outstanding',     formatPeso(outstanding)) + '\n';
    }
    txt += `${line}\n`;
    txt += pad('GRAND TOTAL',       formatPeso(grandTotal))  + '\n';
    txt += `${line}\n`;
    txt += `\nGenerated: ${formatDate(new Date().toISOString().slice(0, 10))}\n`;
    txt += 'Thank you for staying with us!\n';
    return txt;
  }

  async function handleShare() {
    const receipt = buildReceipt();
    try {
      await Share.share({ message: receipt, title: `Billing Statement – ${tenancy?.tenantName}` });
    } catch {
      // ignore cancel
    }
  }

  if (!tenancy) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.topAccent} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Record Not Found</Text>
            <View style={{ width: 32 }} />
          </View>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Record not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topAccent} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Billing Record</Text>
          {/* Share button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Tenant info ── */}
        <View style={styles.tenantCard}>
          <View style={styles.tenantAvatar}>
            <Text style={styles.tenantAvatarText}>
              {tenancy.tenantName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>{tenancy.tenantName}</Text>
            <Text style={styles.tenantPhone}>{tenancy.tenantPhone}</Text>
            <Text style={styles.tenantRoom}>Room {tenancy.roomNumber}</Text>
          </View>
          <View style={styles.movedOutBadge}>
            <Text style={styles.movedOutText}>MOVED OUT</Text>
          </View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>MOVE-IN</Text>
            <Text style={styles.dateValue}>{formatDate(tenancy.moveInDate)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>MOVE-OUT</Text>
            <Text style={styles.dateValue}>
              {tenancy.moveOutDate ? formatDate(tenancy.moveOutDate) : '—'}
            </Text>
          </View>
        </View>

        {/* ── Move-in fees ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Move-in Fees</Text>
          <View style={styles.card}>
            <Row label="Security Deposit" value={formatPeso(tenancy.securityDeposit)} />
            <Row label="Advance Payment"  value={formatPeso(tenancy.advancePayment)} />
            <Row
              label="Total Move-in"
              value={formatPeso(initialPayments)}
              bold accent
            />
          </View>
        </View>

        {/* ── Monthly bills ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Monthly Bills ({bills.length} month{bills.length !== 1 ? 's' : ''})
          </Text>

          {bills.length === 0 ? (
            <View style={styles.noBills}>
              <Text style={styles.noBillsText}>No bills were generated during this tenancy.</Text>
            </View>
          ) : (
            bills.map((bill) => {
              const isExpanded = expandedBill === bill.id;
              const elecUsed   = bill.currElectricity - bill.prevElectricity;
              const waterUsed  = bill.currWater - bill.prevWater;

              return (
                <TouchableOpacity
                  key={bill.id}
                  style={styles.billCard}
                  onPress={() => setExpandedBill(isExpanded ? null : bill.id)}
                  activeOpacity={0.75}
                >
                  {/* Bill header row */}
                  <View style={styles.billHeader}>
                    <View style={styles.billHeaderLeft}>
                      <Text style={styles.billMonth}>{formatMonthLabel(bill.month)}</Text>
                      <View style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            bill.status === 'paid'    ? COLORS.successLight
                            : bill.status === 'partial' ? COLORS.warningLight
                            : COLORS.dangerLight,
                        },
                      ]}>
                        <Text style={[
                          styles.statusText,
                          {
                            color:
                              bill.status === 'paid'    ? COLORS.success
                              : bill.status === 'partial' ? COLORS.warning
                              : COLORS.danger,
                          },
                        ]}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.billHeaderRight}>
                      <Text style={styles.billTotal}>{formatPeso(bill.totalAmount)}</Text>
                      {bill.balance > 0 && (
                        <Text style={styles.billBalance}>
                          Balance {formatPeso(bill.balance)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>

                  {/* Expanded breakdown */}
                  {isExpanded && (
                    <View style={styles.billBreakdown}>
                      <View style={styles.breakdownDivider} />

                      <Row label="Room Rent" value={formatPeso(bill.rentAmount)} />

                      <View style={styles.utilRow}>
                        <View style={styles.utilLeft}>
                          <Text style={styles.utilTitle}>⚡ Electricity</Text>
                          <Text style={styles.utilDetail}>
                            {bill.prevElectricity} → {bill.currElectricity} kWh
                            {'  '}({elecUsed} kWh × ₱{bill.electricityRate})
                          </Text>
                        </View>
                        <Text style={styles.utilCost}>{formatPeso(bill.electricityCost)}</Text>
                      </View>

                      <View style={styles.utilRow}>
                        <View style={styles.utilLeft}>
                          <Text style={styles.utilTitle}>💧 Water</Text>
                          <Text style={styles.utilDetail}>
                            {bill.prevWater} → {bill.currWater} units
                            {'  '}({waterUsed} units × ₱{bill.waterRate})
                          </Text>
                        </View>
                        <Text style={styles.utilCost}>{formatPeso(bill.waterCost)}</Text>
                      </View>

                      <View style={styles.breakdownDivider} />
                      <Row label="Subtotal"   value={formatPeso(bill.totalAmount)} bold />
                      <Row label="Amount Paid" value={formatPeso(bill.amountPaid)} valueColor={COLORS.success} />
                      <Row
                        label="Balance"
                        value={formatPeso(bill.balance)}
                        valueColor={bill.balance > 0 ? COLORS.danger : COLORS.success}
                        bold
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Grand total summary ── */}
        {bills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <View style={styles.summaryCard}>
              <Row label="Total Rent"        value={formatPeso(totalRent)} />
              <Row label="Total Electricity" value={formatPeso(totalElec)} />
              <Row label="Total Water"       value={formatPeso(totalWater)} />
              <Row label="Total Billed"      value={formatPeso(totalBilled)} bold />
              <Row label="Total Paid"        value={formatPeso(totalPaid)} valueColor={COLORS.success} />
              {outstanding > 0 && (
                <Row label="Outstanding" value={formatPeso(outstanding)} valueColor={COLORS.danger} bold />
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                <Text style={styles.grandTotalValue}>{formatPeso(grandTotal)}</Text>
              </View>
              <Text style={styles.grandTotalNote}>
                Includes ₱{initialPayments.toLocaleString('en-PH')} move-in fees
              </Text>
            </View>
          </View>
        )}

        {/* ── Share CTA ── */}
        <TouchableOpacity style={styles.shareFullBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareFullIcon}>📤</Text>
          <Text style={styles.shareFullText}>Share Billing Statement</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable row ──────────────────────────────────────────────────────────────
function Row({
  label, value, bold, accent, valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, bold && rowStyles.labelBold]}>{label}</Text>
      <Text style={[
        rowStyles.value,
        bold      && rowStyles.valueBold,
        accent    && { color: COLORS.accent },
        valueColor && { color: valueColor },
      ]}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  label: { fontSize: 13, color: COLORS.textSecondary },
  labelBold: { color: COLORS.textPrimary, fontWeight: '600' },
  value: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  valueBold: { fontWeight: '700', fontSize: 14 },
});

// ── Styles ────────────────────────────────────────────────────────────────────
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
  shareBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8,
  },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  scroll: { padding: 16, gap: 0 },

  // Tenant card
  tenantCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 10,
  },
  tenantAvatar: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  tenantAvatarText: { fontSize: 22, fontWeight: '800', color: COLORS.accent },
  tenantInfo: { flex: 1, gap: 2 },
  tenantName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  tenantPhone: { fontSize: 12, color: COLORS.textSecondary },
  tenantRoom: { fontSize: 12, color: COLORS.textMuted },
  movedOutBadge: {
    backgroundColor: COLORS.dangerLight, paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 99,
  },
  movedOutText: { fontSize: 10, fontWeight: '700', color: COLORS.danger, letterSpacing: 0.5 },

  // Dates row
  datesRow: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  dateItem: { flex: 1, gap: 4 },
  dateLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  dateValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  dateDivider: { width: 1, backgroundColor: COLORS.divider, marginHorizontal: 12 },

  // Section
  section: { marginBottom: 16, gap: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2,
  },

  // Generic card
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  // Bill cards
  billCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  billHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  billHeaderLeft: { flex: 1, gap: 4 },
  billMonth: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 99,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  billHeaderRight: { alignItems: 'flex-end', gap: 2 },
  billTotal: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  billBalance: { fontSize: 11, color: COLORS.danger, fontWeight: '600' },
  expandIcon: { fontSize: 11, color: COLORS.textMuted, marginLeft: 4 },

  // Expanded breakdown
  billBreakdown: { marginTop: 12, gap: 4 },
  breakdownDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 8 },
  utilRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  utilLeft: { flex: 1, gap: 2 },
  utilTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  utilDetail: { fontSize: 11, color: COLORS.textMuted },
  utilCost: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  grandTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 2, borderTopColor: COLORS.primary,
  },
  grandTotalLabel: {
    fontSize: 14, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5,
  },
  grandTotalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  grandTotalNote: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4,
  },

  // Share CTA
  shareFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, marginBottom: 4,
  },
  shareFullIcon: { fontSize: 18 },
  shareFullText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // No bills
  noBills: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 24,
    alignItems: 'center',
  },
  noBillsText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
