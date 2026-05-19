import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { COLORS } from '../../constants';
import { useNav } from '../../hooks/useNav';
import { useBillStore, useRatesStore, useRoomStore, useTenancyStore } from '../../store';
import {
    calcBillAmounts, currentMonthKey, formatPeso,
    generateId, todayISO,
} from '../../utils';

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

  // Pre-fill from the LAST bill for this room across ALL tenancies
  // so when a new tenant moves in the meter readings carry over
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Bill</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Tenancy not found.</Text>
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

  const hasElecReading  = prevElec  !== '' && currElec  !== '';
  const hasWaterReading = prevWater !== '' && currWater !== '';

  async function handleGenerate() {
    if (!prevElec.trim() || !currElec.trim()) {
      setError('Enter both previous and current electricity readings.');
      return;
    }
    if (!prevWater.trim() || !currWater.trim()) {
      setError('Enter both previous and current water readings.');
      return;
    }
    if (ce < pe) { setError('Current electricity reading cannot be less than previous.'); return; }
    if (cw < pw) { setError('Current water reading cannot be less than previous.'); return; }

    setError('');
    setSaving(true);

    try {
      const { electricityCost, waterCost: wc, totalAmount: total } = calcBillAmounts(
        rentAmount, pe, ce, pw, cw, rates,
      );

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

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
        dueDate: dueDate.toISOString().slice(0, 10),
        generatedAt: todayISO(),
      });

      nav.back('Bill saved...');
    } catch (e) {
      setError('Failed to save bill. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Bill</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Tenant info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Room {tenancy.roomNumber}</Text>
            <Text style={styles.cardSub}>{tenancy.tenantName}</Text>
            <View style={styles.monthRow}>
              <Text style={styles.monthLabel}>Billing Month:</Text>
              <InputField
                value={month}
                onChangeText={setMonth}
                placeholder="YYYY-MM"
                style={styles.monthInput}
              />
            </View>
          </View>

          {/* ── Electricity ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Electricity</Text>
              <View style={styles.ratePill}>
                <Text style={styles.ratePillText}>₱{rates.electricityRate} / kWh</Text>
              </View>
            </View>
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                Enter last month's reading as <Text style={styles.hintBold}>Previous</Text> and this month's meter reading as <Text style={styles.hintBold}>Current</Text>.
              </Text>
            </View>
            <View style={styles.readingRow}>
              <View style={styles.readingField}>
                <InputField
                  label="Previous (kWh)"
                  placeholder="e.g. 120"
                  value={prevElec}
                  onChangeText={(v) => { setPrevElec(v); setError(''); }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.arrowWrap}>
                <Text style={styles.arrow}>→</Text>
              </View>
              <View style={styles.readingField}>
                <InputField
                  label="Current (kWh)"
                  placeholder="e.g. 145"
                  value={currElec}
                  onChangeText={(v) => { setCurrElec(v); setError(''); }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            {hasElecReading && (
              <View style={styles.calcBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Consumption</Text>
                  <Text style={styles.calcFormula}>
                    {ce} − {pe} = <Text style={styles.calcHighlight}>{elecUsed} kWh</Text>
                  </Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Cost</Text>
                  <Text style={styles.calcFormula}>
                    {elecUsed} kWh × ₱{rates.electricityRate} = <Text style={styles.calcHighlight}>{formatPeso(elecCost)}</Text>
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Water ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💧 Water</Text>
              <View style={[styles.ratePill, styles.ratePillWater]}>
                <Text style={[styles.ratePillText, styles.ratePillTextWater]}>
                  ₱{rates.waterRate} / kWh
                </Text>
              </View>
            </View>
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                Enter last month's reading as <Text style={styles.hintBold}>Previous</Text> and this month's meter reading as <Text style={styles.hintBold}>Current</Text>.
              </Text>
            </View>
            <View style={styles.readingRow}>
              <View style={styles.readingField}>
                <InputField
                  label="Previous (kWh)"
                  placeholder="e.g. 77"
                  value={prevWater}
                  onChangeText={(v) => { setPrevWater(v); setError(''); }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.arrowWrap}>
                <Text style={styles.arrow}>→</Text>
              </View>
              <View style={styles.readingField}>
                <InputField
                  label="Current (kWh)"
                  placeholder="e.g. 82"
                  value={currWater}
                  onChangeText={(v) => { setCurrWater(v); setError(''); }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            {hasWaterReading && (
              <View style={[styles.calcBox, styles.calcBoxWater]}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Consumption</Text>
                  <Text style={styles.calcFormula}>
                    {cw} − {pw} = <Text style={[styles.calcHighlight, styles.calcHighlightWater]}>{waterUsed} kWh</Text>
                  </Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Cost</Text>
                  <Text style={styles.calcFormula}>
                    {waterUsed} kWh × ₱{rates.waterRate} = <Text style={[styles.calcHighlight, styles.calcHighlightWater]}>{formatPeso(waterCost)}</Text>
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Bill Summary ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bill Summary</Text>
            <View style={styles.summaryTable}>
              <SummaryRow label="Room Rent" value={formatPeso(rentAmount)} />
              <SummaryRow
                label={`Electricity${hasElecReading ? ` (${elecUsed} kWh × ₱${rates.electricityRate})` : ''}`}
                value={formatPeso(elecCost)}
              />
              <SummaryRow
                label={`Water${hasWaterReading ? ` (${waterUsed} kWh × ₱${rates.waterRate})` : ''}`}
                value={formatPeso(waterCost)}
              />
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL BILL</Text>
              <Text style={styles.totalValue}>{formatPeso(totalAmount)}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          ) : null}

          <Button
            label={saving ? 'Saving...' : 'Generate & Save Bill'}
            onPress={handleGenerate}
            loading={saving}
            fullWidth
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
  scroll: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: -6 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  monthLabel: { fontSize: 13, color: COLORS.textSecondary, flexShrink: 0 },
  monthInput: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  ratePill: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 99,
  },
  ratePillWater: { backgroundColor: '#DBEAFE' },
  ratePillText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  ratePillTextWater: { color: '#1D4ED8' },
  hintBox: {
    backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.border,
  },
  hintText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  hintBold: { fontWeight: '700', color: COLORS.textPrimary },
  readingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  readingField: { flex: 1 },
  arrowWrap: { paddingBottom: 12, alignItems: 'center' },
  arrow: { fontSize: 18, color: COLORS.textMuted },
  calcBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12, gap: 8,
  },
  calcBoxWater: { backgroundColor: '#EFF6FF' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  calcFormula: { fontSize: 13, color: COLORS.textPrimary },
  calcHighlight: { fontWeight: '700', color: COLORS.primary },
  calcHighlightWater: { color: '#1D4ED8' },
  summaryTable: { gap: 0 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1, paddingRight: 8 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: 24, fontWeight: '700', color: COLORS.danger },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: COLORS.danger },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
