import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '../src/components/ui/InputField';
import { COLORS } from '../c../src/components/ui/InputField
import { useNav } from '../src/hooks/useNav';
import { Button } from '../src/components/ui/Button';
import { useRatesStore } from '../src/store';

export default function RatesScreen() {
  const nav = useNav();
  const rates = useRatesStore((s) => s.rates);
  const updateRates = useRatesStore((s) => s.updateRates);

  const [electricity, setElectricity] = useState(String(rates.electricityRate));
  const [water, setWater] = useState(String(rates.waterRate));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleSave() {
    const elec = parseFloat(electricity);
    const wat = parseFloat(water);
    if (isNaN(elec) || elec <= 0) { setError('Enter a valid electricity rate.'); return; }
    if (isNaN(wat) || wat <= 0) { setError('Enter a valid water rate.'); return; }
    setError('');
    updateRates({ electricityRate: elec, waterRate: wat });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utility Rates</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Changing rates only affects future bills. Already-generated bills keep their original rates.
            </Text>
          </View>

          {/* Electricity */}
          <View style={styles.card}>
            <View style={styles.rateHeader}>
              <View style={styles.rateIconWrap}>
                <Text style={styles.rateIcon}>⚡</Text>
              </View>
              <View style={styles.rateInfo}>
                <Text style={styles.rateTitle}>Electricity Rate</Text>
                <Text style={styles.rateCurrent}>
                  Current: ₱{rates.electricityRate.toFixed(2)} per kWh
                </Text>
              </View>
            </View>
            <InputField
              label="New Rate per kWh (₱)"
              value={electricity}
              onChangeText={(v) => { setElectricity(v); setError(''); setSaved(false); }}
              keyboardType="decimal-pad"
              placeholder="e.g. 12"
            />
          </View>

          {/* Water */}
          <View style={styles.card}>
            <View style={styles.rateHeader}>
              <View style={[styles.rateIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.rateIcon}>💧</Text>
              </View>
              <View style={styles.rateInfo}>
                <Text style={styles.rateTitle}>Water Rate</Text>
                <Text style={styles.rateCurrent}>
                  Current: ₱{rates.waterRate.toFixed(2)} per unit
                </Text>
              </View>
            </View>
            <InputField
              label="New Rate per unit (₱)"
              value={water}
              onChangeText={(v) => { setWater(v); setError(''); setSaved(false); }}
              keyboardType="decimal-pad"
              placeholder="e.g. 20"
            />
          </View>

          {/* Preview */}
          {(parseFloat(electricity) > 0 || parseFloat(water) > 0) && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview (sample 85 kWh, 10 units)</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>⚡ Electricity (85 kWh)</Text>
                <Text style={styles.previewValue}>
                  {isNaN(parseFloat(electricity))
                    ? '—'
                    : `₱${(85 * parseFloat(electricity)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                  }
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>💧 Water (10 units)</Text>
                <Text style={styles.previewValue}>
                  {isNaN(parseFloat(water))
                    ? '—'
                    : `₱${(10 * parseFloat(water)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                  }
                </Text>
              </View>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          ) : null}

          <Button
            label={saved ? '✓ Rates Saved Successfully' : 'Save Changes'}
            variant={saved ? 'secondary' : 'primary'}
            fullWidth
            size="lg"
            onPress={handleSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { padding: 16, gap: 16 },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12,
  },
  warningIcon: { fontSize: 16, marginTop: 1 },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  rateHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#FEF9C3', alignItems: 'center', justifyContent: 'center',
  },
  rateIcon: { fontSize: 24 },
  rateInfo: { flex: 1 },
  rateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  rateCurrent: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginTop: 2 },
  previewCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14, gap: 8,
  },
  previewTitle: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { fontSize: 13, color: COLORS.textSecondary },
  previewValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: COLORS.danger },
});
