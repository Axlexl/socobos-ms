/**
 * Zustand stores with AsyncStorage persistence.
 * Fully offline — no server, no internet needed.
 * Data lives on the device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_ELECTRICITY_RATE, DEFAULT_WATER_RATE } from '../constants';
import type { MonthlyBill, Payment, Room, Tenancy, UtilityRates } from '../types';

// ─── Utility Rates ────────────────────────────────────────────────────────────

interface RatesState {
  rates: UtilityRates;
  updateRates: (updates: Partial<UtilityRates>) => void;
}

export const useRatesStore = create<RatesState>()(
  persist(
    (set, get) => ({
      rates: { electricityRate: DEFAULT_ELECTRICITY_RATE, waterRate: DEFAULT_WATER_RATE },
      updateRates: (updates) => set((s) => ({ rates: { ...s.rates, ...updates } })),
    }),
    { name: 'rates-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// ─── Rooms ────────────────────────────────────────────────────────────────────

interface RoomState {
  rooms: Room[];
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  getRoomById: (id: string) => Room | undefined;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      rooms: [],
      addRoom: (room) => set((s) => ({ rooms: [...s.rooms, room] })),
      updateRoom: (id, updates) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
      deleteRoom: (id) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),
      getRoomById: (id) => get().rooms.find((r) => r.id === id),
    }),
    { name: 'room-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// ─── Tenancies ────────────────────────────────────────────────────────────────

interface TenancyState {
  tenancies: Tenancy[];
  addTenancy: (tenancy: Tenancy) => void;
  updateTenancy: (id: string, updates: Partial<Tenancy>) => void;
  getTenancyById: (id: string) => Tenancy | undefined;
  getActiveTenancyByRoom: (roomId: string) => Tenancy | undefined;
  getPastTenanciesByRoom: (roomId: string) => Tenancy[];
  getAllPastTenancies: () => Tenancy[];
  moveOutTenant: (tenancyId: string, moveOutDate: string) => void;
}

export const useTenancyStore = create<TenancyState>()(
  persist(
    (set, get) => ({
      tenancies: [],
      addTenancy: (tenancy) => set((s) => ({ tenancies: [...s.tenancies, tenancy] })),
      updateTenancy: (id, updates) =>
        set((s) => ({
          tenancies: s.tenancies.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      getTenancyById: (id) => get().tenancies.find((t) => t.id === id),
      getActiveTenancyByRoom: (roomId) =>
        get().tenancies.find((t) => t.roomId === roomId && t.status === 'active'),
      getPastTenanciesByRoom: (roomId) =>
        get().tenancies.filter((t) => t.roomId === roomId && t.status === 'moved_out'),
      getAllPastTenancies: () => get().tenancies.filter((t) => t.status === 'moved_out'),
      moveOutTenant: (tenancyId, moveOutDate) => {
        const tenancy = get().getTenancyById(tenancyId);
        if (!tenancy) return;
        set((s) => ({
          tenancies: s.tenancies.map((t) =>
            t.id === tenancyId ? { ...t, status: 'moved_out', moveOutDate } : t,
          ),
        }));
        useRoomStore.getState().updateRoom(tenancy.roomId, {
          status: 'vacant',
          currentTenancyId: null,
        });
      },
    }),
    { name: 'tenancy-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// ─── Bills ────────────────────────────────────────────────────────────────────

interface BillState {
  bills: MonthlyBill[];
  addBill: (bill: MonthlyBill) => void;
  updateBill: (id: string, updates: Partial<MonthlyBill>) => void;
  getBillById: (id: string) => MonthlyBill | undefined;
  getBillsByTenancy: (tenancyId: string) => MonthlyBill[];
  getLatestBillByTenancy: (tenancyId: string) => MonthlyBill | undefined;
  getLatestBillByRoom: (roomId: string) => MonthlyBill | undefined;
  recordPayment: (billId: string, amount: number) => void;
}

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      bills: [],
      addBill: (bill) => set((s) => ({ bills: [...s.bills, bill] })),
      updateBill: (id, updates) =>
        set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      getBillById: (id) => get().bills.find((b) => b.id === id),
      getBillsByTenancy: (tenancyId) =>
        get().bills.filter((b) => b.tenancyId === tenancyId)
          .sort((a, b) => a.month.localeCompare(b.month)),
      getLatestBillByTenancy: (tenancyId) => {
        const sorted = get().bills.filter((b) => b.tenancyId === tenancyId)
          .sort((a, b) => b.month.localeCompare(a.month));
        return sorted[0];
      },
      getLatestBillByRoom: (roomId) => {
        const sorted = get().bills.filter((b) => b.roomId === roomId)
          .sort((a, b) => b.month.localeCompare(a.month));
        return sorted[0];
      },
      recordPayment: (billId, amount) => {
        const bill = get().getBillById(billId);
        if (!bill) return;
        const newPaid    = bill.amountPaid + amount;
        const newBalance = Math.max(0, bill.totalAmount - newPaid);
        const newStatus  = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
        get().updateBill(billId, { amountPaid: newPaid, balance: newBalance, status: newStatus });
      },
    }),
    { name: 'bill-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// ─── Payments ─────────────────────────────────────────────────────────────────

interface PaymentState {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  getPaymentsByTenancy: (tenancyId: string) => Payment[];
  getPaymentsByBill: (billId: string) => Payment[];
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      addPayment: (payment) => set((s) => ({ payments: [...s.payments, payment] })),
      getPaymentsByTenancy: (tenancyId) =>
        get().payments.filter((p) => p.tenancyId === tenancyId),
      getPaymentsByBill: (billId) =>
        get().payments.filter((p) => p.billId === billId),
    }),
    { name: 'payment-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
