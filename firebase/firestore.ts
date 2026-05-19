/**
 * Firestore service layer
 * All database reads and writes go through here.
 * Collections:
 *   /rooms/{roomId}
 *   /tenancies/{tenancyId}
 *   /bills/{billId}
 *   /payments/{paymentId}
 *   /meta/rates          ← single document for utility rates
 */

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
    updateDoc,
    type Unsubscribe
} from 'firebase/firestore';
import type { MonthlyBill, Payment, Room, Tenancy, UtilityRates } from '../types';
import { db } from './config';

// ─── Collection refs ──────────────────────────────────────────────────────────

const roomsCol     = () => collection(db, 'rooms');
const tenanciesCol = () => collection(db, 'tenancies');
const billsCol     = () => collection(db, 'bills');
const paymentsCol  = () => collection(db, 'payments');
const ratesDoc     = () => doc(db, 'meta', 'rates');

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function fsAddRoom(room: Room): Promise<void> {
  await setDoc(doc(db, 'rooms', room.id), room);
}

export async function fsUpdateRoom(id: string, updates: Partial<Room>): Promise<void> {
  await updateDoc(doc(db, 'rooms', id), updates as Record<string, unknown>);
}

export async function fsDeleteRoom(id: string): Promise<void> {
  await deleteDoc(doc(db, 'rooms', id));
}

export function fsListenRooms(callback: (rooms: Room[]) => void): Unsubscribe {
  return onSnapshot(roomsCol(), (snap) => {
    callback(snap.docs.map((d) => d.data() as Room));
  });
}

// ─── Tenancies ────────────────────────────────────────────────────────────────

export async function fsAddTenancy(tenancy: Tenancy): Promise<void> {
  await setDoc(doc(db, 'tenancies', tenancy.id), tenancy);
}

export async function fsUpdateTenancy(id: string, updates: Partial<Tenancy>): Promise<void> {
  await updateDoc(doc(db, 'tenancies', id), updates as Record<string, unknown>);
}

export function fsListenTenancies(callback: (tenancies: Tenancy[]) => void): Unsubscribe {
  return onSnapshot(tenanciesCol(), (snap) => {
    callback(snap.docs.map((d) => d.data() as Tenancy));
  });
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export async function fsAddBill(bill: MonthlyBill): Promise<void> {
  await setDoc(doc(db, 'bills', bill.id), bill);
}

export async function fsUpdateBill(id: string, updates: Partial<MonthlyBill>): Promise<void> {
  await updateDoc(doc(db, 'bills', id), updates as Record<string, unknown>);
}

export function fsListenBills(callback: (bills: MonthlyBill[]) => void): Unsubscribe {
  return onSnapshot(billsCol(), (snap) => {
    callback(snap.docs.map((d) => d.data() as MonthlyBill));
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function fsAddPayment(payment: Payment): Promise<void> {
  await setDoc(doc(db, 'payments', payment.id), payment);
}

export function fsListenPayments(callback: (payments: Payment[]) => void): Unsubscribe {
  return onSnapshot(paymentsCol(), (snap) => {
    callback(snap.docs.map((d) => d.data() as Payment));
  });
}

// ─── Utility Rates ────────────────────────────────────────────────────────────

export async function fsGetRates(): Promise<UtilityRates | null> {
  const snap = await getDoc(ratesDoc());
  return snap.exists() ? (snap.data() as UtilityRates) : null;
}

export async function fsSetRates(rates: UtilityRates): Promise<void> {
  await setDoc(ratesDoc(), rates);
}

export function fsListenRates(callback: (rates: UtilityRates) => void): Unsubscribe {
  return onSnapshot(ratesDoc(), (snap) => {
    if (snap.exists()) callback(snap.data() as UtilityRates);
  });
}
