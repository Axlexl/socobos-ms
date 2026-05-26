import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { InputField } from '../../src/components/ui/InputField';
import { COLORS } from '../../src/constants';
import { useNav } from '../../src/hooks/useNav';
import { useBillStore, useRatesStore, useRoomStore, useTenancyStore } from '../../src/store';
import { calcBillAmounts, currentMonthKey, formatPeso, generateId, todayISO } from '../../src/utils';

/**
 * Due date rules:
 *  - Electricity & Water → always the 5th of the NEXT month
 *  - Room Rent           → same day as move-in date, next month
 *    e.g. moved in May 15 → rent due June 15
 */
function calcDueDates(moveInDate: string, billingMonth: string): {
  rentDue: string;
  utilityDue: string;
} {
  const [year, month] = billingMonth.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;

  // Utility due: 5th of next month
  const utilityDue = `${nextYear}-${String(nextMonth).padStart(2, '0')}-05`;

  // Rent due: move-in day of next month (clamped to last day of month)
  const moveInDay   = new Date(moveInDate).getDate();
  const lastDay     = new Date(nextYear, nextMonth, 0).getDate();
  const rentDay     = Math.min(moveInDay, lastDay);
  const rentDue     = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(rentDay).padStart(2, '0')}`;

  return { rentDue, utilityDue };
}

export default function GenerateBillScreen() {
  const { tenancyId } = useLocalSearchParams<{ tenancyId: string }>();
  const nav = useNav();

  const getTenancyById      = useTenancyStore((s) => s.getTenancyById);
  const addBill             = useBillStore((s) => s.addBill);
  const getLatestBillByRoom = useBillStore((s) => s.getLatestBillByRoom);
  const rates               = useRatesStore((s) => s.rates);
  const getRoomById         = useRoomStore((s) => s.getRoomById);

  const tenancyData = getTenancyById(tenancyId);
  const room        = tenancyData ? getRoomById(tenancyData.roomId) : undefined;
  const rentAmount  = room?.monthlyRent ?? 3500;
  const lastRoomBill = room ? getLatestBillByRoom(room.id) : undefined;

  const [prevElec,  setPrevElec]  = useState(String(lastRoomBill?.currElectricity ?? ''));
  const [currElec,  setCurrElec]  = useState('');
  const [prevWater, setPrevWater] = useState(String(lastRoomBill?.currWater ?? ''));
  const [currWater, setCurrWater] = useState('');
  const [month,     setMonth]     = useState(currentMonthKey());
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);

  if (!tenancyData) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.back()} style={st.backBtn}>
            <Text style={st.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>Generate Bill</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={st.empty}>
          <Text style={st.emptyIcon}>🔍</Text>
          <Text style={st.emptyText}>Tenancy not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tenancy = tenancyData;

  const pe = parseFloat(prevElec) || 0;
  const ce = parseFloat(currElec) || 0;
  const pw = parseFloat(prevWater) || 0;
  const cw = parseFloat(currWater) || 0;

  const elecUsed  = currElec  !== '' ? Math.max(0, ce - pe) : 0;
  const waterUsed = currWater !== '' ? Math.max(0, cw - pw) : 0;
  const elecCost  = elecUsed  * rates.electricityRate;
  const waterCost = waterUsed * rates.waterRate;
  const totalAmount = rentAmount + elecCost + waterCost;

  const hasElec  = prevElec  !== '' && currElec  !== '';
  const hasWater = prevWater !== '' && currWater !== '';

  // Compute due dates for display
  const { rentDue, utilityDue } = calcDueDates(tenancy.moveInDate, month);
  const moveInDay = new Date(tenancy.moveInDate).getDate();

  async function handleGenerate() {
    if (!prevElec.trim() || !currElec.trim()) { setError('Enter both electricity readings.'); return; }
    if (!prevWater.trim() || !currWater.trim()) { setError('Enter both water readings.'); return; }
    if (ce < pe) { setError('Current electricity cannot be less than previous.'); return; }
    if (cw < pw) { setError('Current water cannot be less than previous.'); return; }

    setError('');
    setSaving(true);
    try {
      const { electricityCost, waterCost: wc, totalAmount: total } = calcBillAmounts(
        rentAmount, pe, ce, pw, cw, rates,
      );

      await addBill({
        id: generateId(),
        tenancyId: tenancy.id,
        roomId: tenancy.roomId,
        roomNumber: tenancy.roomNumber,
        month,
        prevElectricity: pe,
        currElectricity: ce,
        prevWater: pw,
        currWater: cw,
        electricityRate: rates.electricityRate,
        waterRate: rates.waterRate,
        rentAmount,
        electricityCost,
        waterCost: wc,
        totalAmount: total,
        amountPaid: 0,
        balance: total,
        status: 'unpaid',
        // Use the utility due date as the main bill due date
        dueDate: utilityDue,
        generatedAt: todayISO(),
      });
      nav.back('Bill saved...');
    } catch {
      setError('Failed to save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.back()} style={st.backBtn}>
          <Text style={st.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>Generate Bill</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">

          {/* Tenant + month */}
          <View style={st.card}>
            <Text style={st.cardTitle}>Room {tenancy.roomNumber}</Text>
            <Text style={st.cardSub}>{tenancy.tenantName}</Text>
            <View style={st.monthRow}>
              <Text style={st.monthLabel}>Billing Month:</Text>
              <InputField value={month} onChangeText={setMonth} placeholder="YYYY-MM" style={st.monthInput} />
            </View>
          </View>

          {/* Due date info */}
          <View style={st.dueDateCard}>
            <Text style={st.dueDateTitle}>Due Dates for {month}</Text>
            <View style={st.dueDateRow}>
              <View style={st.dueDateItem}>
                <Text style={st.dueDateLabel}>🏠 Rent</Text>
                <Text style={st.dueDateValue}>{rentDue}</Text>
                <Text style={st.dueDateNote}>Day {moveInDay} of each month</Text>
              </View>
              <View style={st.dueDateDivider} />
              <View style={st.dueDateItem}>
                <Text style={st.dueDateLabel}>⚡💧 Utilities</Text>
                <Text style={st.dueDateValue}>{utilityDue}</Text>
                <Text style={st.dueDateNote}>5th of each month</Text>
              </View>
            </View>
          </View>

          {/* Electricity */}
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>⚡ Electricity</Text>
              <View style={st.ratePill}>
                <Text style={st.ratePillText}>₱{rates.electricityRate} / kWh</Text>
              </View>
            </View>
            <View style={st.hintBox}>
              <Text style={st.hintText}>
                <Text style={st.hintBold}>Previous</Text> = last month's reading.{'  '}
                <Text style={st.hintBold}>Current</Text> = this month's meter reading.
              </Text>
            </View>
            <View style={st.readingRow}>
              <View style={st.readingField}>
                <InputField label="Previous (kWh)" placeholder="e.g. 120" value={prevElec} onChangeText={(v) => { setPrevElec(v); setError(''); }} keyboardType="decimal-pad" />
              </View>
              <View style={st.arrowWrap}><Text style={st.arrow}>→</Text></View>
              <View style={st.readingField}>
                <InputField label="Current (kWh)" placeholder="e.g. 145" value={currElec} onChangeText={(v) => { setCurrElec(v); setError(''); }} keyboardType="decimal-pad" />
              </View>
            </View>
            {hasElec && (
              <View style={st.calcBox}>
                <View style={st.calcRow}>
                  <Text style={st.calcLabel}>Consumption</Text>
                  <Text style={st.calcFormula}>{ce} − {pe} = <Text style={st.calcHi}>{elecUsed} kWh</Text></Text>
                </View>
                <View style={st.calcRow}>
                  <Text style={st.calcLabel}>Cost</Text>
                  <Text style={st.calcFormula}>{elecUsed} × ₱{rates.electricityRate} = <Text style={st.calcHi}>{formatPeso(elecCost)}</Text></Text>
                </View>
              </View>
            )}
          </View>

          {/* Water */}
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>💧 Water</Text>
              <View style={[st.ratePill, st.ratePillWater]}>
                <Text style={[st.ratePillText, st.ratePillTextWater]}>₱{rates.waterRate} / kWh</Text>
              </View>
            </View>
            <View style={st.hintBox}>
              <Text style={st.hintText}>
                <Text style={st.hintBold}>Previous</Text> = last month's reading.{'  '}
                <Text style={st.hintBold}>Current</Text> = this month's meter reading.
              </Text>
            </View>
            <View style={st.readingRow}>
              <View style={st.readingField}>
                <InputField label="Previous (kWh)" placeholder="e.g. 77" value={prevWater} onChangeText={(v) => { setPrevWater(v); setError(''); }} keyboardType="decimal-pad" />
              </View>
              <View style={st.arrowWrap}><Text style={st.arrow}>→</Text></View>
              <View style={st.readingField}>
                <InputField label="Current (kWh)" placeholder="e.g. 82" value={currWater} onChangeText={(v) => { setCurrWater(v); setError(''); }} keyboardType="decimal-pad" />
              </View>
            </View>
            {hasWater && (
              <View style={[st.calcBox, st.calcBoxWater]}>
                <View style={st.calcRow}>
                  <Text style={st.calcLabel}>Consumption</Text>
                  <Text style={st.calcFormula}>{cw} − {pw} = <Text style={[st.calcHi, st.calcHiWater]}>{waterUsed} kWh</Text></Text>
                </View>
                <View style={st.calcRow}>
                  <Text style={st.calcLabel}>Cost</Text>
                  <Text style={st.calcFormula}>{waterUsed} × ₱{rates.waterRate} = <Text style={[st.calcHi, st.calcHiWater]}>{formatPeso(waterCost)}</Text></Text>
                </View>
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={st.card}>
            <Text style={st.sectionTitle}>Bill Summary</Text>
            <SRow label={`🏠 Rent (due ${rentDue})`}                                                    value={formatPeso(rentAmount)} />
            <SRow label={`⚡ Electricity${hasElec  ? ` (${elecUsed} kWh × ₱${rates.electricityRate})` : ''}`} value={formatPeso(elecCost)} />
            <SRow label={`💧 Water${hasWater ? ` (${waterUsed} kWh × ₱${rates.waterRate})` : ''}`}      value={formatPeso(waterCost)} />
            <View style={st.totalRow}>
              <Text style={st.totalLabel}>TOTAL BILL</Text>
              <Text style={st.totalValue}>{formatPeso(totalAmount)}</Text>
            </View>
          </View>

          {error ? <View style={st.errorBox}><Text style={st.errorText}>⚠️  {error}</Text></View> : null}

          <Button label={saving ? 'Saving...' : 'Generate & Save Bill'} onPress={handleGenerate} loading={saving} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.summaryRow}>
      <Text style={st.summaryLabel}>{label}</Text>
      <Text style={st.summaryValue}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#fff' },
  scroll: { padding: 16, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: -6 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  monthLabel: { fontSize: 13, color: COLORS.textSecondary, flexShrink: 0 },
  monthInput: { flex: 1 },

  // Due date card
  dueDateCard: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, gap: 10 },
  dueDateTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },
  dueDateRow: { flexDirection: 'row', gap: 12 },
  dueDateItem: { flex: 1, gap: 4 },
  dueDateLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  dueDateValue: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
  dueDateNote: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  dueDateDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  ratePill: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  ratePillWater: { backgroundColor: '#DBEAFE' },
  ratePillText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  ratePillTextWater: { color: '#1D4ED8' },
  hintBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.border },
  hintText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  hintBold: { fontWeight: '700', color: COLORS.textPrimary },
  readingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  readingField: { flex: 1 },
  arrowWrap: { paddingBottom: 12, alignItems: 'center' },
  arrow: { fontSize: 18, color: COLORS.textMuted },
  calcBox: { backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12, gap: 8 },
  calcBoxWater: { backgroundColor: '#EFF6FF' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  calcFormula: { fontSize: 13, color: COLORS.textPrimary },
  calcHi: { fontWeight: '700', color: COLORS.primary },
  calcHiWater: { color: '#1D4ED8' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1, paddingRight: 8 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: 24, fontWeight: '700', color: COLORS.danger },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: COLORS.danger },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
