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
import { useRoomStore } from '../../store';
import { generateId } from '../../utils';

export default function AddRoomScreen() {
  const nav = useNav();
  const addRoom = useRoomStore((s) => s.addRoom);
  const rooms = useRoomStore((s) => s.rooms);

  const [number, setNumber] = useState('');
  const [rent, setRent] = useState('3500');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = number.trim();

    if (!trimmed) {
      setError('Room number is required.');
      return;
    }

    const duplicate = rooms.find(
      (r) => r.number.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setError(`Room ${trimmed} already exists. Use a different number.`);
      return;
    }

    const rentNum = parseFloat(rent);
    if (isNaN(rentNum) || rentNum <= 0) {
      setError('Enter a valid monthly rent amount.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      await addRoom({
        id: generateId(),
        number: trimmed,
        monthlyRent: rentNum,
        status: 'vacant',
        currentTenancyId: null,
      });
      nav.back('Room saved...');
    } catch (e: any) {
      console.error('addRoom error:', e);
      const code = e?.code ?? '';
      if (code === 'permission-denied') {
        setError('Permission denied. Check Firestore security rules in Firebase Console.');
      } else if (code === 'unavailable' || code === 'network-request-failed') {
        setError('No connection. Check your internet and try again.');
      } else {
        setError(`Failed to save: ${e?.message ?? 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Room</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>ℹ️</Text>
            <Text style={styles.infoBannerText}>
              New rooms are added as Vacant. You can assign a tenant after saving.
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Room Details</Text>

            <InputField
              label="Room Number *"
              placeholder="e.g. 101, 2A, Ground Floor"
              value={number}
              onChangeText={(v) => { setNumber(v); setError(''); }}
              autoCapitalize="characters"
              returnKeyType="next"
            />

            <InputField
              label="Monthly Rent (₱) *"
              placeholder="e.g. 3500"
              value={rent}
              onChangeText={(v) => { setRent(v); setError(''); }}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <InputField
              label="Description (optional)"
              placeholder="e.g. 2nd floor, with CR, aircon"
              value={description}
              onChangeText={setDescription}
              returnKeyType="done"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}
          </View>

          {/* Deposit info */}
          <View style={styles.depositCard}>
            <Text style={styles.depositTitle}>Move-in Fees (auto-recorded on tenant assignment)</Text>
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>🔒 Security Deposit</Text>
              <Text style={styles.depositValue}>₱3,500.00</Text>
            </View>
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>📅 Advance Payment</Text>
              <Text style={styles.depositValue}>₱3,500.00</Text>
            </View>
            <View style={[styles.depositRow, styles.depositTotal]}>
              <Text style={styles.depositTotalLabel}>Total Move-in</Text>
              <Text style={styles.depositTotalValue}>₱7,000.00</Text>
            </View>
          </View>

          <Button
            label={saving ? 'Saving...' : 'Save Room'}
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
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
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 12,
  },
  infoBannerIcon: { fontSize: 16, marginTop: 1 },
  infoBannerText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  errorBox: {
    backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10,
  },
  errorText: { fontSize: 13, color: COLORS.danger, lineHeight: 18 },
  depositCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  depositTitle: {
    fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4,
  },
  depositRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  depositLabel: { fontSize: 14, color: COLORS.textPrimary },
  depositValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  depositTotal: { borderBottomWidth: 0, marginTop: 4 },
  depositTotalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  depositTotalValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
});
