/**
 * Zustand stores backed by MySQL via PHP REST API.
 * Call initStores() once after login to load all data.
 */

import { create } from 'zustand';
import {
    apiAddBill,
    apiAddPayment,
    apiAddRoom,
    apiAddTenancy,
    apiDeleteRoom,
    apiGetBills,
    apiGetPayments,
    apiGetRates,
    apiGetRooms,
    apiGetTenancies,
    apiUpdateBill,
    apiUpdateRates,
    apiUpdateRoom,
    apiUpdateTenancy,
} from '../api/client';
import {
    DEFAULT_ELECTRICITY_RATE,
    DEFAULT_WATER_RATE,
} from '../constants';
import type {
    MonthlyBill,
    Payment,
    Room,
    Tenancy,
    UtilityRates,
} from '../types';

// ─── Utility Rates Store ──────────────────────────────────────────────────────

interface RatesState {
  rates: UtilityRates;
  setRates: (rates: UtilityRates) => void;
  updateRates: (updates: Partial<UtilityRates>) => Promise<void>;
  fetchRates: () => Promise<void>;
}

export const useRatesStore = create<RatesState>((set, get) => ({
  rates: { electricityRate: DEFAULT_ELECTRICITY_RATE, waterRate: DEFAULT_WATER_RATE },
  setRates: (rates) => set({ rates }),
  fetchRates: async () => {
    const data = await apiGetRates();
    set({ rates: data });
  },
  updateRates: async (updates) => {
    const newRates = { ...get().rates, ...updates };
    set({ rates: newRates });
    await apiUpdateRates(newRates);
  },
}));

// ─── Room Store ───────────────────────────────────────────────────────────────

interface RoomState {
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  fetchRooms: () => Promise<void>;
  addRoom: (room: Room) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  getRoomById: (id: string) => Room | undefined;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  fetchRooms: async () => {
    const data = await apiGetRooms();
    set({ rooms: data });
  },
  addRoom: async (room) => {
    await apiAddRoom(room);
    set((s) => ({ rooms: [...s.rooms, room] }));
  },
  updateRoom: async (id, updates) => {
    await apiUpdateRoom(id, updates);
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },
  deleteRoom: async (id) => {
    await apiDeleteRoom(id);
    set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) }));
  },
  getRoomById: (id) => get().rooms.find((r) => r.id === id),
}));

// ─── Tenancy Store ────────────────────────────────────────────────────────────

interface TenancyState {
  tenancies: Tenancy[];
  setTenancies: (tenancies: Tenancy[]) => void;
  fetchTenancies: () => Promise<void>;
  addTenancy: (tenancy: Tenancy) => Promise<void>;
  updateTenancy: (id: string, updates: Partial<Tenancy>) => Promise<void>;
  getTenancyById: (id: string) => Tenancy | undefined;
  getActiveTenancyByRoom: (roomId: string) => Tenancy | undefined;
  getPastTenanciesByRoom: (roomId: string) => Tenancy[];
  getAllPastTenancies: () => Tenancy[];
  moveOutTenant: (tenancyId: string, moveOutDate: string) => Promise<void>;
}

