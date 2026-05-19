import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert, KeyboardAvoidingView, Platform,
    ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '../../components/ui/InputField';
import { ADVANCE_PAYMENT, CO../../src/components/ui/InputField'../../constants';
import { useNav } from '../../src/hooks/useNav';
import { Button } from '../../src/components/ui/Button';
import { useBillStore, useRoomStore, useTenancyStore } from '../../store';
import { formatDate, formatPeso, generateId, todayISO } from '../../src/utils';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNav();

  const getRoomById = useRoomStore((s) => s.getRoomById);
  const updateRoom = useRoomStore((s) => s.updateRoom);
  const deleteRoom = useRoomStore((s) => s.deleteRoom);
  const getActiveTenancyByRoom = useTenancyStore((s) => s.getActiveTenancyByRoom);
  const addTenancy = useTenancyStore((s) => s.addTenancy);
  const moveOutTenant = useTenancyStore((s) => s.moveOutTenant);
  const getLatestBillByTenancy = useBillStore((s) => s.getLatestBillByTenancy);

  const roomData = getRoomById(id);
  const tenancy = roomData ? getActiveTenancyByRoom(roomData.id) : undefined;
  const latestBill = tenancy ? getLatestBillByTenancy(tenancy.id) : undefined;

  const [showMoveIn, setShowMoveIn] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [moveInDate, setMoveInDate] = useState(todayISO());
  const [formError, setFormError] = useState('');

  if (!roomData) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Room Not Found</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Room not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // After the guard above, roomData is guaranteed to be defined
  const room = roomData;

  async function handleMoveIn() {
    if (!tenantName.trim()) { setFormError('Tenant name is required.'); return; }
    if (!tenantPhone.trim()) { setFormError('Phone number is required.'); return; }
    if (!moveInDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setFormError('Date must be in YYYY-MM-DD format.'); return;
    }
    setFormError('');

    try {
      const tenancyId = generateId();
      await addTenancy({
        id: tenancyId,
        roomId: room.id,
        roomNumber: room.number,
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        moveInDate,
        moveOutDate: null,
        status: 'active',
        securityDeposit: SECURITY_DEPOSIT,
        advancePayment: ADVANCE_PAYMENT,
        initialPaymentsPaid: true,
      });
      await updateRoom(room.id, { status: 'occupied', currentTenancyId: tenancyId });
      setShowMoveIn(false);
      setTenantName('');
      setTenantPhone('');
      setMoveInDate(todayISO());
    } catch (e) {
      setFormError('Failed to save. Check your connection and try again.');
    }
  }

  function handleMoveOut() {
    if (!tenancy) return;
    Alert.alert(
      'Move Out Tenant',
      `Move out ${tenancy.tenantName} from Room ${room.number}?\n\nThis will free the room for a new tenant. The record will be saved in Past Records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move Out',
          style: 'destructive',
          onPress: () => moveOutTenant(tenancy.id, todayISO()),
        },
      ],
    );
  }

  function handleDeleteRoom() {
    if (room.status === 'occupied') {
      Alert.alert('Cannot Delete', 'Move out the current tenant before deleting this room.');
      return;
    }
    Alert.alert(
      'Delete Room',
      `Delete Room ${room.number}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoom(room.id);
            nav.back('Deleting room...');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Room {room.number}</Text>
        <TouchableOpacity onPress={handleDeleteRoom} hitSlop={8}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Room status */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.cardTitle}>Room {room.number}</Text>
                <Text style={styles.rentText}>{formatPeso(room.monthlyRent)} / month</Text>
              </View>
              <View style={[
                styles.badge,
                { backgroundColor: room.status === 'occupied' ? '#DCFCE7' : '#F3F4F6' },
              ]}>
                <Text style={[
                  styles.badgeText,
                  { color: room.status === 'occupied' ? COLORS.success : COLORS.textSecondary },
                ]}>
                  {room.status === 'occupied' ? '● Occupied' : '○ Vacant'}
                </Text>
              </View>
            </View>
          </View>

          {/* Active tenant */}
          {tenancy && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tenant Information</Text>
              <InfoRow label="Name" value={tenancy.tenantName} />
              <InfoRow label="Phone" value={tenancy.tenantPhone} />
              <InfoRow label="Move-in Date" value={formatDate(tenancy.moveInDate)} />
              <View style={styles.divider} />
              <Text style={styles.cardSubtitle}>Initial Payments (Move-in)</Text>
              <InfoRow
                label="Security Deposit"
                value={formatPeso(tenancy.securityDeposit)}
                valueColor={COLORS.success}
              />
              <InfoRow
                label="Advance Payment"
                value={formatPeso(tenancy.advancePayment)}
                valueColor={COLORS.success}
              />
              <InfoRow
                label="Total Collected"
                value={formatPeso(tenancy.securityDeposit + tenancy.advancePayment)}
                bold
              />
            </View>
          )}

          {/* Latest bill */}
          {latestBill && (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>Current Bill</Text>
                <TouchableOpacity
                  onPress={() =>
                    nav.push(
                      `/billing/generate?tenancyId=${tenancy?.id}` as any,
                      'Opening billing...',
                    )
                  }
                >
                  <Text style={styles.viewLink}>View / Edit →</Text>
                </TouchableOpacity>
              </View>
              <InfoRow label="Total Bill" value={formatPeso(latestBill.totalAmount)} bold />
              <InfoRow
                label="Amount Paid"
                value={formatPeso(latestBill.amountPaid)}
                valueColor={COLORS.success}
              />
              <InfoRow
                label="Balance"
                value={formatPeso(latestBill.balance)}
                valueColor={latestBill.balance > 0 ? COLORS.danger : COLORS.success}
                bold
              />
            </View>
          )}

          {/* Move-in form */}
          {room.status === 'vacant' && showMoveIn && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>New Tenant Move-In</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  ₱{SECURITY_DEPOSIT.toLocaleString()} security deposit + ₱{ADVANCE_PAYMENT.toLocaleString()} advance payment will be recorded automatically.
                </Text>
              </View>
              <InputField
                label="Tenant Name *"
                placeholder="Full name"
                value={tenantName}
                onChangeText={(v) => { setTenantName(v); setFormError(''); }}
              />
              <InputField
                label="Phone Number *"
                placeholder="09XX XXX XXXX"
                value={tenantPhone}
                onChangeText={(v) => { setTenantPhone(v); setFormError(''); }}
                keyboardType="phone-pad"
              />
              <InputField
                label="Move-in Date *"
                placeholder="YYYY-MM-DD"
                value={moveInDate}
                onChangeText={(v) => { setMoveInDate(v); setFormError(''); }}
              />
              {formError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {formError}</Text>
                </View>
              ) : null}
              <View style={styles.btnRow}>
                <Button
                  label="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => { setShowMoveIn(false); setFormError(''); }}
                />
                <Button
                  label="Confirm Move-In"
                  style={{ flex: 1 }}
                  onPress={handleMoveIn}
                />
              </View>
            </View>
          )}

          {/* Action buttons */}
          {room.status === 'vacant' && !showMoveIn && (
            <Button
              label="🏠  Move In New Tenant"
              fullWidth
              size="lg"
              onPress={() => setShowMoveIn(true)}
            />
          )}

          {room.status === 'occupied' && tenancy && (
            <View style={styles.btnRow}>
              <Button
                label="🧾  Generate Bill"
                style={{ flex: 1 }}
                onPress={() =>
                  nav.push(
                    `/billing/generate?tenancyId=${tenancy.id}` as any,
                    'Opening billing...',
                  )
                }
              />
              <Button
                label="Move Out"
                variant="danger"
                style={{ flex: 1 }}
                onPress={handleMoveOut}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({
  label, value, valueColor, bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[
        styles.infoValue,
        valueColor ? { color: valueColor } : null,
        bold ? { fontWeight: '700' } : null,
      ]}>
        {value}
      </Text>
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
  deleteIcon: { fontSize: 20 },
  scroll: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  rentText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border },
  viewLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  infoBox: { backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10 },
  infoBoxText: { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10 },
  errorText: { fontSize: 13, color: COLORS.danger },
  btnRow: { flexDirection: 'row', gap: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
