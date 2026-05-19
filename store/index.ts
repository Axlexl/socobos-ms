/**
 * Zustand stores backed by Firestore.
 *
 * Each store:
 *  - Holds data in memory (fast reads for the UI)
 *  - Subscribes to Firestore via onSnapshot (real-time sync)
 *  - Writes go directly to Firestore; the listener updates local state
 *
 * Call initStores() once at app startup (in _layout.tsx) to start listeners.
 */

import { create } from 'zustand';
import {
    DEFAULT_ELECTRICITY_RATE,
    DEFAULT_WATER_RATE,
} from '../constants';
import {
    fsAddBill,
    fsAddPayment,
    fsAddRoom,
    fsAddTenancy,
    fsDeleteRoom,
    fsListenBills,
    fsListenPayments,
    fsListenRates,
    fsListenRooms,
    fsListenTenancies,
    fsSetRates,
    fsUpdateBill,
    fsUpdateRoom,
    fsUpdateTenancy,
} from '../firebase/firestore';
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
}

export const useRatesStore = create<RatesState>((set, get) => ({
  rates: {
    electricityRate: DEFAULT_ELECTRICITY_RATE,
    waterRate: DEFAULT_WATER_RATE,
  },
  setRates: (rates) => set({ rates }),
  updateRates: async (updates) => {
    const newRates = { ...get().rates, ...updates };
    set({ rates: newRates });
    await fsSetRates(newRates);
  },
}));

// ─── Room Store ───────────────────────────────────────────────────────────────

interface RoomState {
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  getRoomById: (id: string) => Room | undefined;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: async (room) => {
    await fsAddRoom(room);
    // Listener will update local state
  },
  updateRoom: async (id, updates) => {
    await fsUpdateRoom(id, updates);
  },
  deleteRoom: async (id) => {
    await fsDeleteRoom(id);
  },
  getRoomById: (id) => get().rooms.find((r) => r.id === id),
}));

// ─── Tenancy Store ────────────────────────────────────────────────────────────

interface TenancyState {
  tenancies: Tenancy[];
  setTenancies: (tenancies: Tenancy[]) => void;
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

  addTenancy: async (tenancy) => {
    await fsAddTenancy(tenancy);
  },

  updateTenancy: async (id, updates) => {
    await fsUpdateTenancy(id, updates);
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
    // Update tenancy
    await fsUpdateTenancy(tenancyId, { status: 'moved_out', moveOutDate });
    // Free up the room
    await fsUpdateRoom(tenancy.roomId, { status: 'vacant', currentTenancyId: null });
  },
}));

// ─── Bill Store ───────────────────────────────────────────────────────────────

interface BillState {
  bills: MonthlyBill[];
  setBills: (bills: MonthlyBill[]) => void;
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

  addBill: async (bill) => {
    await fsAddBill(bill);
  },

  updateBill: async (id, updates) => {
    await fsUpdateBill(id, updates);
  },

  getBillById: (id) => get().bills.find((b) => b.id === id),

  getBillsByTenancy: (tenancyId) =>
    get()
      .bills.filter((b) => b.tenancyId === tenancyId)
      .sort((a, b) => a.month.localeCompare(b.month)),

  getLatestBillByTenancy: (tenancyId) => {
    const sorted = get()
      .bills.filter((b) => b.tenancyId === tenancyId)
      .sort((a, b) => b.month.localeCompare(a.month));
    return sorted[0];
  },

  // Returns the most recent bill for a room across ALL tenancies (for pre-filling meter readings)
  getLatestBillByRoom: (roomId) => {
    const sorted = get()
      .bills.filter((b) => b.roomId === roomId)
      .sort((a, b) => b.month.localeCompare(a.month));
    return sorted[0];
  },

  recordPayment: async (billId, amount) => {
    const bill = get().getBillById(billId);
    if (!bill) return;
    const newPaid = bill.amountPaid + amount;
    const newBalance = bill.totalAmount - newPaid;
    const newStatus =
      newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
    await fsUpdateBill(billId, {
      amountPaid: newPaid,
      balance: Math.max(0, newBalance),
      status: newStatus,
    });
  },
}));

// ─── Payment Store ────────────────────────────────────────────────────────────

interface PaymentState {
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => Promise<void>;
  getPaymentsByTenancy: (tenancyId: string) => Payment[];
  getPaymentsByBill: (billId: string) => Payment[];
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  setPayments: (payments) => set({ payments }),

  addPayment: async (payment) => {
    await fsAddPayment(payment);
  },

  getPaymentsByTenancy: (tenancyId) =>
    get().payments.filter((p) => p.tenancyId === tenancyId),

  getPaymentsByBill: (billId) =>
    get().payments.filter((p) => p.billId === billId),
}));

// ─── Store initializer ────────────────────────────────────────────────────────
// Call this once in _layout.tsx after Firebase is ready.
// Returns a cleanup function that unsubscribes all listeners.

export function initStores(): () => void {
  const unsubRooms = fsListenRooms((rooms) =>
    useRoomStore.getState().setRooms(rooms),
  );

  const unsubTenancies = fsListenTenancies((tenancies) =>
    useTenancyStore.getState().setTenancies(tenancies),
  );

  const unsubBills = fsListenBills((bills) =>
    useBillStore.getState().setBills(bills),
  );

  const unsubPayments = fsListenPayments((payments) =>
    usePaymentStore.getState().setPayments(payments),
  );

  const unsubRates = fsListenRates((rates) =>
    useRatesStore.getState().setRates(rates),
  );

  return () => {
    unsubRooms();
    unsubTenancies();
    unsubBills();
    unsubPayments();
    unsubRates();
  };
}