export const useTenancyStore = create<TenancyState>((set, get) => ({
  tenancies: [],
  setTenancies: (tenancies) => set({ tenancies }),
  fetchTenancies: async () => {
    const data = await apiGetTenancies();
    set({ tenancies: data });
  },
  addTenancy: async (tenancy) => {
    await apiAddTenancy(tenancy);
    set((s) => ({ tenancies: [...s.tenancies, tenancy] }));
  },
  updateTenancy: async (id, updates) => {
    await apiUpdateTenancy(id, updates);
    set((s) => ({
      tenancies: s.tenancies.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },
  getTenancyById: (id) => get().tenancies.find((t) => t.id === id),
  getActiveTenancyByRoom: (roomId) =>
    get().tenancies.find((t) => t.roomId === roomId && t.status === 'active'),
  getPastTenanciesByRoom: (roomId) =>
    get().tenancies.filter((t) => t.roomId === roomId && t.status === 'moved_out'),
  getAllPastTenancies: () =>
    get().tenancies.filter((t) => t.status === 'moved_out'),
  moveOutTenant: async (tenancyId, moveOutDate) => {
    const tenancy = get().getTenancyById(tenancyId);
    if (!tenancy) return;
    await apiUpdateTenancy(tenancyId, { status: 'moved_out', moveOutDate });
    await apiUpdateRoom(tenancy.roomId, { status: 'vacant', currentTenancyId: null });
    set((s) => ({
      tenancies: s.tenancies.map((t) =>
        t.id === tenancyId ? { ...t, status: 'moved_out', moveOutDate } : t,
      ),
    }));
    useRoomStore.getState().updateRoom(tenancy.roomId, {
      status: 'vacant', currentTenancyId: null,
    });
  },
}));

// ─── Bill Store ───────────────────────────────────────────────────────────────

interface BillState {
  bills: MonthlyBill[];
  setBills: (bills: MonthlyBill[]) => void;
  fetchBills: () => Promise<void>;
  addBill: (bill: MonthlyBill) => Promise<void>;
  updateBill: (id: string, updates: Partial<MonthlyBill>) => Promise<void>;
  getBillById: (id: string) => MonthlyBill | undefined;
  getBillsByTenancy: (tenancyId: string) => MonthlyBill[];
  getLatestBillByTenancy: (tenancyId: string) => MonthlyBill | undefined;
  getLatestBillByRoom: (roomId: string) => MonthlyBill | undefined;
  recordPayment: (billId: string, amount: number) => Promise<void>;
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  setBills: (bills) => set({ bills }),
  fetchBills: async () => {
    const data = await apiGetBills();
    set({ bills: data });
  },
  addBill: async (bill) => {
    await apiAddBill(bill);
    set((s) => ({ bills: [...s.bills, bill] }));
  },
  updateBill: async (id, updates) => {
    await apiUpdateBill(id, updates);
    set((s) => ({
      bills: s.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  },
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
  recordPayment: async (billId, amount) => {
    const bill = get().getBillById(billId);
    if (!bill) return;
    const newPaid    = bill.amountPaid + amount;
    const newBalance = Math.max(0, bill.totalAmount - newPaid);
    const newStatus  = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
    await apiUpdateBill(billId, { amountPaid: newPaid, balance: newBalance, status: newStatus });
    set((s) => ({
      bills: s.bills.map((b) =>
        b.id === billId
          ? { ...b, amountPaid: newPaid, balance: newBalance, status: newStatus }
          : b,
      ),
    }));
  },
}));

// ─── Payment Store ────────────────────────────────────────────────────────────

interface PaymentState {
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  fetchPayments: () => Promise<void>;
  addPayment: (payment: Payment) => Promise<void>;
  getPaymentsByTenancy: (tenancyId: string) => Payment[];
  getPaymentsByBill: (billId: string) => Payment[];
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  setPayments: (payments) => set({ payments }),
  fetchPayments: async () => {
    const data = await apiGetPayments();
    set({ payments: data });
  },
  addPayment: async (payment) => {
    await apiAddPayment(payment);
    set((s) => ({ payments: [...s.payments, payment] }));
  },
  getPaymentsByTenancy: (tenancyId) =>
    get().payments.filter((p) => p.tenancyId === tenancyId),
  getPaymentsByBill: (billId) =>
    get().payments.filter((p) => p.billId === billId),
}));

// ─── Store initializer ────────────────────────────────────────────────────────
// Call once after login. Fetches all data from MySQL.

export async function initStores(): Promise<void> {
  await Promise.all([
    useRoomStore.getState().fetchRooms(),
    useTenancyStore.getState().fetchTenancies(),
    useBillStore.getState().fetchBills(),
    usePaymentStore.getState().fetchPayments(),
    useRatesStore.getState().fetchRates(),
  ]);
}
